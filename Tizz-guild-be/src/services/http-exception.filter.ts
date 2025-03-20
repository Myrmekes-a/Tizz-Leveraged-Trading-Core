import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply } from "fastify";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "An unexpected error occurred. Please try again later.";

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (Array.isArray((exceptionResponse as any).message)) {
        message = "Validation failed";
      } else if (typeof (exceptionResponse as any).message === "string") {
        message = (exceptionResponse as any).message;
      }
    }

    // Log the exception details for internal review
    console.error("Exception:", exception);

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
