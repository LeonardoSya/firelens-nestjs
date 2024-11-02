import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createObjectCsvWriter } from 'csv-writer'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'csv-parser'
import { NdviService } from '../ndvi/ndvi.service'

@Injectable() // @Injectable()装饰器表明这个类可以被nestjs的依赖注入系统管理
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name) // 创建私有logger实例，用类名作为标识

  // 通过构造函数注入ConfigService，用ts的简写语法自动创建私有属性
  constructor(
    private configService: ConfigService,
    private ndviService: NdviService,
  ) {}

  async downloadAndProcessCsvFile(): Promise<string> {
    try {
      const originalFilePath = await this.downloadCsvFile()
      this.logger.log('源数据下载完成，正在处理数据...')

      const processedFilePath =
        await this.processFirePointsData(originalFilePath)
      this.logger.log('数据处理完成')

      fs.unlinkSync(originalFilePath)

      return processedFilePath
    } catch (error) {
      throw error
    }
  }

  private async downloadCsvFile(): Promise<string> {
    const url = this.configService.get<string>('nasaFirms.url')
    const tempDir = this.configService.get<string>('nasaFirms.tempDir')

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true }) // recursive: true 允许创建嵌套目录结构

    const fileName = `firms_data_${new Date().toISOString()}.csv`
    const filePath = path.join(tempDir, fileName)

    try {
      const res = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      })

      const writer = fs.createWriteStream(filePath)
      res.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath))
        writer.on('error', reject)
      })
    } catch (error) {
      this.logger.error(`源数据下载失败：${error.message}`)
      throw error // 让调用这个方法的上层代码知道发生了错误，维持错误传播链
    }
  }

  private async processFirePointsData(inputFilePath: string): Promise<string> {
    const results = []
    const outputPath = inputFilePath.replace('.csv', '_ndvi.csv')

    return new Promise((resolve, reject) => {
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', async (data) => {
          const ndvi = await this.ndviService.getNdviValue(
            parseFloat(data.latitude),
            parseFloat(data.longitude),
          )
          results.push({ ...data, ndvi: ndvi !== null ? ndvi : '' })
        })
        .on('end', async () => {
          try {
            await this.writeProcessedData(results, outputPath)
            resolve(outputPath)
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (error) => {
          this.logger.error(`数据处理失败: ${error.message}`)
          reject(error)
        })
    })
  }

  private async writeProcessedData(
    data: any[],
    outputPath: string,
  ): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'latitude', title: 'latitude' },
        { id: 'longitude', title: 'longitude' },
        { id: 'bright_ti4', title: 'bright_ti4' },
        { id: 'scan', title: 'scan' },
        { id: 'track', title: 'track' },
        { id: 'acq_date', title: 'acq_date' },
        { id: 'acq_time', title: 'acq_time' },
        { id: 'satellite', title: 'satellite' },
        { id: 'confidence', title: 'confidence' },
        { id: 'version', title: 'version' },
        { id: 'bright_ti5', title: 'bright_ti5' },
        { id: 'frp', title: 'frp' },
        { id: 'daynight', title: 'daynight' },
        { id: 'ndvi', title: 'ndvi' },
      ],
    })

    await csvWriter.writeRecords(data)
  }
}
