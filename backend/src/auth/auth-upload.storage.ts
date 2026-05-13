import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import type { FileFilterCallback } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_SUBDIR = join('uploads', 'users');

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;

export function userProfilePhotoFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/')) {
    cb(null, true);
    return;
  }
  const name = file.originalname || '';
  if (IMAGE_EXT.test(name) && (!mime || mime === 'application/octet-stream')) {
    cb(null, true);
    return;
  }
  cb(new BadRequestException('Only image uploads are allowed'));
}

export function userProfilePhotoMulterStorage() {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), UPLOAD_SUBDIR);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname) || '.jpg';
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

export function publicUserProfilePhotoUrl(
  req: { protocol: string; get(name: string): string | undefined },
  filename: string,
): string {
  const host = req.get('host') || 'localhost:4000';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const safeProto = proto === 'https' ? 'https' : 'http';
  return `${safeProto}://${host}/uploads/users/${filename}`;
}
