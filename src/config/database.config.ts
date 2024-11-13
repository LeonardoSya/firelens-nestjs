import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from 'src/config/config.interface';

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
);
