import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { LoggingInterceptor } from "./services/logging.interceptor";
import { AllExceptionsFilter } from "./services/http-exception.filter"; // Import the exception filter
import basicAuth from "@fastify/basic-auth";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cluster = require("cluster");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimit = require("@fastify/rate-limit");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require("@fastify/helmet");

const numCPUs = 6;

function validate(
  username: string,
  password: string,
  req: any,
  reply: any,
  done: any,
) {
  if (
    username === process.env.SWAGGER_USER &&
    password === process.env.SWAGGER_PASSWORD
  ) {
    done();
  } else {
    done(new Error("Unauthorized"));
  }
}

async function bootstrap() {
  if (cluster.isPrimary && process.env.NODE_ENV !== "development") {
    console.log(`isPrimary pid=${process.pid}`);
    let isCronWorkerSet = false;
    const workerMap: Record<number, any> = {};
    let cronWorkerId = null;
    if (process.env.NODE_ENV !== "development") {
      if (!isCronWorkerSet) {
        const worker = cluster.fork({ CRON_WORKER: "true" });
        cronWorkerId = worker.id;
        isCronWorkerSet = true;
      } else {
        cluster.fork();
      }

      cluster.on("online", (worker) => {
        console.log(`worker ${worker.process.pid} online`);
      });
      cluster.on("fork", (worker) => {
        console.log(`worker ${worker.process.pid} fork`);
      });

      for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        workerMap[worker.id] = worker;
      }

      cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        delete workerMap[worker.id];

        if (worker.id === cronWorkerId) {
          const newWorker = cluster.fork({ CRON_WORKER: "true" });

          workerMap[newWorker.id] = newWorker;
          cronWorkerId = newWorker.id;
          console.log(`Reassigned Cron job to worker ${cronWorkerId}`);
        }
      });
    }
  } else {
    console.log(`[pid=${process.pid}] CRON_WORKER=${process.env.CRON_WORKER}`);
    const adapter = new FastifyAdapter({ trustProxy: true });
    adapter.register(rateLimit, {
      max: 50,
      timeWindow: "1 minute",
    });
    adapter.register(helmet, {
      global: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
          connectSrc: ["'self'", "https:", "wss:"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
        xssFilter: true,
        noSniff: true,
        frameguard: { action: "deny" },
        hsts: {
          maxAge: 63072000,
          includeSubDomains: true,
          preload: true,
        },
      },
    });

    adapter.register(basicAuth, { validate, authenticate: true });

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      adapter,
    );
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      }),
    );
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    app.useStaticAssets({ root: join(__dirname, "../../fastify-file-upload") });
    app.getHttpAdapter().getInstance().server.setTimeout(60000);
    app.setGlobalPrefix("api"); // This line adds the '/api' prefix

    const config = new DocumentBuilder()
      .setTitle("Tizz Guild API")
      .setDescription("The Tizz Guild API description")
      .setVersion("1.0")
      .addTag("Guild API")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app
      .getHttpAdapter()
      .getInstance()
      .addHook("onRequest", async (req, reply) => {
        if (req.raw.url.startsWith("/api/docs")) {
          await new Promise((resolve, reject) => {
            app
              .getHttpAdapter()
              .getInstance()
              .basicAuth(req, reply, (err: Error) => {
                if (err) {
                  reply.status(401).send("Unauthorized");
                  reject(err);
                } else {
                  resolve(null);
                }
              });
          });
        }
      });

    SwaggerModule.setup("api/docs", app, document);
    const PORT: number = parseInt(process.env.PORT || "3030", 10);
    const host = process.env.HOST || "0.0.0.0";
    await app.listen(PORT, host);
    console.log(`Server running on ${PORT}`);
  }
}

bootstrap();
