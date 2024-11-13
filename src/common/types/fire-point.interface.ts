export interface FirePoint {
  latitude: number;
  longitude: number;
  bright_ti4: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_ti5: number;
  frp: number;
  daynight: string;
  ndvi?: number;
}