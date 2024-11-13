export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

export interface DownloadConfig {
  url: string;
  tempDir: string;
}

export interface AppConfig {
  port: number;
  database: DatabaseConfig;
  download: DownloadConfig;
}