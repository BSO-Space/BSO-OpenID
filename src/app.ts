import express from "express";
import session from "express-session";
import passport from "passport";
import morgan from "morgan";
import { envConfig } from "./config/env.config";
import authRoutes from "./routes/auth.routes";
import auditMiddleware from "./middlewares/audit.middleware";
import PassportConfig from "./config/passport.config";
import AuthService from "./services/auth.service";
import UserService from "./services/user.service";

const app = express();

app.use(morgan("dev"));

app.use(
  session({
    secret: envConfig.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const authService = new AuthService();
const userService = new UserService();
new PassportConfig(authService, userService);

app.use(passport.initialize());
app.use(passport.session());

app.use(auditMiddleware.logAccess.bind(auditMiddleware));
app.use("/auth", authRoutes);

export default app;
