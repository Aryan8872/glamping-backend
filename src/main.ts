import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as path from 'path';
import * as express from 'express';
import cookieParser from 'cookie-parser';

import { GlobalExceptionFilter } from './common/filters/global-exception-filter.js';
// import { LoggingInterceptor } from './common/interceptor/logging/logging.interceptor.js';
import { ResponseInterceptor } from './common/interceptor/response/response.interceptor.js';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  Sentry.init({
    dsn: 'https://3074667d9b8737b7fb9139cc97b51208@o4511942670548992.ingest.de.sentry.io/4511944176631888',
    integrations: [nodeProfilingIntegration()],
    // Send structured logs to Sentry
    enableLogs: true,
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is evaluated only once per SDK.init call
    profileSessionSampleRate: 1.0,
    // Trace lifecycle automatically enables profiling during active traces
    profileLifecycle: 'trace',
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  });
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Override the default logger with Pino
  app.useLogger(app.get(Logger));
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.use(cookieParser());

  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false, // better UX for frontend
      exceptionFactory: (errors) => {
        return new BadRequestException({
          errorCode: 'VALIDATION_ERROR',
          message: 'validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          })),
        });
      },
    }),
  );
  app.useGlobalInterceptors(
    // new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  const port = process.env.PORT ?? 8080;
  await app.listen(port);
}
bootstrap();


