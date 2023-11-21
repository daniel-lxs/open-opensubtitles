import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { OpensubtitlesClient } from './client/opensubtitles/os.client';
import { StorageModule } from '../storage/storage.module';
import { SubtitleController } from './subtitle.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [SubtitleController],
  providers: [SubtitleService, OpensubtitlesClient],
  exports: [SubtitleService],
})
export class SubtitleModule {}
