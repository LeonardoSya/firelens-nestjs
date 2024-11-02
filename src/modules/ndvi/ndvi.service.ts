import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as sharp from 'sharp'
import * as path from 'path'
import { TiffMetadata } from './ndvi.interface'

@Injectable()
export class NdviService implements OnModuleInit {
  private readonly logger = new Logger(NdviService.name)
  private tiffData: TiffMetadata

  constructor(private configService: ConfigService) {
    sharp.cache(false)
    sharp.concurrency(1)
  }

  private async initializeTiff(tiffPath: string): Promise<TiffMetadata> {
    try {
      const image = sharp(tiffPath, {
        limitInputPixels: false,
      })

      const metadata = await image.metadata()
      const { width, height } = metadata

      if (!width || !height) throw new Error('无法获取图像尺寸')

      const { data: rasters } = await image
        .raw()
        .toBuffer({ resolveWithObject: true })

      const bbox = [-180, -90, 180, 90]

      return {
        image,
        rasters,
        width,
        height,
        bbox,
      }
    } catch (error) {
      this.logger.error(`TIFF初始化失败: ${error.message}`)
      throw error
    }
  }

  async onModuleInit() {
    try {
      const tiffPath = path.join(process.cwd(), 'data', 'ndvi2407.tif')
      this.tiffData = await this.initializeTiff(tiffPath)
      this.logger.log('NDVI TIFF数据加载成功')
    } catch (error) {
      this.logger.error(`NDVI TIFF数据加载失败: ${error.message}`)
    }
  }

  getNdviValue(latitude: number, longitude: number): number | null {
    try {
      const { bbox, width, height, rasters } = this.tiffData
      const [xMin, yMin, xMax, yMax] = bbox

      const x = ((longitude - xMin) / (xMax - xMin)) * width
      const y = ((yMax - latitude) / (yMax - yMin)) * height

      const ix = Math.floor(x)
      const iy = Math.floor(y)

      if (ix < 0 || ix >= width || iy < 0 || iy >= height) return null

      const pixelIndex = iy * width + ix
      const rawValue = rasters[pixelIndex]

      if (rawValue === 32767) {
        return null
      }

      return rawValue / 10000
    } catch (error) {
      this.logger.error(`NDVI字段提取失败: ${error.message}`)
      return null
    }
  }
}
