// src/fastify-multipart.d.ts
import { FastifyMultipartPlugin } from '@fastify/multipart';

declare module '@nestjs/platform-fastify' {
  interface FastifyInstance {
    multipartErrors: FastifyMultipartPlugin['multipartErrors'];
  }
}