import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchResponse } from './model/search-response.interface';
import { SubtitleResponse } from './model/subtitle-response.interface';
import { Subtitle } from '../../model/subtitle.interface';
import { FeatureType, SearchOptions, SubtitleProviders } from '../../model';
import { TvdbService } from '../tvdb/tvdb.service';

@Injectable()
export class Addic7edService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tvdbService: TvdbService,
  ) {}

  private async getShowByTvdbId(id: string) {
    const baseUrl = this.configService.getOrThrow('ADICC7ED_API_URL');
    const response = await axios.get<SearchResponse>(
      `${baseUrl}/shows/external/tvdb/${id}`,
    );
    return response.data.shows[0];
  }

  private mapSubtitleResponseToSubtitle(
    subtitleResponse: SubtitleResponse,
  ): Subtitle[] {
    const { matchingSubtitles, episode } = subtitleResponse;

    const { season, number, title, show } = episode;

    const subtitles: Subtitle[] = matchingSubtitles.map((matchingSubtitle) => {
      const {
        subtitleId,
        version = '',
        //completed = false,
        //hearingImpaired = false,
        //corrected = false,
        //hd = false,
        downloadUri,
        //language = '',
        discovered: subtitleDiscovered,
        //downloadCount = 0,
      } = matchingSubtitle;

      return {
        originId: subtitleId,
        provider: SubtitleProviders.Addic7ted,
        fileId: subtitleId,
        createdOn: subtitleDiscovered,
        url: downloadUri,
        releaseName: version,
        featureDetails: {
          featureType: FeatureType.Episode,
          title,
          featureName: show,
          seasonNumber: season,
          episodeNumber: number,
        },
        comments: '',
      };
    });

    return subtitles;
  }

  async searchSubtitles(searchOptions: SearchOptions) {
    const tvdbShowData = await this.tvdbService.getShowByIMDBId(
      searchOptions.imdbId,
    );

    const addic7edShowData = await this.getShowByTvdbId(
      tvdbShowData.id.toString(),
    );

    if (searchOptions.featureType === FeatureType.Episode) {
      const baseUrl = this.configService.getOrThrow('ADICC7ED_API_URL');
      const response = await axios.get<SubtitleResponse>(
        `${baseUrl}/subtitles/get/${addic7edShowData.id}/${searchOptions.seasonNumber}/${searchOptions.episodeNumber}/${searchOptions.language}`,
      );
      const mappedSubtitles = this.mapSubtitleResponseToSubtitle(response.data);
      return mappedSubtitles;
    }
  }
}
