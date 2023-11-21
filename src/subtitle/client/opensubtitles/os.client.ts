import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import {
  DownloadRequestResponse,
  LoginResponse,
  SearchParams,
  SubtitleSearchResponse,
} from './model';
import { ConfigService } from '@nestjs/config';
import { Subtitle } from '../../model/subtitle.interface';
import { SearchOptions, SubtitleProviders } from '../../model';

@Injectable()
export class OpensubtitlesClient {
  private baseApiUrl: string;
  private apiKey: string;
  private userAgent: string;

  constructor(private readonly configService: ConfigService) {
    this.baseApiUrl = this.configService.getOrThrow('OB_API_URL');
    this.apiKey = this.configService.getOrThrow('OB_API_KEY');
    this.userAgent = this.configService.getOrThrow('USER_AGENT');
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };
  }

  async login(): Promise<LoginResponse> {
    const headers = this.getHeaders();

    const loginRequestData = {
      username: this.configService.getOrThrow('OB_USERNAME'),
      password: this.configService.getOrThrow('OB_PASSWORD'),
    };

    try {
      const response: AxiosResponse<LoginResponse> = await axios.post(
        `${this.baseApiUrl}/login`,
        loginRequestData,
        {
          headers,
        },
      );

      if (!response.data.token) {
        throw new Error('Login error, token not found');
      }
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      Logger.debug(`Login failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async searchSubtitles(searchOptions: SearchOptions): Promise<Subtitle[]> {
    const osLanguages = Array.isArray(searchOptions.languages)
      ? searchOptions.languages.sort().join(',')
      : searchOptions.languages;

    const searchParams: SearchParams = {
      imdb_id: searchOptions.imdbId,
      languages: osLanguages,
      type: searchOptions.featureType,
      year: searchOptions.year.toString(),
      page: '1', //TODO: Handle pagination inside client
    };

    const headers = this.getHeaders();

    try {
      const urlWithParams = searchParams
        ? `${this.baseApiUrl}/subtitles?${new URLSearchParams(searchParams)}`
        : `${this.baseApiUrl}/subtitles`;

      const response: AxiosResponse<SubtitleSearchResponse> = await axios.get(
        urlWithParams,
        { headers },
      );

      if (response.status >= 200 && response.status < 300) {
        return this.mapSearchResponseToSubtitle(response.data);
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      Logger.debug(`Subtitle search failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async requestDownload(fileId: string): Promise<DownloadRequestResponse> {
    const loginResponse = await this.login();
    const headers = {
      ...this.getHeaders(),
      Authorization: `Bearer ${loginResponse.token}`,
    };

    const requestData = {
      file_id: fileId,
    };

    try {
      const response: AxiosResponse<DownloadRequestResponse> = await axios.post(
        `${this.baseApiUrl}/download`,
        requestData,
        {
          headers,
        },
      );
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      Logger.debug(`Download request failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async downloadSubtitle(link: string): Promise<string> {
    try {
      const response: AxiosResponse<string> = await axios.get(link, {
        responseType: 'text',
      });
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      Logger.debug(`Subtitle download failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  mapSearchResponseToSubtitle(
    searchResponse: SubtitleSearchResponse,
  ): Subtitle[] {
    return searchResponse.data.map((datum) => {
      const featureDetails = datum.attributes.feature_details;
      const subtitle: Subtitle = {
        originId: datum.id,
        provider: SubtitleProviders.Opensubtitles,
        fileId: datum.attributes.subtitle_id,
        createdOn: datum.attributes.upload_date,
        url: datum.attributes.url,
        comments: datum.attributes.comments,
        releaseName: datum.attributes.release,
        featureDetails: {
          featureType: datum.attributes.feature_details.feature_type,
          year: featureDetails.year,
          title: featureDetails.title,
          movieName: featureDetails.movie_name,
          imdbId: featureDetails.imdb_id,
          seasonNumber: featureDetails.season_number,
          episodeNumber: featureDetails.episode_number,
        },
      };
      return subtitle;
    });
  }
}
