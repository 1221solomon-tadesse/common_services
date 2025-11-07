// src/config/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as multer from 'multer';
import { extname } from 'node:path';
import { v4 as uuid } from 'uuid';

const MAX_FILE_SIZE_MB = 5;
export const fileTypes = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/heic',
    'image/heif',
  ] as const,
  pdf: ['application/pdf'] as const,
  doc: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
  vid: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'video/ogg',
    'video/avi',
    'video/x-ms-wmv',
    'video/x-flv',
  ] as const,
} as const;

export type FileType = keyof typeof fileTypes;

export const multerOptions = (
  useMemory: boolean = true, 
  fileType: FileType[] = ['image', 'pdf'], 
  fileSize: number = MAX_FILE_SIZE_MB, 
): multer.Options => {
  const storage = useMemory
    ? multer.memoryStorage() 
    : diskStorage({
        destination: './uploads', 
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${uuid()}${ext}`); 
        },
      });

  return {
    storage,
    limits: { fileSize: fileSize * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ALLOWED_TYPES = fileType.flatMap(
        (type) => fileTypes[type],
      ) as string[];

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Only ${ALLOWED_TYPES.join(', ')} files are allowed!`,
        );
      }

      cb(null, true);
    },
  };
};
