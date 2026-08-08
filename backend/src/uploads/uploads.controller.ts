import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES } from '../common/constants/roles.constants';
import {
  MAX_IMAGE_BYTES,
  UPLOAD_FOLDERS,
  UploadsService,
  type UploadedImage,
  type UploadFolder,
} from './uploads.service';

/**
 * Generic admin image upload.
 *
 * One endpoint for every admin-managed image — banners today, product and
 * category artwork next — so the storefront never has to hotlink an image from
 * somewhere the store doesn't control. Before this, the only way to set a
 * banner was to paste a URL you had already hosted yourself.
 *
 * Returns the delivery URL; the caller saves it on whatever record it belongs
 * to. Deliberately decoupled from any one entity so adding an image field
 * elsewhere needs no new endpoint.
 */
@ApiTags('admin/uploads')
@ApiBearerAuth()
@Controller('admin/uploads')
@Roles(...ADMIN_ROLES)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image and get back its delivery URL' })
  async uploadImage(
    @UploadedFile() file: UploadedImage,
    @Query('folder') folder?: string,
  ) {
    const target = (folder ?? 'banners') as UploadFolder;
    if (!(target in UPLOAD_FOLDERS)) {
      throw new BadRequestException(
        `Unknown folder "${folder}". Use one of: ${Object.keys(UPLOAD_FOLDERS).join(', ')}`,
      );
    }

    return this.uploads.uploadImage(file, target);
  }
}
