import { Router } from "express";
import passport from "passport";
import { AuthController } from "../controllers/auth.controller";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { ServicesService } from "../services/service.service";
import AuthMiddleware from "../middlewares/auth.middleware";
import { HookService } from "../services/hook.service";
const router = Router();
const authService = new AuthService();
const servicesService = new ServicesService();
const userService = new UserService();
const authMiddleware = new AuthMiddleware(authService, userService);
const hookService = new HookService(servicesService);
// Create an instance of the AuthController
const authController = new AuthController(
  authService,
  servicesService,
  userService,
  hookService
);

// Define the routes for the authentication process
router.get("/discord", authController.discordAuth);

// Define the callback route for Discord authentication
router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/auth/failure" }),
  authController.discordCallback
);

// Define the routes for the authentication process
router.get("/github", authController.githubAuth);

// Define the callback route for GitHub authentication
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/failure" }),
  authController.githubCallback
);

// Define the routes for the authentication process
router.get("/google", authController.googleAuth);

// Define the callback route for Google authentication
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  authController.googleCallback
);

// Define the failure route for authentication
router.get("/success", authController.authSuccess);

// Define the failure route for authentication
router.get("/refresh", authController.refresh);

// Define the failure route for authentication
router.get("/me", authMiddleware.authenticate, authController.me);

// Define the failure route for authentication
router.delete("/logout", authController.logout);

export default router;
