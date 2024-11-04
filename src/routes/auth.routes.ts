import { Router } from "express";
import passport from "passport";
import { AuthController } from "../controllers/auth.controller";
import AuthService from "../services/auth.service";
import ServicesService from "../services/services.service";
import UserService from "../services/user.service";
const router = Router();
const authService = new AuthService();
const servicesService = new ServicesService();
const userService = new UserService();

// Create an instance of the AuthController
const authController = new AuthController(
  authService,
  servicesService,
  userService
);

// Define the routes for the authentication process
router.get("/discord", authController.discordAuth);

// Define the callback route for Discord authentication
router.get(
  "/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/auth/failure" }),
  authController.discordCallback
);

// Define the failure route for authentication
router.get("/success", authController.authSuccess);

export default router;
