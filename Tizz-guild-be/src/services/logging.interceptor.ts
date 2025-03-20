import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const ip = req.ip;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `${method} ${url} ${
              context.switchToHttp().getResponse().statusCode
            } - ${ip} - ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
