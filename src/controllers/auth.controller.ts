import { Request, Response, NextFunction } from "express";
import passport from "passport";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { ServicesService } from "../services/service.service";
import { envConfig } from "../config/env.config";
import { JwtPayload } from "jsonwebtoken";
import { User } from "@prisma/client";
import { HookService } from "../services/hook.service";
import { CryptoService } from "../services/crypto.service";

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
  private hookService: HookService;
  private cryptoService: CryptoService;

  constructor(
    authService: AuthService,
    servicesService: ServicesService,
    userService: UserService,
    hookService: HookService,
    cryptoService: CryptoService
  ) {
    this.authService = authService;
    this.servicesService = servicesService;
    this.userService = userService;
    this.hookService = hookService;
    this.cryptoService = cryptoService;

    this.discordAuth = this.discordAuth.bind(this);
    this.discordCallback = this.discordCallback.bind(this);
    this.githubAuth = this.githubAuth.bind(this);
    this.githubCallback = this.githubCallback.bind(this);
    this.googleAuth = this.googleAuth.bind(this);
    this.googleCallback = this.googleCallback.bind(this);
    this.me = this.me.bind(this);
    this.authSuccess = this.authSuccess.bind(this);
    this.logout = this.logout.bind(this);
    this.refresh = this.refresh.bind(this);
    this.signup = this.signup.bind(this);
    this.login = this.login.bind(this);
  }

  /**
   * Initiates the Discord authentication process
   */
  public async discordAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { service, redirect } = req.query;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    if (!redirect) {
      return res.status(400).json({
        success: false,
        message: "Redirect URL missing",
        error: "Redirect URL is required to authenticate",
      });
    }

    req.session.service = service as string;

    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      passport.authenticate("discord", {
        state: JSON.stringify({
          service: service as string,
          redirect: redirect as string,
        }),
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
      const { service, redirect } = JSON.parse(req.query.state as string);

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

      res.redirect(`/auth/success?service=${service}&redirect=${redirect}`);
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
    const redirect = req.query.redirect as string;

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    if (!redirect) {
      return res.status(400).json({
        success: false,
        message: "Redirect URL missing",
        error: "Redirect URL is required to authenticate",
      });
    }

    req.session.service = serviceName;
    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      passport.authenticate("github", {
        state: JSON.stringify({
          service: serviceName as string,
          redirect: redirect as string,
        }),
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
      const { service, redirect } = JSON.parse(req.query.state as string);

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

      res.redirect(`/auth/success?service=${service}&redirect=${redirect}`);
    } catch (error) {
      next(error);
    }
  }

  public async googleAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { service, redirect } = req.query;

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Service information missing",
        error: "Service information is required to authenticate",
      });
    }

    if (!redirect) {
      return res.status(400).json({
        success: false,
        message: "Redirect URL missing",
        error: "Redirect URL is required to authenticate",
      });
    }

    req.session.service = service as string;

    req.session.save((err) => {
      if (err) {
        console.error("Failed to save session:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      passport.authenticate("google", {
        state: JSON.stringify({
          service: service as string,
          redirect: redirect as string,
        }),
      })(req, res, next);
    });
  }

  public async googleCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const { service, redirect } = JSON.parse(req.query.state as string);

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
      await this.servicesService.createUserService(userId, existingServices.id);
    }

    const user = req.user as any;
    await this.authService.logAudit(
      user.id,
      "LOGIN",
      req.ip || "",
      req.get("User-Agent") || ""
    );

    res.redirect(`/auth/success?service=${service}&redirect=${redirect}`);
  }

  /**
   * Successful authentication response
   */
  public async authSuccess(req: Request, res: Response): Promise<any> {
    try {
      const service = req.query.service as string;
      const redirect = req.query.redirect as string;

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

      // send hook to microservices
      const sendHooks = await this.hookService.sendLoginNotification(
        user,
        service,
        req.ip || "",
        req.get("User-Agent") || ""
      );

      if (!sendHooks) {
        return res.redirect(redirect || "/");
      }

      const accessToken = this.authService.generateAccessToken(user, service);
      const refreshToken = this.authService.generateRefreshToken(user, service);

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

      return res.redirect(redirect || "/");
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

      const service = req.query.service as string;

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service information missing",
          error: "Service information is required to authenticate",
        });
      }

      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Service information missing",
          error: "Service information is required to authenticate",
        });
      }

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
        this.authService.verifyAccessToken(refreshToken);

      // Check if the refresh token is valid
      if (!jwtPayload) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid refresh token",
        });
      }

      // Check if the user has the service
      const userHasService = await this.userService.userHasService(
        jwtPayload.sub!,
        service
      );

      // Check if the user ID is present in the payload
      if (!jwtPayload || !jwtPayload.sub || !userHasService) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid refresh token or service",
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
      const accessToken = this.authService.generateAccessToken(user, service);

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

  public async me(req: Request, res: Response): Promise<any> {
    try {
      const user = req.user as User;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "User not authenticated",
        });
      }

      return res.json({
        success: true,
        message: "Get my user info successful",
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error,
      });
    }
  }

  public async signup(req: Request, res: Response): Promise<any> {
    try {
      const { email, password, username } = req.body;
      const service = req.query.service as string;
  
      // Validate required fields
      if (!email || !password || !username) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          error: "Email, password, and username are required",
        });
      }
  
      // Validate the service query
      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          error: "Service information is required",
        });
      }
  
      // Check if the email or username already exists
      const existingUserByEmail = await this.userService.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: "Conflict",
          error: "Email is already registered",
        });
      }
  
      const existingUserByUsername = await this.userService.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          message: "Conflict",
          error: "Username is already taken",
        });
      }
  
      // Hash the password before storing it
      const hashedPassword = await this.cryptoService.hashPassword(password);
  
      // Create the new user
      const newUser = await this.userService.createUser({
        email,
        username,
        password: hashedPassword,
        firstName: null,
        lastName: null,
        image: null,
        updatedAt: new Date(),
        deletedAt: null,
      });
  
      // Log audit event for user signup
      await this.authService.logAudit(
        newUser.id,
        "SIGNUP",
        req.ip || "",
        req.get("User-Agent") || ""
      );
  
      // Automatically assign the user to the requested service
      const existingService = await this.servicesService.findByNames(service);
      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: "Not Found",
          error: `Service '${service}' is not available.`,
        });
      }
  
      await this.servicesService.createUserService(newUser.id, existingService.id);
  
      // Generate tokens
      const accessToken = this.authService.generateAccessToken(newUser, service);
      const refreshToken = this.authService.generateRefreshToken(newUser, service);
  
      // Set cookies for tokens
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain: process.env.NODE_ENV === "production" ? `${envConfig.DOMAIN}` : "localhost",
      });
  
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        domain: process.env.NODE_ENV === "production" ? `${envConfig.DOMAIN}` : "localhost",
      });
  
      // Return success response
      return res.status(201).json({
        success: true,
        message: "User signed up successfully",
        data: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
        },
      });
    } catch (error) {
      console.error("Signup Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error || error,
      });
    }
  }  

  public async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;
      const service = req.query.service as string;
  
      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          error: "Email and password are required.",
        });
      }
  
      if (!service) {
        return res.status(400).json({
          success: false,
          message: "Bad Request",
          error: "Service information is required.",
        });
      }
  
      // Check if the service exists and is valid
      const existingService = await this.servicesService.findByNames(service);
      if (!existingService || !existingService.public) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          error: `Service '${service}' is not available or disabled.`,
        });
      }
  
      // Check if the user exists
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid email or password.",
        });
      }
  
      // Verify the password
      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid email or password.",
        });
      }

      const isPasswordValid = await this.cryptoService.comparePasswords(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
          error: "Invalid email or password.",
        });
      }
  
      // Check if the user has access to the service
      const userHasService = await this.userService.userHasService(user.id, service);
      if (!userHasService) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
          error: `User does not have access to the '${service}' service.`,
        });
      }
  
      // Generate access and refresh tokens
      const accessToken = this.authService.generateAccessToken(user, service);
      const refreshToken = this.authService.generateRefreshToken(user, service);
  
      // Set tokens as cookies
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
  
      // Log audit event
      await this.authService.logAudit(
              user.id,
              "LOGIN",
              req.ip || "",
              req.get("User-Agent") || ""
            );
  
      // Return success response
      return res.json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error || "An error occurred during login.",
      });
    }
  }
}
