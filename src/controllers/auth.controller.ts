import { Request, Response, NextFunction } from "express";
import passport from "passport";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { ServicesService } from "../services/service.service";
import { envConfig } from "../config/env.config";
import { JwtPayload } from "jsonwebtoken";

declare module "express-session" {
  interface Session {
    service?: string;
  }
}

/**
 * Controller class for authentication routes
 * @class AuthController
 */
export class AuthController {
  private authService: AuthService;
  private servicesService: ServicesService;
  private userService: UserService;

  constructor(
    authService: AuthService,
    servicesService: ServicesService,
    userService: UserService
  ) {
    this.authService = authService;
    this.servicesService = servicesService;
    this.userService = userService;

    this.discordAuth = this.discordAuth.bind(this);
    this.discordCallback = this.discordCallback.bind(this);
    this.githubAuth = this.githubAuth.bind(this);
    this.githubCallback = this.githubCallback.bind(this);
    this.authSuccess = this.authSuccess.bind(this);
    this.logout = this.logout.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  /**
   * Initiates the Discord authentication process
   */
  public async discordAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { service } = req.query;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    req.session.service = service as string;
    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      passport.authenticate("discord", {
        state: service as string,
      })(req, res, next);
    });
  }

  /**
   * Callback function for Discord authentication
   */
  public async discordCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const service = req.query.state as string;

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service information missing",
          error: "Service information is required to authenticate",
        });
      }

      const existingServices = await this.servicesService.findByNames(service);
      if (!existingServices || !existingServices.public) {
        return res.status(403).json({
          success: false,
          message: "Service not found or disabled",
          error: `Service '${service}' is not available.`,
        });
      }

      const userId = (req.user as { id: string }).id;
      const userHasService = await this.userService.userHasService(
        userId,
        service
      );

      if (!userHasService && existingServices.public) {
        await this.servicesService.createUserService(
          userId,
          existingServices.id
        );
      }

      const user = req.user as any;
      await this.authService.logAudit(
        user.id,
        "LOGIN",
        req.ip || "",
        req.get("User-Agent") || ""
      );

      res.redirect(`/auth/success?service=${service}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiates the GitHub authentication process
   */
  public async githubAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const serviceName = req.query.service as string;

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    req.session.service = serviceName;
    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      passport.authenticate("github", {
        state: serviceName,
      })(req, res, next);
    });
  }

  /**
   * Callback function for GitHub authentication
   */
  public async githubCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const serviceName = req.query.state as string;

      if (!serviceName) {
        return res.status(400).json({
          success: false,
          message: "Service information missing",
          error: "Service information is required to authenticate",
        });
      }

      const existingServices = await this.servicesService.findByNames(
        serviceName
      );
      if (!existingServices || !existingServices.public) {
        return res.status(403).json({
          success: false,
          message: "Service not found or disabled",
          error: `Service '${serviceName}' is not available.`,
        });
      }

      const userId = (req.user as { id: string }).id;
      const userHasService = await this.userService.userHasService(
        userId,
        serviceName
      );

      if (!userHasService && existingServices.public) {
        await this.servicesService.createUserService(
          userId,
          existingServices.id
        );
      }

      const user = req.user as any;
      await this.authService.logAudit(
        user.id,
        "LOGIN",
        req.ip || "",
        req.get("User-Agent") || ""
      );

      res.redirect(`/auth/success?service=${serviceName}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Successful authentication response
   */
  public async authSuccess(req: Request, res: Response): Promise<any> {
    try {
      const service = req.query.service as string;

      if (!req.isAuthenticated() || !service) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "User not authenticated or service information missing",
        });
      }

      const user = req.user as any;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "User not authenticated",
        });
      }
      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken(user);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? `${envConfig.DOMAIN}`
            : "localhost",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? `${envConfig.DOMAIN}`
            : "localhost",
      });

      await this.authService.logAudit(
        user.id,
        "ACCESS_SERVICE",
        req.ip || "",
        req.get("User-Agent") || ""
      );

      return res.json({
        message: `Login successful for service ${service}`,
        user: user,
        service: service,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ error: error });
    }
  }

  public async logout(req: Request, res: Response): Promise<any> {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);
        return res.status(500).json({ error: "Failed to destroy session" });
      }

      return res.json({
        success: true,
        message: "Logout successful",
        error: null,
      });
    });
  }

  public async refresh(req: Request, res: Response): Promise<any> {
    try {
      // Get the refresh token from the request
      const refreshToken =
        req.cookies.refreshToken || req.headers["x-refresh-token"];

      // Check if the refresh token is provided
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Refresh token not provided",
        });
      }

      // Verify the refresh token
      const jwtPayload: JwtPayload | null =
        this.authService.verifyRefreshToken(refreshToken);

      // Check if the refresh token is valid
      if (!jwtPayload) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid refresh token",
        });
      }

      // Check if the user ID is present in the payload
      if (!jwtPayload || !jwtPayload.sub) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid refresh token",
        });
      }

      //  Get the user from the database
      const user = await this.userService.getUserById(jwtPayload.sub!);

      // Check if the user exists
      if (!jwtPayload || !user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid refresh token",
        });
      }

      // Generate a new access token
      const accessToken = this.authService.generateAccessToken(user);

      // Generate a new refresh token
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? `${envConfig.DOMAIN}`
            : "localhost",
      });

      // Send the new access token and refresh token in the response

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? `${envConfig.DOMAIN}`
            : "localhost",
      });

      // Log the audit event
      return res.json({
        success: true,
        message: "Token refreshed",
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }
}
