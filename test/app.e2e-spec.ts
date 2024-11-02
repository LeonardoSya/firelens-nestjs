import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'
import { DownloadService } from '../src/modules/download/download.service'

describe('DownloadController (e2e)', () => {
  let app: INestApplication
  let downloadService: DownloadService

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DownloadService)
      .useValue({
        downloadCsvFile: jest.fn(),
      })
      .compile()

    app = moduleFixture.createNestApplication()
    downloadService = moduleFixture.get<DownloadService>(DownloadService)
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/download/firms-csv (GET)', () => {
    it('should return success response when download succeeds', async () => {
      const mockFilePath = '/mock/path/file.csv'
      jest
        .spyOn(downloadService, 'downloadCsvFile')
        .mockResolvedValue(mockFilePath)

      return request(app.getHttpServer())
        .get('/download/firms-csv')
        .expect(200)
        .expect({
          success: true,
          message: '源数据下载成功',
          filePath: mockFilePath,
        })
    })

    it('should return error response when download fails', async () => {
      jest
        .spyOn(downloadService, 'downloadCsvFile')
        .mockRejectedValue(new Error('Download failed'))

      return request(app.getHttpServer())
        .get('/download/firms-csv')
        .expect(200)
        .expect({
          success: false,
          message: '源数据下载失败: Download failed',
        })
    })
  })
})
