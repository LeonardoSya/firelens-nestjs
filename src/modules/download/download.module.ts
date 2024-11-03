import { Module } from '@nestjs/common'
import { DownloadController } from './download.controller'
import { DownloadService } from './download.service'
import { ConfigModule } from '@nestjs/config'
import { NdviService } from '../ndvi/ndvi.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FirePoint } from './entities/fire-point.entity'

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([FirePoint])],
  controllers: [DownloadController], // Controllers: 处理http请求, DownloadController将处理 下载数据相关的http端点
  providers: [DownloadService, NdviService], // Providers: 业务逻辑  通过依赖注入系统，这个服务才可以被注入到控制器中使用
})
export class DownloadModule {}
