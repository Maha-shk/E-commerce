import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/** What the API accepts. Kept narrow — these are the formats browsers render. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Folders keep the Cloudinary media library navigable and make it possible to
 * apply per-folder rules later. One per thing that can carry an image.
 */
export const UPLOAD_FOLDERS = {
  avatars: 'cento/avatars',
  banners: 'cento/banners',
  products: 'cento/products',
  categories: 'cento/categories',
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

/** The subset of multer's file object this service needs. */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
}

export interface UploadedImageResult {
  url: string;
  /** Cloudinary's identifier, needed to delete the asset later. */
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

/**
 * Image uploads, backed by Cloudinary.
 *
 * Cloudinary rather than Supabase Storage because it serves transformed,
 * CDN-cached derivatives (`f_auto,q_auto`) instead of the raw original — which
 * matters when the same banner is shown on a phone and a desktop.
 *
 * Uploads stream from memory: multer is configured without a disk destination,
 * so nothing touches the filesystem. That is what makes this work unchanged on
 * a read-only serverless filesystem such as Netlify Functions.
 */
@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary is not configured — image uploads will be rejected. ' +
          'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
    this.logger.log(`Cloudinary ready (cloud: ${cloudName})`);
  }

  /** Rejects anything that isn't a small, browser-renderable image. */
  assertValidImage(file?: UploadedImage): asserts file is UploadedImage {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No image was uploaded');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type "${file.mimetype}". Use JPEG, PNG, WebP or AVIF.`,
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        `Image is too large (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB)`,
      );
    }
  }

  /**
   * Uploads one image and returns its delivery URL.
   *
   * `overwrite`/`publicId` let a caller replace an existing asset in place —
   * used for avatars, where keeping one asset per user avoids orphaning the
   * previous picture on every change.
   */
  async uploadImage(
    file: UploadedImage,
    folder: UploadFolder,
    options: { publicId?: string } = {},
  ): Promise<UploadedImageResult> {
    this.assertValidImage(file);

    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Image uploads are not configured on this server.',
      );
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: UPLOAD_FOLDERS[folder],
          resource_type: 'image',
          ...(options.publicId && { public_id: options.publicId, overwrite: true }),
          // Strip EXIF (which carries GPS coordinates on phone photos) and let
          // Cloudinary pick the best format/quality per requesting browser.
          transformation: [{ fetch_format: 'auto', quality: 'auto' }],
          invalidate: true,
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            return reject(error ?? new Error('Upload failed'));
          }
          resolve(uploaded);
        },
      );
      stream.end(file.buffer);
    }).catch((error: Error) => {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      throw new BadRequestException('Could not store the image. Please try again.');
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    };
  }

  /** Best-effort delete. Never throws: a leaked asset must not fail a request. */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.configured || !publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
      this.logger.warn(
        `Could not delete Cloudinary asset ${publicId}: ${(error as Error).message}`,
      );
    }
  }
}
