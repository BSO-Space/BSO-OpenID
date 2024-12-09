import express from "express";
import UserController from "../controllers/user.controller";
import { requirePermission } from "../middlewares/role.middleware";
import AuthMiddleware from "../middlewares/auth.middleware";
import UserService from "../services/user.service";

import { CryptoService } from "../services/crypto.service";

const router = express.Router();
const userController = new UserController();
const userService = new UserService();
const crypetoService = new CryptoService();
const authMiddleware = new AuthMiddleware(userService,crypetoService);

// CREATE User - Accessible to users with "manage:user" permission
router.post(
  "/users",
  authMiddleware.authenticate,
  requirePermission("manage:user"),
  (req, res) => userController.createUser(req, res)
);

// READ All Users - Accessible to users with "view:user" permission
router.get(
  "/users",
  authMiddleware.authenticate,
  requirePermission("read:user"),
  (req, res) => userController.getAllUsers(req, res)
);

// READ User by ID - Accessible to users with "view:user" permission
router.get(
  "/users/:id",
  authMiddleware.authenticate,
  requirePermission("view:user"),
  (req, res) => userController.getUserById(req, res)
);

// // UPDATE User - Accessible to users with "manage:user" permission
// router.put("/users/:id", requirePermission("manage:user"), (req, res) =>
//   userController.updateUser(req, res)
// );

// // DELETE User - Accessible to users with "delete:user" permission
// router.delete("/users/:id", requirePermission("delete:user"), (req, res) =>
//   userController.deleteUser(req, res)
// );

export default router;
