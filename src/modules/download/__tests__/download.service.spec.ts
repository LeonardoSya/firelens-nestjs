import { Test, TestingModule } from '@nestjs/testing'
import { DownloadService } from '../download.service'
import { ConfigService } from '@nestjs/config'
import { NdviService } from '../../ndvi/ndvi.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { FirePoint } from '../entities/fire-point.entity'

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('fs')

jest.mock('cli-progress')

describe('DownloadService', () => {
  let service: DownloadService
  let configService: ConfigService
  let ndviService: NdviService

  const mockFirePointRepository = {
    query: jest.fn(),
    save: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn((key) => {
      const config = {
        'nasaFirms.url': 'http://mock.url',
        'nasaFirms.tempDir': 'mock/temp/dir',
      }
      return config[key]
    }),
  }

  const mockNdviService = {
    getNdviValue: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadService,
        {
          provide: getRepositoryToken(FirePoint),
          useValue: mockFirePointRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NdviService,
          useValue: mockNdviService,
        },
      ],
    }).compile()

    service = module.get<DownloadService>(DownloadService)
    configService = module.get<ConfigService>(ConfigService)
    ndviService = module.get<NdviService>(NdviService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('saveToDatabase', () => {
    it('应该成功将数据保存到数据库', async () => {
      const mockData = [
        {
          latitude: '12.345',
          longitude: '67.890',
          bright_ti4: '300.5',
          scan: '1.2',
          track: '1.3',
          acq_date: '2024-01-01',
          acq_time: '1200',
          satellite: 'TEST',
          confidence: 'nominal',
          version: '1.0',
          bright_ti5: '290.5',
          frp: '50.0',
          daynight: 'D',
          ndvi: '0.5',
        },
      ]

      mockFirePointRepository.query.mockResolvedValue(undefined)
      mockFirePointRepository.save.mockResolvedValue(mockData)

      await expect(
        service['saveToDatabase'](mockData, 'test.csv'),
      ).resolves.not.toThrow()

      expect(mockFirePointRepository.query).toHaveBeenCalledWith(
        'TRUNCATE TABLE fire_points RESTART IDENTITY',
      )
      expect(mockFirePointRepository.save).toHaveBeenCalled()
    })
  })
})
