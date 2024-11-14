import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

export interface TiffMetadata {
  image: sharp.Sharp;
  rasters: Buffer;
  width: number;
  height: number;
  bbox: number[];
}

@Injectable()
export class NdviService implements OnModuleInit {
  private readonly logger = new Logger(NdviService.name);
  private tiffPath: string;
  private ndviCache = new Map<string, number>();

  constructor(private configService: ConfigService) {
    sharp.cache(false);
    sharp.concurrency(1);
  }

  async onModuleInit() {
    try {
      this.tiffPath = this.configService.get<string>('nasaFirms.ndviPath');
      if (!this.tiffPath) {
        throw new Error('NDVI file path is not configured');
      }
      
      if (!fs.existsSync(this.tiffPath)) {
        throw new Error(`NDVI file not found at path: ${this.tiffPath}`);
      }
    } catch (error) {
      this.logger.error(`NDVI TIFF数据加载失败: ${error.message}`);
      throw error;
    }
  }

  async getNdviValue(latitude: number, longitude: number): Promise<number | null> {
    const cacheKey = `${latitude},${longitude}`;
    if (this.ndviCache.has(cacheKey)) {
      return this.ndviCache.get(cacheKey);
    }

    try {
      const image = sharp(this.tiffPath, {
        limitInputPixels: false,
      });

      const metadata = await image.metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        this.logger.error('无法获取图像尺寸');
        return null;
      }

      const bbox = [-180, -90, 180, 90];
      const [xMin, yMin, xMax, yMax] = bbox;

      const x = ((longitude - xMin) / (xMax - xMin)) * width;
      const y = ((yMax - latitude) / (yMax - yMin)) * height;

      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
        return null;
      }

      const { data: pixelValue } = await image
        .extract({ left: ix, top: iy, width: 1, height: 1 })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const value = pixelValue[0];
      this.ndviCache.set(cacheKey, value);
      return value;
    } catch (error) {
      this.logger.error(`NDVI值提取失败: ${error.message}`);
      return null;
    }
  }
}
