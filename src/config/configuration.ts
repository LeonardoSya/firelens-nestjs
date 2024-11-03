export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nasaFirms: {
    url: process.env.NASA_FIRMS_URL,
    tempDir: 'src/temp/data',
  },
  database: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false
    },
    autoLoadEntities: true,
    synchronize: true, 
  }
})
