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
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { keyRoutes } from "./routes/key.routes";

const app = express();

const corsOptions = {
  origin: `${envConfig.NODE_ENV === "production"
      ? envConfig.FRONTEND_URL
      : "http://localhost:3000"
    } `,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve the index.html directly for the /docs path
app.get("/docs", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "../public/docs/index.html")
  );
});

// request rate limiter
const limiter = rateLimit({
  windowMs: parseInt(envConfig.MAX_RATE_LIMIT_WINDOW_MS),
  max: parseInt(envConfig.MAX_RATE_LIMIT_PER_IP),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after some time",
    error: "Your IP has been rate limited due to excessive requests",
  },
});

app.use(limiter);

app.use(morgan(`${envConfig.NODE_ENV === "production" ? "combined" : "dev"}`));

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

// Initialize Passport
new PassportConfig(authService, userService);

app.use(passport.initialize());
app.use(passport.session());

app.use(auditMiddleware.logAccess.bind(auditMiddleware));

app.use("/api/v1/auth", authRoutes);
app.use('/api/v1', keyRoutes);

app.get("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "not found",
    error: "You services not found!",
  });
});

export default app;
