import { Request, Response, NextFunction } from 'express';
import { OrdersController } from '../orders-controller';
import { knex } from '@/database/knex';
import { AppError } from '@/utils/AppError';

// Mock das dependências
jest.mock('@/database/knex');
jest.mock('@/utils/AppError');

const mockKnex = knex as jest.Mocked<typeof knex>;

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new OrdersController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset todos os mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new order successfully', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 1,
        product_id: 2,
        quantity: 3,
      };

      const mockSession = {
        id: 1,
        table_id: 5,
        opened_at: new Date(),
        closed_at: null,
      };

      const mockProduct = {
        id: 2,
        name: 'Pizza',
        price: 25.5,
      };

      const mockSessionChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSession),
      };

      const mockProductChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockProduct),
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any)
        .mockReturnValueOnce(mockSessionChain) // tables_sessions query
        .mockReturnValueOnce(mockProductChain) // products query
        .mockReturnValueOnce(mockInsertChain); // orders insert

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockSessionChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockProductChain.where).toHaveBeenCalledWith({ id: 2 });
      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        table_session_id: 1,
        product_id: 2,
        quantity: 3,
        price: 25.5,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error when session not found', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 999,
        product_id: 2,
        quantity: 3,
      };

      const mockSessionChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      (mockKnex as any).mockReturnValueOnce(mockSessionChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith('session table not found');
    });

    it('should throw error when session is closed', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 1,
        product_id: 2,
        quantity: 3,
      };

      const mockClosedSession = {
        id: 1,
        table_id: 5,
        opened_at: new Date(),
        closed_at: new Date(),
      };

      const mockSessionChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockClosedSession),
      };

      (mockKnex as any).mockReturnValueOnce(mockSessionChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith('this table is closed');
    });

    it('should throw error when product not found', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 1,
        product_id: 999,
        quantity: 3,
      };

      const mockSession = {
        id: 1,
        table_id: 5,
        opened_at: new Date(),
        closed_at: null,
      };

      const mockSessionChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSession),
      };

      const mockProductChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      (mockKnex as any)
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockProductChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith('product not found');
    });

    it('should throw validation error for invalid body data', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 'invalid',
        product_id: 2,
        quantity: 3,
      };

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw validation error for missing fields', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 1,
        // product_id missing
        quantity: 3,
      };

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use product price when creating order', async () => {
      // Arrange
      mockRequest.body = {
        table_session_id: 1,
        product_id: 2,
        quantity: 2,
      };

      const mockSession = {
        id: 1,
        closed_at: null,
      };

      const mockProduct = {
        id: 2,
        name: 'Burger',
        price: 15.99,
      };

      const mockSessionChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockSession),
      };

      const mockProductChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockProduct),
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any)
        .mockReturnValueOnce(mockSessionChain)
        .mockReturnValueOnce(mockProductChain)
        .mockReturnValueOnce(mockInsertChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        table_session_id: 1,
        product_id: 2,
        quantity: 2,
        price: 15.99,
      });
    });
  });

  describe('index', () => {
    it('should return orders for a table session with join', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '1' };

      const mockOrders = [
        {
          id: 1,
          table_session_id: 1,
          product_id: 2,
          name: 'Pizza',
          price: 25.5,
          quantity: 2,
          total: 51.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          table_session_id: 1,
          product_id: 3,
          name: 'Burger',
          price: 15.99,
          quantity: 1,
          total: 15.99,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockOrders),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValue('(orders.price * orders.quantity) AS total') as any;

      // Act
      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('orders');
      expect(mockKnexChain.select).toHaveBeenCalledWith(
        'orders.id',
        'orders.table_session_id',
        'orders.product_id',
        'products.name',
        'orders.price',
        'orders.quantity',
        '(orders.price * orders.quantity) AS total',
        'orders.created_at',
        'orders.updated_at',
      );
      expect(mockKnexChain.join).toHaveBeenCalledWith(
        'products',
        'products.id',
        'orders.product_id',
      );
      expect(mockKnexChain.where).toHaveBeenCalledWith({ table_session_id: 1 });
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith(
        'orders.created_at',
        'desc',
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should throw validation error for invalid table_session_id', async () => {
      // Arrange
      mockRequest.params = { table_session_id: 'invalid' };

      // Act
      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return empty array when no orders found', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '999' };

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValue('(orders.price * orders.quantity) AS total') as any;

      // Act
      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '1' };

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValue('(orders.price * orders.quantity) AS total') as any;

      // Act
      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('show', () => {
    it('should return order summary with total and quantity', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '1' };

      const mockSummary = [
        {
          total: 66.99,
          quantity: 3,
        },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockSummary),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.price * orders.quantity), 0) AS total',
        )
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.quantity), 0) AS quantity',
        ) as any;

      // Act
      await controller.show(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockKnex).toHaveBeenCalledWith('orders');
      expect(mockKnexChain.select).toHaveBeenCalledWith(
        'COALESCE(SUM(orders.price * orders.quantity), 0) AS total',
        'COALESCE(SUM(orders.quantity), 0) AS quantity',
      );
      expect(mockKnexChain.where).toHaveBeenCalledWith({
        table_session_id: '1',
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockSummary);
    });

    it('should return zero values when no orders exist', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '999' };

      const mockEmptySummary = [
        {
          total: 0,
          quantity: 0,
        },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockEmptySummary),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.price * orders.quantity), 0) AS total',
        )
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.quantity), 0) AS quantity',
        ) as any;

      // Act
      await controller.show(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(mockEmptySummary);
    });

    it('should handle string table_session_id parameter', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '5' };

      const mockSummary = [{ total: 50.0, quantity: 2 }];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockSummary),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.price * orders.quantity), 0) AS total',
        )
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.quantity), 0) AS quantity',
        ) as any;

      // Act
      await controller.show(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockKnexChain.where).toHaveBeenCalledWith({
        table_session_id: '5',
      });
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      mockRequest.params = { table_session_id: '1' };

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      mockKnex.raw = jest
        .fn()
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.price * orders.quantity), 0) AS total',
        )
        .mockReturnValueOnce(
          'COALESCE(SUM(orders.quantity), 0) AS quantity',
        ) as any;

      // Act
      await controller.show(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
