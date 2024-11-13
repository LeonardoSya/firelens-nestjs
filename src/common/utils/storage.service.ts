import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/services/database.service';
import { FirePoint } from 'src/common/types/fire-point.interface';

@Injectable()
export class StorageService {
  constructor(private databaseService: DatabaseService) {}

  async clearFirePoints(): Promise<void> {
    await this.databaseService.query(
      'TRUNCATE TABLE fire_points RESTART IDENTITY',
    );
  }

  async insertFirePoints(firePoints: FirePoint[]): Promise<void> {
    const query = `
      INSERT INTO fire_points (
        latitude, longitude, bright_ti4, scan, track,
        acq_date, acq_time, satellite, confidence, version,
        bright_ti5, frp, daynight, ndvi
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    await Promise.all(
      firePoints.map((point) =>
        this.databaseService.query(query, [
          point.latitude.toString(),
          point.longitude.toString(),
          point.bright_ti4.toString(),
          point.scan.toString(),
          point.track.toString(),
          point.acq_date,
          point.acq_time,
          point.satellite,
          point.confidence,
          point.version,
          point.bright_ti5.toString(),
          point.frp.toString(),
          point.daynight,
          point.ndvi ? point.ndvi.toString() : null,
        ]),
      ),
    );
  }

  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
