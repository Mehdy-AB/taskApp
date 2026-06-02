import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(base64: string): Promise<string> {
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64}`);
    return result.secure_url;
  }

   async uploadVideo(part: AsyncIterableIterator<Buffer> | Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create upload stream to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: 'video',
          chunk_size: 6000000, // 6MB chunks for better reliability
          timeout: 60000 // 60s timeout
        },
        (error: Error, result: UploadApiResponse) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error('Failed to upload video'));
          }
          resolve(result.secure_url);
        }
      );

      // Handle both Buffer and AsyncIterable cases
      if (part instanceof Buffer) {
        // If already converted to Buffer
        const readable = new Readable();
        readable.push(part);
        readable.push(null); // Signal end of stream
        readable.pipe(uploadStream);
      } else {
        // For Fastify's AsyncIterable
        const readable = Readable.from(part);
        readable.pipe(uploadStream);
      }
    });
  }
  
  
  async getSignature(folder: string = 'ads') {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET,
    );

    return {
      timestamp,
      signature,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  }
  
}
