import { Controller, Get } from '@nestjs/common';
import { DownloadService } from './download.service';

interface DownloadResponse {
  success: boolean;
  message: string;
  filePath?: string;
}

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get()
  async downloadFirmsCsv(): Promise<DownloadResponse> {
    try {
      const filePath = await this.downloadService.downloadAndProcessCsvFile();
      return {
        success: true,
        message: 'Source data downloaded and processed successfully',
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to process source data: ${error.message}`,
      };
    }
  }
}
