import { Sharp } from 'sharp'

export interface TiffMetadata {
  image: Sharp
  rasters: Buffer
  width: number
  height: number
  bbox: number[]
}
