import { Request, Response, NextFunction } from 'express';
import { TablesController } from '../tables-controller';
import { knex } from '@/database/knex';

// Mock das dependências
jest.mock('@/database/knex');

const mockKnex = knex as jest.Mocked<typeof knex>;

describe('TablesController', () => {
  let controller: TablesController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new TablesController();
    mockRequest = {};
    mockResponse = {
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset todos os mocks
    jest.clearAllMocks();
  });

  describe('index', () => {
    it('should return all tables ordered by table_number', async () => {
      // Arrange
      const mockTables = [
        { id: 1, table_number: 1, status: 'available' },
        { id: 2, table_number: 2, status: 'occupied' },
        { id: 3, table_number: 3, status: 'reserved' },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockTables),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('tables');
      expect(mockKnexChain.select).toHaveBeenCalled();
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('table_number');
      expect(mockResponse.json).toHaveBeenCalledWith(mockTables);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return empty array when no tables exist', async () => {
      // Arrange
      const mockTables: any[] = [];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockTables),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('tables');
      expect(mockKnexChain.select).toHaveBeenCalled();
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('table_number');
      expect(mockResponse.json).toHaveBeenCalledWith(mockTables);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(databaseError),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('tables');
      expect(mockKnexChain.select).toHaveBeenCalled();
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('table_number');
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(databaseError);
    });

    it('should handle SQL errors appropriately', async () => {
      // Arrange
      const sqlError = new Error('Table "tables" does not exist');
      sqlError.name = 'SqlError';

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(sqlError),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(sqlError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle network errors appropriately', async () => {
      // Arrange
      const networkError = new Error('Connection timeout');
      networkError.name = 'NetworkError';

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(networkError),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(networkError);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should verify the correct knex query chain is called', async () => {
      // Arrange
      const mockTables = [
        { id: 1, table_number: 5 },
        { id: 2, table_number: 10 },
        { id: 3, table_number: 15 },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockTables),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      // Verifica se a sequência de chamadas está correta
      expect(mockKnex).toHaveBeenCalledTimes(1);
      expect(mockKnexChain.select).toHaveBeenCalledTimes(1);
      expect(mockKnexChain.orderBy).toHaveBeenCalledTimes(1);
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('table_number');
      
      // Verifica se o resultado foi retornado corretamente
      expect(mockResponse.json).toHaveBeenCalledWith(mockTables);
    });

    it('should not modify request or response when successful', async () => {
      // Arrange
      const originalRequest = { ...mockRequest };
      const mockTables = [{ id: 1, table_number: 1 }];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockTables),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest).toEqual(originalRequest);
      expect(mockResponse.json).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});