import { Module } from '@nestjs/common';
import { SubtitleService } from './service/subtitle.service';
import { OpensubtitlesService } from './service/opensubtitles/os.service';
import { StorageModule } from '../storage/storage.module';
import { SubtitleController } from './subtitle.controller';
import { ConfigModule } from '@nestjs/config';
import { Addic7edService } from './service/addic7ted/addic7ed.service';
import { TvdbService } from './service/tvdb/tvdb.service';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [SubtitleController],
  providers: [
    SubtitleService,
    OpensubtitlesService,
    Addic7edService,
    TvdbService,
  ],
  exports: [SubtitleService],
})
export class SubtitleModule {}
