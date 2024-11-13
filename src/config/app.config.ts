import { registerAs } from '@nestjs/config';
import { AppConfig } from 'src/config/config.interface';

export default registerAs(
  'app',
  (): Partial<AppConfig> => ({
    port: parseInt(process.env.PORT, 10) || 3000,
  }),
);
