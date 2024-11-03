import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createObjectCsvWriter } from 'csv-writer'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'csv-parser'
import * as cliProgress from 'cli-progress'
import { NdviService } from '../ndvi/ndvi.service'
import { InjectRepository } from '@nestjs/typeorm'
import { FirePoint } from './entities/fire-point.entity'
import { Repository } from 'typeorm'

@Injectable() // @Injectable()装饰器表明这个类可以被nestjs的依赖注入系统管理
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name) // 创建私有logger实例，用类名作为标识

  constructor(
    @InjectRepository(FirePoint) // TypeORM与nestjs集成时提供的装饰器，用于注入与FirePoint实体相关的数据库仓库
    private firePointRepository: Repository<FirePoint>, // Repository<FirePoint> 泛型类型，TypeORM提供一个抽象层，不需要编写原始sql
    private configService: ConfigService,
    private ndviService: NdviService,
  ) {}

  async downloadAndProcessCsvFile(): Promise<string> {
    try {
      const originalFilePath = await this.downloadCsvFile()
      const processedFilePath =
        await this.processFirePointsData(originalFilePath)
      this.logger.log(
        `\x1b[32m
╔════════════════════════════════════════════╗
║        FIRELENS DATA UPDATE COMPLETED!     ║
╚════════════════════════════════════════════╝\x1b[0m`,
      )

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
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      })

      return new Promise((resolve, reject) => {
        const progressBar = new cliProgress.SingleBar({
          format: 'Downloading... |{bar}| {percentage}% || {value}/{total}',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
        })

        const totalSize = parseInt(response.headers['content-length'], 10)
        let downloadedSize = 0

        progressBar.start(totalSize, 0)

        const writer = fs.createWriteStream(filePath)

        response.data.on('data', (chunk) => {
          downloadedSize += chunk.length
          progressBar.update(downloadedSize)
        })

        response.data.pipe(writer)

        writer.on('error', (err) => {
          progressBar.stop()
          reject(err)
        })

        writer.on('close', () => {
          progressBar.stop()
          if (fs.existsSync(filePath)) {
            resolve(filePath)
          } else {
            reject(new Error('文件下载失败：文件未创建'))
          }
        })
      })
    } catch (error) {
      this.logger.error(`源数据下载失败：${error.message}`)
      throw error
    }
  }

  private async processFirePointsData(inputFilePath: string): Promise<string> {
    const results = []
    const outputPath = inputFilePath.replace('.csv', '_ndvi.csv')

    const totalRows = await new Promise<number>((resolve) => {
      let count = 0
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', () => count++)
        .on('end', () => resolve(count))
    })

    const progressBar = new cliProgress.SingleBar({
      format: 'NDVI Processing... |{bar}| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    })

    progressBar.start(totalRows, 0)
    let processedRows = 0

    return new Promise((resolve, reject) => {
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', async (data) => {
          const ndvi = await this.ndviService.getNdviValue(
            parseFloat(data.latitude),
            parseFloat(data.longitude),
          )
          results.push({ ...data, ndvi: ndvi !== null ? ndvi : '' })
          processedRows++
          progressBar.update(processedRows)
        })
        .on('end', async () => {
          progressBar.stop()
          try {
            await this.writeProcessedData(results, outputPath)
            await this.saveToDatabase(results, outputPath)
            resolve(outputPath)
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (error) => {
          progressBar.stop()
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

  private async saveToDatabase(data: any[], outputPath: string): Promise<void> {
    const progressBar = new cliProgress.SingleBar({
      format:
        'Upload to Vercel Postgres... |{bar}| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    })

    progressBar.start(data.length, 0)
    let processedCount = 0

    try {
      // TRUNCATE 清空表
      await this.firePointRepository.query(
        'TRUNCATE TABLE fire_points RESTART IDENTITY',
      )

      const batchSize = 1000
      const chunks = this.chunkArray(data, batchSize)

      for (const chunk of chunks) {
        const entities = chunk.map((item) => {
          const firePoint = new FirePoint()
          firePoint.latitude = parseFloat(item.latitude)
          firePoint.longitude = parseFloat(item.longitude)
          firePoint.bright_ti4 = parseFloat(item.bright_ti4)
          firePoint.scan = parseFloat(item.scan)
          firePoint.track = parseFloat(item.track)
          firePoint.acq_date = new Date(item.acq_date)
          firePoint.acq_time = item.acq_time
          firePoint.satellite = item.satellite
          firePoint.confidence = item.confidence
          firePoint.version = item.version
          firePoint.bright_ti5 = parseFloat(item.bright_ti5)
          firePoint.frp = parseFloat(item.frp)
          firePoint.daynight = item.daynight
          firePoint.ndvi = item.ndvi ? parseFloat(item.ndvi) : null
          return firePoint
        })

        await this.firePointRepository.save(entities)
        processedCount += chunk.length
        progressBar.update(processedCount)
      }

      progressBar.stop()

      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }
    } catch (error) {
      progressBar.stop()
      this.logger.error(`数据入库失败: ${error.message}`)
      throw error
    }
  }

  // 数组分块以实现数据分批处理
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}
