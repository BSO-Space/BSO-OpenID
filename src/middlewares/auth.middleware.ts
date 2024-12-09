import { NextFunction, Request, Response } from 'express';
import UserService from '../services/user.service';
import { JwtPayload } from 'jsonwebtoken';
import { CryptoService } from '../services/crypto.service';
import cacheService from '../services/cache.service';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User>;
    }
  }
}

class AuthMiddleware {
  private userService: UserService;
  private cryptoService: CryptoService;

  constructor(userService: UserService, cryptoService: CryptoService) {
    this.userService = userService;
    this.cryptoService = cryptoService;
  }

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Retrieve token from Authorization header or cookies
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies.accessToken;

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'No token provided',
        });
        return;
      }

      // Decode token to get service
      const decode = this.cryptoService.decodeToken(token);

      if (!decode?.service?.includes('OpenID')) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid service in token',
        });
        return;
      }

      // Verify the access token
      const jwtPayload: JwtPayload | null = this.cryptoService.verifyAccessToken(
        token,
        decode?.service
      );

      if (!jwtPayload) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid token',
        });
        return;
      }

      // Try retrieving the user from cache
      let user = await cacheService.get<Partial<User>>(`users:${jwtPayload.sub}`);

      if (!user) {
        // Fetch user from database if not cached
        user = await this.userService.getUserById(jwtPayload.sub!);

        if (user) {
          // Store user in cache for 10 minutes
          await cacheService.set(`users:${jwtPayload.sub}`, user, 600);
        }
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'User not found',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error || 'Unknown error',
      });
    }
  };

  public verifyRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token missing!',
          error: 'No refresh token provided',
        });
        return;
      }

      const decode = this.cryptoService.decodeToken(refreshToken);

      if (!decode?.service?.includes('OpenID')) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid service in refresh token',
        });
        return;
      }

      const jwtPayload: JwtPayload | null = this.cryptoService.verifyRefreshToken(
        refreshToken,
        decode?.service
      );

      if (!jwtPayload) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid refresh token',
        });
        return;
      }

      // Fetch user from cache or database
      let user = await cacheService.get<Partial<User>>(`users:${jwtPayload.sub}`);

      if (!user) {
        user = await this.userService.getUserById(jwtPayload.sub!);

        if (user) {
          await cacheService.set(`users:${jwtPayload.sub}`, user, 600);
        }
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'User not found',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error || 'Unknown error',
      });
    }
  };
}

export default AuthMiddleware;
