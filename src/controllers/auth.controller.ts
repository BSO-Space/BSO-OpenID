import { Request, Response, NextFunction } from "express";
import passport from "passport";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { ServicesService } from "../services/service.service";

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
      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken(user);

      await this.authService.logAudit(
        user.id,
        "ACCESS_SERVICE",
        req.ip || "",
        req.get("User-Agent") || ""
      );

      res.json({
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
}
