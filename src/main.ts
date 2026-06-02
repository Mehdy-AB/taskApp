import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 200 * 1024 * 1024, // allow up to 200 MB bodies
    }),
  );

  // 1. Grab the Fastify instance
  const fastify = app.getHttpAdapter().getInstance();

  // 2. Enable CORS
  app.enableCors({
    origin: ['https://labonneoccaz.com', 'https://www.labonneoccaz.com'], // your frontend origin(s) process.env.FRONT_END_URL ['https://labonneoccaz.com', 'https://www.labonneoccaz.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 3. Multipart plugin (file uploads) — limits to 10 MB per file
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // 4. Rate-limit plugin — 100 reqs per IP per minute
  await fastify.register(fastifyRateLimit, {
      // Custom key combines IP + HTTP method + route path
      keyGenerator: (req) => {
        const routePath = req.url; // Use URL as route path
        return `${req.ip}-${req.method}-${routePath}`;
      },
      
      // Dynamic max requests based on HTTP method
      max: (req) => {
        if (['POST', 'DELETE', 'PUT'].includes(req.method)) return 50;
        return 150; // Applies to GET and other methods
      },
      
      timeWindow: '1 minute',
      skipOnError: true, // Continue on errors
      errorResponseBuilder: (req, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Method ${req.method} exceeded ${context.max} requests for this route. Retry in ${context.after}`
      })
    });

  await app.listen(8000, '0.0.0.0');
}
bootstrap();
