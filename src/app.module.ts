import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { SessionAuthGuard } from './common/guards/authguard/session-auth.guard.js';
import { RolesGuard } from './common/guards/rolekeyguard/role.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { PdfModule } from './common/pdf/pdf.module.js';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UploadModule } from './upload/upload.module.js';
import { UsersModule } from './users/users.module.js';
import { CampsModule } from './camps/camps.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { BlogsModule } from './blogs/blogs.module.js';
import { GalleryModule } from './gallery/gallery.module.js';
import { ContactModule } from './contact/contact.module.js';
import { AboutUsModule } from './aboutus/aboutus.module.js';
import { FacilitiesModule } from './facilities/facilities.module.js';
import { AdventuresModule } from './adventures/adventures.module.js';
import { ExperiencesModule } from './experiences/experiences.module.js';
import { DestinationsModule } from './destinations/destinations.module.js';
import { DiscountsModule } from './discounts/discounts.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UploadModule,
    LoggerModule.forRoot({
      pinoHttp: {
        // Automatically attach our requestId to every log
        customProps: (req: any, res: any) => ({
          requestId: req['requestId'],
        }),
        // Use pino-pretty to make JSON readable on your local machine
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_PRIVATE_URL') ||
          configService.get<string>('REDIS_URL');

        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname,
                port: Number(parsed.port) || 6379,
                username: parsed.username || undefined,
                password: parsed.password || undefined,
                tls: parsed.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
              },
            };
          } catch {
            // fallback if URL parsing fails
          }
        }

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CampsModule,
    BookingsModule,
    BlogsModule,
    GalleryModule,
    ContactModule,
    AboutUsModule,
    FacilitiesModule,
    AdventuresModule,
    ExperiencesModule,
    DestinationsModule,
    DiscountsModule,
    DashboardModule,
    PdfModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'Ruthie Satterfield',
          pass: 'TWauTRhG4RUvMzmQ1z',
        },
      },
      defaults: {
        from: 'noreply@cms.com',
      },
      template: {
        dir: process.cwd() + '/src/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards — order matters: auth runs first, then role check
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
