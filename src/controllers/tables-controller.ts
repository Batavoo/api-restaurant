import { Request, Response, NextFunction } from 'express';
//import { AppError } from '@/utils/AppError';
//import { z } from 'zod';
import { knex } from '@/database/knex';

class TablesController {
  async index(request: Request, response: Response, next: NextFunction) {
    try {
      const tables = await knex<tableRepository>('tables')
        .select()
        .orderBy('table_number');

      return response.json(tables);
    } catch (error) {
      next(error);
    }
  }
}

export { TablesController };
