import express from "express";
import { KeyController } from "../controllers/key.controller";
import { requirePermission } from "../middlewares/role.middleware";
import AuthMiddleware from "../middlewares/auth.middleware";
import UserService from "../services/user.service";
import { CryptoService } from "../services/crypto.service";
import { KeyService } from "../services/key.service";
import { ServicesService } from "../services/service.service";

const servicesService = new ServicesService();
const keyService = new KeyService();
const keyController = new KeyController(keyService, servicesService);
const userService = new UserService();
const cryptoService = new CryptoService();
const authMiddleware = new AuthMiddleware(userService, cryptoService);

const router = express.Router();
// Generate Key Pair - Requires "manage:keys" permission
router.post(
  "/keys/:service/generate",
  authMiddleware.authenticate,
  requirePermission("manage:keys"),
  (req, res) => keyController.generateAllKeys(req, res)
);

// Get Key - Requires "read:keys" permission
router.get(
  "/keys/:service/:keyType",
  authMiddleware.authenticate,
  requirePermission("read:keys"),
  (req, res) => keyController.getKey(req, res)
);



export {router as keyRoutes};
