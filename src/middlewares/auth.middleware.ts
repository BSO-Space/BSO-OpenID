import { NextFunction, Request, Response } from 'express'
import UserService from '../services/user.service'
import { JwtPayload } from 'jsonwebtoken'
import { CryptoService } from '../services/crypto.service'

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User>
    }
  }
}

class AuthMiddleware {
  private userService: UserService
  private cryptoService: CryptoService

  constructor ( userService: UserService,cryptoService: CryptoService) {
    this.userService = userService
    this.cryptoService = cryptoService
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


      const decode = this.cryptoService.decodeToken(token)
      // Verify the access token

      const jwtPayload: JwtPayload | any =
        this.cryptoService.verifyAccessToken(token, decode?.service)

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
      const decode = this.cryptoService.decodeToken(refreshToken)

      // Verify the access token

      const user = this.cryptoService.verifyRefreshToken(refreshToken,decode?.service)

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authorization failed!',
          error: 'Invalid token'
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
}

export default AuthMiddleware
