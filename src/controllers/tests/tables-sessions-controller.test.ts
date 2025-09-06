import { Request, Response, NextFunction } from 'express';
import { TablesSessionsController } from '../tables-sessions-controller';
import { knex } from '@/database/knex';
import { AppError } from '@/utils/AppError';

// Mock das dependências
jest.mock('@/database/knex');
jest.mock('@/utils/AppError');

const mockKnex = knex as jest.Mocked<typeof knex>;

describe('TablesSessionsController', () => {
  let controller: TablesSessionsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new TablesSessionsController();
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
    it('should create a new table session successfully', async () => {
      // Arrange
      mockRequest.body = { table_id: 1 };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // Nenhuma sessão encontrada
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      (mockKnex as any).mockReturnValueOnce(mockInsertChain);
      mockKnex.fn = {
        now: jest.fn().mockReturnValue('CURRENT_TIMESTAMP'),
      } as any;

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockKnexChain.where).toHaveBeenCalledWith({ table_id: 1 });
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('opened_at', 'desc');
      expect(mockKnexChain.first).toHaveBeenCalled();
      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        table_id: 1,
        opened_at: 'CURRENT_TIMESTAMP',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should create a new session when existing session is closed', async () => {
      // Arrange
      mockRequest.body = { table_id: 1 };

      const existingClosedSession = {
        id: 1,
        table_id: 1,
        opened_at: new Date(),
        closed_at: new Date(),
      };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingClosedSession),
      };

      const mockInsertChain = {
        insert: jest.fn().mockResolvedValue([1]),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);
      (mockKnex as any).mockReturnValueOnce(mockInsertChain);
      mockKnex.fn = {
        now: jest.fn().mockReturnValue('CURRENT_TIMESTAMP'),
      } as any;

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error when table already has an open session', async () => {
      // Arrange
      mockRequest.body = { table_id: 1 };

      const existingOpenSession = {
        id: 1,
        table_id: 1,
        opened_at: new Date(),
        closed_at: null,
      };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingOpenSession),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith(
        'this table has already been opened',
      );
    });

    it('should throw error for invalid table_id', async () => {
      // Arrange
      mockRequest.body = { table_id: 'invalid' };

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      mockRequest.body = { table_id: 1 };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('index', () => {
    it('should return all sessions ordered by closed_at', async () => {
      // Arrange
      const mockSessions = [
        { id: 1, table_id: 1, opened_at: new Date(), closed_at: null },
        { id: 2, table_id: 2, opened_at: new Date(), closed_at: new Date() },
      ];

      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockSessions),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.index(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockKnexChain.select).toHaveBeenCalled();
      expect(mockKnexChain.orderBy).toHaveBeenCalledWith('closed_at');
      expect(mockResponse.json).toHaveBeenCalledWith(mockSessions);
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      const mockKnexChain = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

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

  describe('update', () => {
    it('should close a session successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const existingSession = {
        id: 1,
        table_id: 1,
        opened_at: new Date(),
        closed_at: null,
      };

      const mockFindChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingSession),
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
      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockFindChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockFindChain.first).toHaveBeenCalled();
      expect(mockUpdateChain.update).toHaveBeenCalledWith({
        closed_at: 'CURRENT_TIMESTAMP',
      });
      expect(mockUpdateChain.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error when session not found', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith('session table not found');
    });

    it('should throw error when session is already closed', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const existingClosedSession = {
        id: 1,
        table_id: 1,
        opened_at: new Date(),
        closed_at: new Date(),
      };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingClosedSession),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(AppError).toHaveBeenCalledWith(
        'this session table has already been closed',
      );
    });

    it('should throw error for invalid id parameter', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid' };

      // Act
      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when database operation fails', async () => {
      // Arrange
      mockRequest.params = { id: '1' };

      const mockKnexChain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (mockKnex as any).mockReturnValueOnce(mockKnexChain);

      // Act
      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
