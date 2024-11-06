import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import GitHubStrategy from "passport-github";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { envConfig } from "./env.config";
import AuthService from "../services/auth.service";
import UserService from "../services/user.service";

class PassportConfig {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {
    this.configureDiscordStrategy();
    this.configureGitHubStrategy();
    this.configureGoogleStrategy();
    this.configureSerialization();
  }

  /**
   * Configures the Discord authentication strategy
   *
   */
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
        async (
          req,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const email = profile.email || "";

            const userProfile = {
              id: profile.id,
              username: profile.username,
              avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
              email,
            };

            const user = await this.userService.findOrCreateUserFromProfile(
              userProfile,
              "discord"
            );

            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );
  }

  /**
   * Configures the GitHub authentication strategy
   */

  private configureGitHubStrategy() {
    passport.use(
      new GitHubStrategy(
        {
          clientID: envConfig.GITHUB_CLIENT_ID,
          clientSecret: envConfig.GITHUB_CLIENT_SECRET,
          callbackURL: envConfig.GITHUB_CALLBACK_URL,
          scope: ["user:email"],
          passReqToCallback: true,
        },
        async (
          req,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const email = await this.authService.fetchGitHubEmails(accessToken);

            const userProfile = {
              id: profile.id,
              username: profile.username,
              avatar: profile.photos[0].value,
              email,
            };

            const user = await this.userService.findOrCreateUserFromProfile(
              userProfile,
              "github"
            );
            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );
  }

  private configureGoogleStrategy() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: envConfig.GOOGLE_CLIENT_ID,
          clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
          callbackURL: envConfig.GOOGLE_CALLBACK_URL,
          passReqToCallback: true,
          scope: ["profile", "email"],
        },
        async (
          req,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const email = profile.emails[0].value;

            const userProfile = {
              id: profile.id,
              username: profile.displayName,
              avatar: profile.photos[0].value,
              email,
            };

            console.log("Google Profile:", profile);

            const user = await this.userService.findOrCreateUserFromProfile(
              userProfile,
              "google"
            );
            done(null, user);
          } catch (error) {
            done(error, false);
          }
        }
      )
    );
  }

  /**
   * Configures the serialization and deserialization of user objects
   */
  private configureSerialization() {
    passport.serializeUser((user: any, done) => {
      if (!user || !user.id) {
        return done(
          new Error("User object is invalid or missing id for serialization"),
          null
        );
      }
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await this.userService.getUserById(id);
        if (!user) {
          return done(new Error("User not found during deserialization"), null);
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }
}

export default PassportConfig;
