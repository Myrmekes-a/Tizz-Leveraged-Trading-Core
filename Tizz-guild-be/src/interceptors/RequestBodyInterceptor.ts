import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class RequestBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    if (req.raw && req.raw.body) {
      try {
        // Attempt to parse the request body as JSON
        req.body = JSON.parse(req.raw.body.toString());
      } catch (error) {
        console.error("Error parsing request body:", error);
        req.body = {}; // Set an empty object if parsing fails
      }
    }

    return next.handle().pipe(map((data) => data));
  }
}
