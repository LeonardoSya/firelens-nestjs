import { Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { ConfigModule } from '@nestjs/config';
import { NdviService } from 'src/common/utils/ndvi.service';
import { DatabaseService } from 'src/common/services/database.service';
import { InvokeDownloadService } from 'src/common/utils/invoke-download.service';
import { StorageService } from 'src/common/utils/storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [DownloadController],
  providers: [
    DatabaseService,
    DownloadService,
    NdviService,
    InvokeDownloadService,
    StorageService,
  ],
})
export class DownloadModule {}
