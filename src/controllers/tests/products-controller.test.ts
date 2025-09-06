import { Request, Response, NextFunction } from 'express';
import { ProductController } from '../products-controllers';
import { knex } from '@/database/knex';
import { AppError } from '@/utils/AppError';

// Mock das dependências
jest.mock('@/database/knex');
jest.mock('@/utils/AppError');

const mockKnex = knex as jest.Mocked<typeof knex>;

describe('ProductController', () => {
  let controller: ProductController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new ProductController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset todos os mocks
    jest.clearAllMocks();
  });

  describe('index', () => {
    it('should return all products when no name filter is provided', async () => {
      // Arrange
      mockRequest.query = {};
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10.50 },
        { id: 2, name: 'Product 2', price: 20.00 },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        whereLike: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockProducts),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockKnexChain.select).toHaveBeenCalled();
      expect(mockKnexChain.whereLike).toHaveBeenCalledWith('name', '%%');
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('name');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should filter products by name when name query is provided', async () => {
      // Arrange
      mockRequest.query = { name: 'Pizza' };
      const mockProducts = [
        { id: 1, name: 'Pizza Margherita', price: 25.00 },
        { id: 2, name: 'Pizza Pepperoni', price: 28.00 },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        whereLike: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockProducts),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnexChain.whereLike).toHaveBeenCalledWith('name', '%Pizza%');
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      mockRequest.query = {};
      const databaseError = new Error('Database error');

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        whereLike: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(databaseError),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(databaseError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      // Arrange
      mockRequest.body = {
        name: 'New Product',
        price: 15.50,
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockInsertChain);

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('products');
      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        name: 'New Product',
        price: 15.50,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw validation error for invalid name (too short)', async () => {
      // Arrange
      mockRequest.body = {
        name: 'abc',
        price: 15.50,
      };

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid price (zero or negative)', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Valid Product Name',
        price: 0,
      };

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should throw validation error for missing fields', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Valid Product Name',
        // price missing
      };

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should trim product name before saving', async () => {
      // Arrange
      mockRequest.body = {
        name: '  Trimmed Product  ',
        price: 15.50,
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockInsertChain);

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        name: 'Trimmed Product',
        price: 15.50,
      });
    });

    it('should call next with error when database insert fails', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Valid Product',
        price: 15.50,
      };

      const mockInsertChain = {
        insert: jest.fn().mockRejectedValue(new Error('Insert failed')),
      };

      (mockKnex as any).mockReturnValueOnce(mockInsertChain);

      // Act
      await controller.create(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Product',
        price: 25.00,
      };

      const existingProduct = { id: 1, name: 'Old Product', price: 20.00 };

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingProduct),
      };

      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockFindChain);
      (mockKnex as any).mockReturnValueOnce(mockUpdateChain);
      mockKnex.fn = {
        now: jest.fn().mockReturnValue('CURRENT_TIMESTAMP'),
      } as any;

      // Act
      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockFindChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockUpdateChain.update).toHaveBeenCalledWith({
        name: 'Updated Product',
        price: 25.00,
        updated_at: 'CURRENT_TIMESTAMP',
      });
      expect(mockUpdateChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockRequest.body = {
        name: 'Updated Product',
        price: 25.00,
      };

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      (mockKnex as any).mockReturnValueOnce(mockFindChain);

      // Act
      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AppError).toHaveBeenCalledWith('Product not found');
    });

    it('should throw validation error for invalid id parameter', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = {
        name: 'Updated Product',
        price: 25.00,
      };

      // Act
      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw validation error for invalid body data', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'abc', // too short
        price: 25.00,
      };

      // Act
      await controller.update(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const existingProduct = { id: 1, name: 'Product to Delete', price: 20.00 };

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingProduct),
      };

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockFindChain);
      (mockKnex as any).mockReturnValueOnce(mockDeleteChain);

      // Act
      await controller.remove(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockFindChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockDeleteChain.delete).toHaveBeenCalled();
      expect(mockDeleteChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error when product not found for deletion', async () => {
      // Arrange
      mockRequest.params = { id: '999' };

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      (mockKnex as any).mockReturnValueOnce(mockFindChain);

      // Act
      await controller.remove(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AppError).toHaveBeenCalledWith('Product not found');
    });

    it('should throw validation error for invalid id parameter', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await controller.remove(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when database delete fails', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const existingProduct = { id: 1, name: 'Product', price: 20.00 };

      const mockFindChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingProduct),
      };

      const mockDeleteChain = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('Delete failed')),
      };

      (mockKnex as any).mockReturnValueOnce(mockFindChain);
      (mockKnex as any).mockReturnValueOnce(mockDeleteChain);

      // Act
      await controller.remove(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});