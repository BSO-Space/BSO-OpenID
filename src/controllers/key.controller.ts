import { Request, Response } from 'express';
import { KeyService } from '../services/key.service';
import { ServicesService } from '../services/service.service';

export class KeyController {
  private keyService: KeyService;
  private serviceService: ServicesService;

  constructor(keyService: KeyService, serviceService: ServicesService) {
    this.keyService = keyService;
    this.serviceService = serviceService;
  }

  /**
   * Generate all key pairs for a service.
   * If keys already exist, they will be deleted first.
   */
  public async generateAllKeys(req: Request, res: Response): Promise<void> {
    const { service } = req.params;

    if (!service) {
      res.status(400).json({ success: false, message: 'Failed to generate keys' , error: 'Service name is required' });
      return;
    }

    try {
      // Check if service exists
      const serviceExists = await this.serviceService.findByNames(service);

      if(!serviceExists){
        res.status(404).json({ success: false, message: 'Failed to generate keys' , error: 'Service not found' });
        return;
      }

      // Delete existing keys
      await this.keyService.deleteKeys(service);

      // Generate new key pairs
      await Promise.all([
        this.keyService.generateKeyPair(service, 'Access'),
        this.keyService.generateKeyPair(service, 'Refresh'),
      ]);

      res.status(201).json({ success: true, message: `All keys generated for service: ${service}` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to generate keys', error: error });
    }
  }

  /**
   * Get a public key for a service.
   */
  public async getKey(req: Request, res: Response): Promise<void> {
    const { service, keyType } = req.params;

    // Validate required parameters
    if (!service || !keyType) {
      res.status(400).json({
        success: false,
        message: 'Service name and key type are required',
        error: 'Service name and key type are required',
      });
      return;
    }

    // Validate key type
    const keyTypeNormalized = keyType.toUpperCase();
    if (keyTypeNormalized !== 'ACCESS' && keyTypeNormalized !== 'REFRESH') {
      res.status(400).json({
        success: false,
        message: 'Invalid key type',
        error: 'Key type must be "Access" or "Refresh"',
      });
      return;
    }

    try {
      // Retrieve the public key
      const key = await this.keyService.getKey(service, keyTypeNormalized as 'Access' | 'Refresh');
      res.status(200).json({ success: true, key });
    } catch (error) {
      // Handle specific error scenarios
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Key not found',
          error: error.message,
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve key',
          error: errorMessage,
        });
      }
    }
  }
}
