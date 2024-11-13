import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as cliProgress from 'cli-progress';

@Injectable()
export class InvokeDownloadService {
  private readonly logger = new Logger(InvokeDownloadService.name);

  async downloadFile(url: string, outputDir: string): Promise<string> {
    if (!url || !outputDir) {
      throw new Error('Download URL or output directory is missing');
    }

    try {
      await fs.promises.mkdir(outputDir, { recursive: true });
      
      const fileName = `firms_data_${new Date().toISOString()}.csv`;
      const filePath = path.join(outputDir, fileName);
      
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });

      return new Promise((resolve, reject) => {
        const progressBar = new cliProgress.SingleBar({
          format: 'Downloading... |{bar}| {percentage}% || {value}/{total}',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
        });

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        progressBar.start(totalSize, 0);
        const writer = fs.createWriteStream(filePath);

        response.data.on('data', (chunk) => {
          downloadedSize += chunk.length;
          progressBar.update(downloadedSize);
        });

        response.data.pipe(writer);

        writer.on('error', (err) => {
          progressBar.stop();
          reject(err);
        });

        writer.on('close', () => {
          progressBar.stop();
          resolve(filePath);
        });
      });
    } catch (error) {
      this.logger.error(`文件下载失败：${error.message}`);
      throw error;
    }
  }
}
