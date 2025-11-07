import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  
//    Upload file to S3 
  async uploadFile(file: Express.Multer.File, bucket: string, folder = '') {
    // get extention of the file
    const ext = file.originalname.split('.').pop();
    // generate unique file name
    const key = `${folder ? folder.replace(/\/?$/, '/') : ''}${uuid()}.${ext}`;


    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    return {
      key,
      url: await this.getPresignedUrl(bucket, key),
    };
  }


    // upload multiple files to S3

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    bucket: string,
    folder = '',
  ) {
    let res = files.map(async (file) => {
      // get extention of the file
      const ext = file.originalname.split('.').pop();
      // generate unique file name
      const key = `${folder}${uuid()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3.send(command);

      return {
        key,
        url: await this.getPresignedUrl(bucket, key),
      };
    });
    // promise all
    return Promise.all(res);
  }


    // a pre-signed URL for viewing/downloading
   
  async getPresignedUrl(bucket: string, key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn }); // default: 1 hour
  }

 
    // Delete a file from S3
   
  async deleteFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.s3.send(command);
    return { deleted: true, key };
  }

 
    // List files in a bucket/prefix
 
  async listFiles(bucket: string, prefix = '') {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await this.s3.send(command);
    return response.Contents?.map((item) => item.Key) ?? [];
  }
}
