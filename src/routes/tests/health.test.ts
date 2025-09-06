import request from 'supertest';
import express from 'express';
import { healthRoutes } from '../health';

// Alternativa: Teste unitário direto do handler
describe('Health Routes - Unit Tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let sendSpy: jest.Mock;

  beforeEach(() => {
    mockRequest = {};

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    sendSpy = jest.fn();

    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
      send: sendSpy,
    };

    jest.clearAllMocks();
  });

  // Extraindo o handler da rota para teste direto
  const healthHandler = async (_: any, res: any) => {
    try {
      res.json({ status: 'OK', timeStamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).send('Error generating metrics');
    }
  };

  describe('Health Handler', () => {
    it('should return status OK with timestamp', async () => {
      // Arrange
      const mockDate = new Date('2023-10-15T10:30:00.000Z');
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as any;
      // @ts-ignore
      global.Date.prototype = originalDate.prototype;

      // Act
      await healthHandler(mockRequest, mockResponse);

      // Assert
      expect(jsonSpy).toHaveBeenCalledWith({
        status: 'OK',
        timeStamp: '2023-10-15T10:30:00.000Z',
      });

      // Restore
      global.Date = originalDate;
    });

    it('should return current timestamp when called', async () => {
      // Act
      await healthHandler(mockRequest, mockResponse);

      // Assert
      expect(jsonSpy).toHaveBeenCalledTimes(1);
      const calledWith = jsonSpy.mock.calls[0][0];

      expect(calledWith).toHaveProperty('status', 'OK');
      expect(calledWith).toHaveProperty('timeStamp');
      expect(typeof calledWith.timeStamp).toBe('string');
      expect(calledWith.timeStamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should handle Date constructor errors', async () => {
      // Arrange
      const originalDate = global.Date;
      global.Date = jest.fn(() => {
        throw new Error('Date constructor error');
      }) as any;

      // Act
      await healthHandler(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(sendSpy).toHaveBeenCalledWith('Error generating metrics');
      expect(jsonSpy).not.toHaveBeenCalled();

      // Restore
      global.Date = originalDate;
    });

    it('should handle res.json errors', async () => {
      // Arrange
      jsonSpy.mockImplementation(() => {
        throw new Error('JSON error');
      });

      // Act
      await healthHandler(mockRequest, mockResponse);

      // Assert
      expect(jsonSpy).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(sendSpy).toHaveBeenCalledWith('Error generating metrics');
    });

    it('should not call error methods on success', async () => {
      // Act
      await healthHandler(mockRequest, mockResponse);

      // Assert
      expect(statusSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledTimes(1);
    });
  });
});

// Teste de integração usando supertest
describe('Health Routes - Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('should return 200 with status OK and timestamp', async () => {
      // Act
      const response = await request(app).get('/health').expect(200);

      // Assert
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timeStamp');
      expect(typeof response.body.timeStamp).toBe('string');
      expect(response.body.timeStamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should return valid timestamp format', async () => {
      // Act
      const response = await request(app).get('/health').expect(200);

      // Assert
      const timestamp = response.body.timeStamp;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should return different timestamps on consecutive calls', async () => {
      // Act
      const response1 = await request(app).get('/health');

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));

      const response2 = await request(app).get('/health');

      // Assert
      expect(response1.body.timeStamp).not.toBe(response2.body.timeStamp);
      expect(response1.body.status).toBe('OK');
      expect(response2.body.status).toBe('OK');
    });

    it('should have correct response headers', async () => {
      // Act
      const response = await request(app).get('/health').expect(200);

      // Assert
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});

// Teste para verificar se a rota está configurada corretamente
describe('Health Routes - Route Configuration', () => {
  it('should have the correct route defined', () => {
    // Verificar se a rota está configurada
    expect(healthRoutes).toBeDefined();
    expect(typeof healthRoutes).toBe('function');
  });
});
