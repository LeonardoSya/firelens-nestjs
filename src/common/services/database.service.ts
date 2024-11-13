import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      ...this.configService.get('database'),
    });
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }
}
