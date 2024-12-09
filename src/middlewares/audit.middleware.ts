import { Request, Response, NextFunction } from "express";
import AuthService from "../services/auth.service";

class AuditMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async logAccess(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const ipAddress = req.ip || "";
      const userAgent = req.get("User-Agent") || "";
    }
    next();
  }
}

export default new AuditMiddleware();
