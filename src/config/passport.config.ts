import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";
import { envConfig } from "./env.config";

class PassportConfig {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {
    this.configureDiscordStrategy();
  }

  private configureDiscordStrategy() {
    passport.use(
      new DiscordStrategy(
        {
          clientID: envConfig.DISCORD_CLIENT_ID,
          clientSecret: envConfig.DISCORD_CLIENT_SECRET,
          callbackURL: envConfig.DISCORD_CALLBACK_URL,
          scope: ["identify", "email"],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const user = await this.authService.findOrCreateUserFromProfile(
              profile,
              "discord"
            );

            req.session.service = req.query.state as string;
            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );

    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (userId: string, done) => {
      try {
        const user = await this.userService.getUserById(userId);
        if (!user) {
          done(new Error("User not found"), false);
        } else {
          done(null, user);
        }
      } catch (error) {
        done(error, null);
      }
    });
  }
}

export default PassportConfig;
