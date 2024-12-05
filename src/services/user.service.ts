/**
 * USerService this class is used to interact with the database
 * and perform CRUD operations on the User model.
 */
import { Account, PrismaClient, User } from '@prisma/client'

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
  private prisma: PrismaClient

  constructor () {
    this.prisma = new PrismaClient()
  }

  /**
   * me retrieve the user and their services
   * @param userId the user ID
   * @returns the user and their services
   */
  async me (userId: string) {
    try {
      return await this.prisma.user.findMany({
        where: {
          id: userId
        },
        include: {
          userServices: {
            where: {
              deletedAt: null
            },
            select: {
              id: true,
              userId: true,
              serviceId: true,
              createdAt: true,
              updatedAt: true
            }
          },
          accounts: {
            where: {
              deletedAt: null
            },
            select: {
              id: true,
              userId: true,
              provider: true,
              providerAccountId: true,
              providerUserName: true,
              providerImage: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error retrieving user services:', error)
      throw new Error(
        'Failed to retrieve user services. Please try again later.'
      )
    }
  }

  /**
   * findOrCreateUserFromProfile find or create a user from a profile
   * @param profile  the user profile
   * @param provider the provider name
   * @returns the user
   */

  public async findOrCreateUserFromProfile (
    profile: { id: string; username: string; email: string; avatar: string },
    provider: string
  ): Promise<Partial<User>> {
    // Extract the relevant fields from the profile
    const { id, username, email, avatar } = profile

    // Use the email to generate a username
    const newUserName = email.split('@')[0]

    // Check if the user already exists
    let user = await this.prisma.user.findFirst({
      where: { email },
      include: { accounts: true }
    })

    // If the user exists, check if the account already exists
    if (user) {
      // Check if the account already exists
      const existingAccount = user.accounts?.find(
        account => account.provider === provider
      )

      // If the account does not exist, create it
      if (!existingAccount) {
        await this.prisma.account.create({
          data: {
            provider,
            providerAccountId: id,
            userId: user.id,
            providerUserName: username,
            providerImage: avatar
          }
        })
      }

      const userWihtoutPassword = { ...user, password: undefined }

      return userWihtoutPassword
    }

    // If the user does not exist, create a new user
    user = await this.prisma.user.create({
      data: {
        username: newUserName,
        email,
        image: avatar,
        accounts: {
          create: {
            provider,
            providerAccountId: id,
            providerImage: avatar,
            providerUserName: username
          }
        }
      },
      include: {
        accounts: true
      }
    })

    return user
  }

  /**
   * createUser create a new user
   * @param data the user data
   * @returns the newly created user
   */

  async createUser (data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const newUser = await this.prisma.user.create({
        data
      })
      return newUser
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`)
      } else {
        throw new Error('Failed to create user: Unknown error')
      }
    }
  }

  async createUserAccount (
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<void> {
    try {
      await this.prisma.account.create({
        data: {
          provider,
          userId,
          providerAccountId
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user account: ${error.message}`)
      } else {
        throw new Error('Failed to create user account: Unknown error')
      }
    }
  }
  /**
   *  find or create user from profile
   * @param profile- user profile
   * @param provider- provider name
   * @returns the user
   */

  async getByProviderNameAndEmail (
    providerName: string,
    email: string
  ): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        include: {
          accounts: {
            where: {
              provider: providerName,
              user: {
                email
              }
            }
          }
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to retrieve user by provider account ID: ${error.message}`
        )
      } else {
        throw new Error(
          'Failed to retrieve user by provider account ID: Unknown error'
        )
      }
    }
  }

  /**
   * getUserAndAccountByEmail retrieve a user and their accounts by email
   * @param email the user email
   * @returns the user and their accounts
   */

  async getUserAndAccountByEmail (email: string): Promise<{
    user: User | null
    accounts: Account[] | null
  }> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email },
        include: {
          accounts: {
            where: {
              deletedAt: null
            }
          }
        }
      })
      return { user, accounts: user ? user.accounts : null }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by email: ${error.message}`)
      } else {
        throw new Error('Failed to retrieve user by email: Unknown error')
      }
    }
  }

  /**
   * getAllUsers retrieve all users
   * @returns all users
   */

  async getAllUsers (
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: pageSize
      }),
      this.prisma.user.count()
    ])

    return { users, total }
  }

  /**
   * getUserById retrieve a user by ID
   * @param id the user ID
   * @returns the user with the specified ID
   */
  async getUserById (id: string): Promise<Partial<User> | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by ID: ${error.message}`)
      } else {
        throw new Error('Failed to retrieve user by ID: Unknown error')
      }
    }
  }

  /**
   *  userHasService check if a user has a specific service
   * @param userId  the user ID
   * @param service the service name
   * @returns true if the user has the service, false otherwise
   */

  async userHasService (userId: string, service: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userServices: {
            where: {
              service: { name: service }
            },
            include: {
              service: true
            }
          }
        }
      })

      if (!user || user.userServices.length === 0) {
        return false
      }

      return true
    } catch (error) {
      throw new Error(
        `Failed to retrieve user service info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**s
   * getUserByUsername retrieve a user by username
   * @param username the username
   * @returns the user with the specified username
   */
  async getUserByUsername (username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by username: ${error.message}`)
      } else {
        throw new Error('Failed to retrieve user by username: Unknown error')
      }
    }
  }

  /**
   *  getUserByEmail retrieve a user by email
   * @param email  the email
   * @returns  the user with the specified email
   */
  async getUserByEmail (email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user by email: ${error.message}`)
      } else {
        throw new Error('Failed to retrieve user by email: Unknown error')
      }
    }
  }

  async userHasRole (userId: string, roleName: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          name: roleName
        }
      }
    })
    return !!userRole
  }

  async userHasPermission (
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } }
        }
      }
    })

    return userRoles.some(userRole =>
      userRole.role.permissions.some(
        permission => permission.permission.name === permissionName
      )
    )
  }
}

export default UserService
