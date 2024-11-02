export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nasaFirms: {
    url: process.env.NASA_FIRMS_URL,
    tempDir: 'src/temp/data',
  },
})
