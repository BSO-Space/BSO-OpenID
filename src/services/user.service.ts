/**
 * USerService this class is used to interact with the database
 * and perform CRUD operations on the User model.
 */
import { PrismaClient, User } from "@prisma/client";

/**
 * UserService this class is used to interact with the database
 * and perform CRUD operations on the User model.
 * @method createUser create a new user
 * @method getAllUsers retrieve all users
 * @method getUserById retrieve a user by ID
 * @method getUserByUsername retrieve a user by username
 * @method getUserByEmail retrieve a user by email
 * @method userHasService check if a user has a specific service

 */
class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * createUser create a new user
   * @param data the user data
   * @returns the newly created user
   */

  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    try {
      const newUser = await this.prisma.user.create({
        data,
      });
      return newUser;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`);
      } else {
        throw new Error("Failed to create user: Unknown error");
      }
    }
  }

  /**
   * getAllUsers retrieve all users
   * @returns all users
   */

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve users: ${error.message}`);
      } else {
        throw new Error("Failed to retrieve users: Unknown error");
      }
    }
  }

  /**
   * getUserById retrieve a user by ID
   * @param id the user ID
   * @returns the user with the specified ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by ID: ${error.message}`);
      } else {
        throw new Error("Failed to retrieve user by ID: Unknown error");
      }
    }
  }

  /**
   *  userHasService check if a user has a specific service
   * @param userId  the user ID
   * @param service the service name
   * @returns true if the user has the service, false otherwise
   */

  async userHasService(userId: string, service: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userServices: {
            where: {
              service: { name: service },
            },
            include: {
              service: true,
            },
          },
        },
      });

      if (!user || user.userServices.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to retrieve user service info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**s
   * getUserByUsername retrieve a user by username
   * @param username the username
   * @returns the user with the specified username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to retrieve user by username: ${error.message}`
        );
      } else {
        throw new Error("Failed to retrieve user by username: Unknown error");
      }
    }
  }

  /**
   *  getUserByEmail retrieve a user by email
   * @param email  the email
   * @returns  the user with the specified email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by email: ${error.message}`);
      } else {
        throw new Error("Failed to retrieve user by email: Unknown error");
      }
    }
  }
}

export default UserService;
