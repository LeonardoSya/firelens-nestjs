import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as cliProgress from 'cli-progress';
import { NdviService } from 'src/common/utils/ndvi.service';
import { StorageService } from 'src/common/utils/storage.service';
import { InvokeDownloadService } from 'src/common/utils/invoke-download.service';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly downloadConfig: { url: string; tempDir: string };

  constructor(
    private configService: ConfigService,
    private storageService: StorageService,
    private invokeDownloadService: InvokeDownloadService,
    private ndviService: NdviService,
  ) {
    const url = this.configService.get<string>('nasaFirms.url');
    const tempDir = this.configService.get<string>('nasaFirms.tempDir');

    if (!url || !tempDir) {
      throw new Error('NASA FIRMS configuration is missing');
    }

    this.downloadConfig = { url, tempDir };
  }

  async downloadAndProcessCsvFile(): Promise<string> {
    try {
      const originalFilePath = await this.invokeDownloadService.downloadFile(
        this.downloadConfig.url,
        this.downloadConfig.tempDir,
      );

      const processedFilePath =
        await this.processFirePointsData(originalFilePath);

      this.logger.log(
        `\x1b[32m
╔════════════════════════════════════════════╗
║        FIRELENS DATA UPDATE COMPLETED!     ║
╚════════════════════════════════════════════╝\x1b[0m`,
      );

      if (fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }

      return processedFilePath;
    } catch (error) {
      this.logger.error(`下载处理失败: ${error.message}`);
      throw error;
    }
  }

  private async processFirePointsData(inputFilePath: string): Promise<string> {
    const results: any[] = [];
    const outputPath = inputFilePath.replace('.csv', '_ndvi.csv');

    const rawData = await new Promise<any[]>((resolve) => {
      const data = [];
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on('data', (row) => data.push(row))
        .on('end', () => resolve(data));
    });

    const progressBar = new cliProgress.SingleBar({
      format: 'NDVI Processing... |{bar}| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(rawData.length, 0);
    
    try {
      const batchSize = 100;
      for (let i = 0; i < rawData.length; i += batchSize) {
        const batch = rawData.slice(i, i + batchSize);
        const processedBatch = await Promise.all(
          batch.map(async (data) => {
            const ndvi = await this.ndviService.getNdviValue(
              parseFloat(data.latitude),
              parseFloat(data.longitude),
            );
            return { ...data, ndvi: ndvi !== null ? ndvi : '' };
          })
        );
        results.push(...processedBatch);
        progressBar.update(i + processedBatch.length);
        
        if (i % 1000 === 0) {
          this.logger.debug(`已处理 ${i} / ${rawData.length} 条数据`);
        }
      }

      progressBar.stop();
      this.logger.log(`NDVI处理完成，共处理 ${results.length} 条数据`);

      await this.writeProcessedData(results, outputPath);
      await this.saveToDatabase(results, outputPath);
      return outputPath;
    } catch (error) {
      progressBar.stop();
      this.logger.error(`数据处理失败: ${error.message}`);
      throw error;
    }
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
    });

    await csvWriter.writeRecords(data);
  }

  private async saveToDatabase(data: any[], outputPath: string): Promise<void> {
    const progressBar = new cliProgress.SingleBar({
      format:
        'Upload to Vercel Postgres... |{bar}| {percentage}% || {value}/{total}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(data.length, 0);
    let processedCount = 0;

    try {
      await this.storageService.clearFirePoints();

      const batchSize = 1000;
      const chunks = this.storageService.chunkArray(data, batchSize);

      for (const chunk of chunks) {
        await this.storageService.insertFirePoints(chunk);
        processedCount += chunk.length;
        progressBar.update(processedCount);
      }

      progressBar.stop();

      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    } catch (error) {
      progressBar.stop();
      this.logger.error(`数据入库失败: ${error.message}`);
      throw error;
    }
  }
}
