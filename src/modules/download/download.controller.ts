import { Controller, Get } from '@nestjs/common'
import { DownloadService } from './download.service'
import { DownloadResponse } from './download.interface'

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('firms-csv')
  async downloadFirmsCsv(): Promise<DownloadResponse> {
    try {
      const filePath = await this.downloadService.downloadCsvFile()
      return {
        success: true,
        message: '源数据下载成功',
        filePath,
      }
    } catch (error) {
      return {
        success: false,
        message: `源数据下载失败: ${error.message}`, // 将Service层logger记录的具体错误细节包装成http响应
      }
    }
  }
}
