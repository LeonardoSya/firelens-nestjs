import { registerAs } from '@nestjs/config';
import * as path from 'path';

export default registerAs('nasaFirms', () => ({
  url: process.env.NASA_FIRMS_URL,
  tempDir: path.join(process.cwd(), 'src', 'temp'),
  ndviPath: path.join(process.cwd(), 'data', 'ndvi2407.tif'),
}));
