import { Request, Response, NextFunction } from 'express';
import { OrdersController } from '@/controllers/orders-controller';
import { AppError } from '@/utils/AppError';

const knexMock: Record<string, jest.Mock> = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  select: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn(),
  raw: jest.fn(),
};

jest.mock('../database/knex', () => {
  return {
    knex: jest.fn(() => knexMock),
  };
});

describe('OrdersController - create', () => {
  let ordersController: OrdersController;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    ordersController = new OrdersController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should throw error if session not exists', async () => {
    knexMock.first.mockResolvedValueOnce(undefined);
    const mockRequest = {
      body: { table_session_id: 1, product_id: 1, quantity: 2 },
    } as Request;

    await ordersController.create(
      mockRequest,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect((mockNext.mock.calls[0][0] as AppError).message).toBe(
      'session table not found',
    );
  });

  it('deve criar pedido com sucesso', async () => {
    knexMock.first
      .mockResolvedValueOnce({ id: 1, closed_at: null })
      .mockResolvedValueOnce({ id: 1, price: 10 });

    knexMock.insert.mockResolvedValueOnce([1]);

    const mockRequest = {
      body: { table_session_id: 1, product_id: 1, quantity: 2 },
    } as Request;

    await ordersController.create(
      mockRequest,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith();
    expect(mockNext).not.toHaveBeenCalled();
  });
});
