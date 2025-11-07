import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Event } from 'src/event/entities/event.entity';
import { Activity } from 'src/event/activity/entities/activity.entity';
import { Document } from 'src/event/document/entities/document.entity';
import { Participant } from 'src/event/participant/entities/participant.entity';
import { SessionParticipantMap } from 'src/event/participant/entities/sessionParticipantMap.entity';
import { EventSession } from 'src/event/event_session/entities/event_session.entity';
import { Trainer } from 'src/event/trainer/entities/trainer.entity';
import { StatusAuditLog } from '../audit_log/entity/auditlog.entity';
import { EventDate } from 'src/event/event_date/entities/event_date.entity';
import { LowercaseSubscriber } from './lowercase.subscriber';

ConfigModule.forRoot({ isGlobal: true });

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    Event,
    Activity,
    Document,
    Participant,
    SessionParticipantMap,
    EventDate,
    EventSession,
    Trainer,
    StatusAuditLog,
  ],
  synchronize: true,
  subscribers: [LowercaseSubscriber],
};
