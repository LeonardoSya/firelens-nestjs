import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

@Injectable() // @Injectable()装饰器表明这个类可以被nestjs的依赖注入系统管理
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name) // 创建私有logger实例，用类名作为标识

  constructor(private configService: ConfigService) {} // 通过构造函数注入ConfigService，用ts的简写语法自动创建私有属性

  async downloadCsvFile(): Promise<string> {
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
}
