import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DownloadModule } from './modules/download/download.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import downloadConfig from './config/download.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, appConfig, downloadConfig],
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    DownloadModule,
  ],
})
export class AppModule {}
