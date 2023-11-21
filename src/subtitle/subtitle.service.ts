import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Fuse, { FuseResult } from 'fuse.js';
import { OpensubtitlesClient } from './client/opensubtitles/os.client';
import { S3StorageStrategy } from '../storage/strategy/s3-storage.strategy';
import { Subtitle, SubtitleProviders } from './model';
import { SearchOptions } from './model/search-options.interface';

@Injectable()
export class SubtitleService {
  constructor(
    private readonly opensubtitlesClient: OpensubtitlesClient,
    private readonly s3StorageStrategy: S3StorageStrategy,
  ) {}

  async searchOpenSubtitles(
    searchOptions: SearchOptions,
  ): Promise<FuseResult<Subtitle>[]> {
    const osSearchResults =
      await this.opensubtitlesClient.searchSubtitles(searchOptions);

    const fuse = new Fuse(osSearchResults, {
      keys: ['releaseName', 'comments'],
      ignoreLocation: true,
    });

    const fuseResult = fuse.search(searchOptions.query);
    return fuseResult;
  }

  async cacheSubtitle(filename: string, content: string) {
    return await this.s3StorageStrategy.uploadFile(filename, content);
  }

  async getSubtitle(
    fileId: string,
    provider: SubtitleProviders,
  ): Promise<string> {
    if (!fileId || !provider) {
      throw new BadRequestException(
        'Cannot get subtitle: file id or provider is invalid',
      );
    }

    try {
      const subtitle = await this.s3StorageStrategy.getFile(fileId);
      return subtitle;
    } catch (error) {
      Logger.debug(error.message);

      let file: string;
      //TODO: add more providers
      switch (provider) {
        case SubtitleProviders.Opensubtitles:
          const downloadRequestResponse =
            await this.opensubtitlesClient.requestDownload(fileId);

          file = await this.opensubtitlesClient.downloadSubtitle(
            downloadRequestResponse.link,
          );
      }

      this.cacheSubtitle(fileId, file);
      return file;
    }
  }
}
