import { parse, stringify } from '@std/csv';
import { fromFile } from 'geotiff';

class NdviProcessor {
  private input = './source_data.csv';
  private output = './process_data.csv';
  private readonly tif = './ndvi2407.tif';

  public async process() {
    try {
      await this.checkFiles();

      const tifData = await this.loadTif();
      const getNdvi = this.createCalculator(tifData);

      const csvContent = await Deno.readTextFile(this.input);
      const records = parse(csvContent, {
        columns: [
          'latitude',
          'longitude',
          'bright_ti4',
          'scan',
          'track',
          'acq_date',
          'acq_time',
          'satellite',
          'confidence',
          'version',
          'bright_ti5',
          'frp',
          'daynight',
        ],
      });

      const totalRecords = records.length;

      const results = records.map((data: any) => {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);

        let ndviValue = '';
        try {
          const ndvi = getNdvi(lat, lon);
          ndviValue = ndvi !== null && !isNaN(ndvi) ? ndvi : '';
        } catch (error: any) {
          console.warn(`计算NDVI失败 (${lat}, ${lon}): ${error.message}`);
        }

        return {
          ...data,
          ndvi: ndviValue,
        };
      });

      const headers = [
        'latitude',
        'longitude',
        'bright_ti4',
        'scan',
        'track',
        'acq_date',
        'acq_time',
        'satellite',
        'confidence',
        'version',
        'bright_ti5',
        'frp',
        'daynight',
        'ndvi',
      ];

      const output = stringify(results, { columns: headers });
      await Deno.writeTextFile(this.output, output);
      const validNdviCount = results.filter((r: any) => r.ndvi !== '').length;
      console.log(`总记录数: ${totalRecords}`);
      console.log(`有效NDVI值数量: ${validNdviCount}`);
    } catch (error) {
      console.error('处理过程出错: ', error);
      throw error;
    }
  }

  private async checkFiles() {
    try {
      await Deno.stat(this.input);
      await Deno.stat(this.tif);
    } catch (error) {
      throw new Error('输入路径不存在');
    }
  }

  private async loadTif() {
    const tif = await fromFile(this.tif);
    const image = await tif.getImage();
    const rasters = await image.readRasters();
    const bbox = image.getBoundingBox();

    return {
      rasters,
      bbox,
      width: image.getWidth(),
      height: image.getHeight(),
    };
  }

  private createCalculator(tifData: any) {
    const { rasters, bbox, width, height } = tifData;
    const [xMin, yMin, xMax, yMax] = bbox;

    return (lat: number, lon: number): number | null => {
      const x = ((lon - xMin) / (xMax - xMin)) * width;
      const y = ((yMax - lat) / (yMax - yMin)) * height;
      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
        return null;
      }
      return rasters[0][iy * width + ix];
    };
  }
}

if (import.meta.main) {
  const processor = new NdviProcessor();
  await processor.process();
}
