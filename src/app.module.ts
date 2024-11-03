import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import configuration from './config/configuration'
import { DownloadModule } from './modules/download/download.module'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    // 初始化配置模块
    ConfigModule.forRoot({
      load: [configuration], // 加载配置文件
      isGlobal: true, // 使配置模块全局可用，这样其他模块不需要重复导入
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],  // 允许访问配置服务
      useFactory:(configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    DownloadModule,
  ],
})
export class AppModule {}
