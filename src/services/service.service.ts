import { PrismaClient, Prisma, Service } from "@prisma/client";

/**
 * ServicesService this class is used to interact with the database
 * and perform CRUD operations on the Service model.
 * @method createService create a new service
 * @method findManyServices retrieve multiple services
 * @method findUniqueService retrieve a unique service
 * @method updateService update a service
 * @method deleteService delete a service
 * @method findByNames retrieve a service by name
 * @method createUserService create a new user service
 */
export class ServicesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Finds a service by name.
   * @param name - The name of the service to find.
   * @returns The found service object or null if not found.
   */

  async findByNames(name: string): Promise<Service | null> {
    try {
      return await this.prisma.service.findFirst({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
          deletedAt: null,
        },
      });
    } catch (error) {
      console.error("Error retrieving services:", error);
      throw new Error("Failed to retrieve services. Please try again later.");
    }
  }

  /**
   * Creates a new service entry in the database.
   * @param data - The data for the service to be created.
   * @returns The created service object.
   */
  async createService(
    data: Prisma.ServiceCreateInput
  ): Promise<Service | null> {
    try {
      return await this.prisma.service.create({
        data,
      });
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service. Please try again later.");
    }
  }

  /**
   * Creates a new user service entry in the database. s
   * @param userId
   * @param serviceId
   */
  async createUserService(userId: string, serviceId: string): Promise<void> {
    try {
      // Check if the record already exists
      const existingUserService = await this.prisma.userService.findUnique({
        where: {
          userId_serviceId: { // Adjust this to match your @@unique constraint
            userId,
            serviceId,
          },
        },
      });

      if (existingUserService) {
        return; 
      }

      // Create new UserService record
      await this.prisma.userService.create({
        data: {
          userId,
          serviceId,
        },
      });
    } catch (error) {
      console.error("Error creating user service:", error);
      throw new Error("Failed to create user service. Please try again later.");
    }
  }

  /**
   * Finds multiple services based on provided parameters.
   * @param params - Filtering and pagination options.
   * @returns An array of service objects.
   */
  async findManyServices(
    params?: Prisma.ServiceFindManyArgs
  ): Promise<Service[]> {
    try {
      return await this.prisma.service.findMany(params);
    } catch (error) {
      console.error("Error retrieving services:", error);
      throw new Error("Failed to retrieve services. Please try again later.");
    }
  }

  /**
   * Finds a unique service by a specific condition.
   * @param params - The unique filter for finding a specific service.
   * @returns The found service object or null if not found.
   */
  async findUniqueService(
    params: Prisma.ServiceFindUniqueArgs
  ): Promise<Service | null> {
    try {
      return await this.prisma.service.findUnique(params);
    } catch (error) {
      console.error("Error finding service:", error);
      throw new Error("Failed to find the specified service.");
    }
  }

  /**
   * Updates a specific service.
   * @param params - The data and condition for updating a service.
   * @returns The updated service object.
   */
  async updateService(
    params: Prisma.ServiceUpdateArgs
  ): Promise<Service | null> {
    try {
      return await this.prisma.service.update(params);
    } catch (error) {
      console.error("Error updating service:", error);
      throw new Error("Failed to update service. Please try again later.");
    }
  }

  /**
   * Deletes a specific service.
   * @param params - The condition for deleting a service.
   * @returns The deleted service object.
   */
  async deleteService(
    params: Prisma.ServiceDeleteArgs
  ): Promise<Service | null> {
    try {
      return await this.prisma.service.delete(params);
    } catch (error) {
      console.error("Error deleting service:", error);
      throw new Error("Failed to delete service. Please try again later.");
    }
  }
}
