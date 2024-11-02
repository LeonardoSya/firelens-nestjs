import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { DownloadModule } from './modules/download/download.module'

@Module({
  imports: [
    // 初始化配置模块
    ConfigModule.forRoot({
      load: [configuration], // 加载配置文件
      isGlobal: true, // 使配置模块全局可用，这样其他模块不需要重复导入
    }),
    DownloadModule,
  ],
})
export class AppModule {}
