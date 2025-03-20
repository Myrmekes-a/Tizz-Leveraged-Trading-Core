import { Injectable, NestMiddleware } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";
import * as jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET_KEY;
const adminSecretKey = process.env.ADMIN_JWT_SECRET_KEY;
const refreshToken = process.env.JWT_REFRESH_SECRET_KEY;
@Injectable()
export class IsAuthenticatedMiddleware implements NestMiddleware {
  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        jwt.verify(token, secretKey, (error, decoded) => {
          if (error) {
            console.log(error);
            (req as any).userId = null;
            next();
          } else {
            const jwtPayload = decoded as jwt.JwtPayload;
            (req as any).userId = jwtPayload.userId;
            next();
          }
        });
      } else {
        (req as any).userId = null;
        next();
      }
    } catch (error) {
      console.error(error);
      (req as any).userId = null;
      next();
      return { message: "Unauthorized" };
    }
  }
}

export class isRefreshAuthenticatedMiddleware implements NestMiddleware {
  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        jwt.verify(token, refreshToken, (error, decoded) => {
          if (error) {
            console.log(error);
            (req as any).userId = null;
            next();
          } else {
            const jwtPayload = decoded as jwt.JwtPayload;
            (req as any).userId = jwtPayload.userId;
            next();
          }
        });
      } else {
        (req as any).userId = null;
        next();
      }
    } catch (error) {
      console.error(error);
      (req as any).userId = null;
      next();
      return { message: "Unauthorized" };
    }
  }
}
export class isAdminAuthenticatedMiddleware implements NestMiddleware {
  async use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (token) {
        jwt.verify(token, adminSecretKey, (error, decoded) => {
          if (error) {
            console.log(error);
            (req as any).adminId = null;
            next();
          } else {
            const jwtPayload = decoded as jwt.JwtPayload;
            (req as any).adminId = jwtPayload.adminId;
            next();
          }
        });
      } else {
        (req as any).adminId = null;
        next();
      }
    } catch (error) {
      console.error(error);
      return { message: "Unauthorized" };
      next();
    }
  }
}
