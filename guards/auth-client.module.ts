import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PermissionGuard } from '../guards/permission.guard';

@Global() // makes it available globally, no need to import everywhere
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
          queue: 'auth_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  providers: [PermissionGuard],
  exports: [ClientsModule, PermissionGuard], 
})
export class AuthClientModule {}
