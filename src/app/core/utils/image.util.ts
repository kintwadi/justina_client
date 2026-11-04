export type ImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

const IMAGE_ENDPOINT = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image';

/** Builds a generated-image URL for the mock catalogue. */
export function generatedImage(prompt: string, size: ImageSize = 'portrait_4_3'): string {
  return `${IMAGE_ENDPOINT}?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}
