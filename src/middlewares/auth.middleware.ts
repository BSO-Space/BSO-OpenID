import { NextFunction, Request, Response } from 'express'
import AuthService from '../services/auth.service'
import UserService from '../services/user.service'
import { JwtPayload } from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User>
    }
  }
}

class AuthMiddleware {
  private authService: AuthService
  private userService: UserService

  constructor (authService: AuthService, userService: UserService) {
    this.authService = authService
    this.userService = userService
  }

  public authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      // Retrieve token from Authorization header or cookies
      const authHeader = req.headers.authorization
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.cookies.accessToken

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'No token provided'
        })
      }

      // Verify the access token

      const jwtPayload: JwtPayload | null =
        this.authService.verifyAccessToken(token)

      if (!jwtPayload) {
        return res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid token'
        })
      }

      const user = await this.userService.getUserById(jwtPayload.sub!)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'User not found'
        })
      }

      req.user = user
      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error
      })
    }
  }

  // Optional: Middleware to verify refresh tokens
  public verifyRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token missing!',
          error: 'No refresh token provided'
        })
      }

      const user = this.authService.verifyRefreshToken(refreshToken)
      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' })
      }

      req.user = user
      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: error
      })
    }
  }
}

export default AuthMiddleware
