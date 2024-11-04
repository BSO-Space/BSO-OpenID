import { Request, Response, NextFunction } from "express";
import passport from "passport";
import AuthService from "../services/auth.service";
import ServicesService from "../services/services.service";
import UserService from "../services/user.service";

declare module "express-session" {
  interface Session {
    service?: string;
  }
}

/**
 * Controller class for authentication routes
 * @class AuthController
 * @property {AuthService} authService Instance of AuthService
 * @property {ServicesService} servicesService Instance of ServicesService
 * @property {UserService} userService Instance of UserService
 * @method discordAuth Initiates the Discord authentication process
 * @method discordCallback Callback function for Discord authentication
 * @method authSuccess Successful authentication response
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

    // Bind methods to maintain 'this' context
    this.discordAuth = this.discordAuth.bind(this);
    this.discordCallback = this.discordCallback.bind(this);
    this.authSuccess = this.authSuccess.bind(this);
  }

  /**
   * Initiates the Discord authentication process
   * @param req Request object
   * @param res Response object
   * @param next Next function
   * @returns Redirects to Discord authentication
   */

  public discordAuth(req: Request, res: Response, next: NextFunction): any {
    // Check if service information is provided
    const { service } = req.query;

    // Check if service information is provided
    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    // Save service information to session and authenticate
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
   * @param req Request object
   * @param res Response object
   * @param next Next function
   * @returns Redirects to success route
   */

  public async discordCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      // Check if user is authenticated and service information is provided
      const serviceName = req.query.state as string;

      // Check if user is authenticated and service information is provideds
      if (!serviceName) {
        return res
          .status(400)
          .json({ error: "Service information missing from session" });
      }

      // Check if service exists and is enabled
      const existingServices = await this.servicesService.findByNames(
        serviceName
      );

      // Check if service exists and is enabled
      if (!existingServices || !existingServices.public) {
        return res.status(403).json({
          success: false,
          message: "Service not found or disabled",
          error: `Service '${serviceName}' is not available.`,
        });
      }

      // Check if user has service and create if public
      const userId = (req.user as { id: string }).id;

      // Check if user has service and create if public
      const userHasService = await this.userService.userHasService(
        userId,
        serviceName
      );

      // Check if user has service and create if public
      if (!userHasService && existingServices.public) {
        await this.servicesService.createUserService(
          userId,
          existingServices.id
        );
      }

      // Log audit event
      const user = req.user as any;
      const ipAddress = req.ip || "";
      const userAgent = req.get("User-Agent") || "";
      await this.authService.logAudit(user.id, "LOGIN", ipAddress, userAgent);

      res.redirect(`/auth/success?service=${serviceName}`);
    } catch (error) {
      next(error as Error);
    }
  }

  /**
   * Successful authentication response
   * @param req Request object
   * @param res Response object
   * @returns JSON response with user and token information
   */

  public async authSuccess(req: Request, res: Response): Promise<any> {
    try {
      // Check if user is authenticated and service information is provided
      const service = req.query.service as string;
      const validServices = ["service1", "service2", "blog"];

      // Check if user is authenticated and service information is provided
      if (!req.isAuthenticated() || !service) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "User not authenticated or service information missing",
        });
      }

      // Check if service is valids
      if (!validServices.includes(service)) {
        return res.status(400).json({
          success: false,
          message: "Invalid service",
          error: `Service '${service}' is not recognized.`,
        });
      }

      // Generate tokens and log audit
      const user = req.user as any;
      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken(user);

      // Log audit event
      const ipAddress = req.ip || "";
      const userAgent = req.get("User-Agent") || "";
      await this.authService.logAudit(
        user.id,
        "ACCESS_SERVICE",
        ipAddress,
        userAgent
      );

      // Send response with user and token information
      res.json({
        message: `Login successful for service ${service}`,
        user: user,
        service: service,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
