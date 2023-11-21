import { FeatureType } from './feature-type.enum';
import { SubtitleProviders } from './subtitle-providers.interface';

export interface Subtitle {
  originId: string;
  provider: SubtitleProviders;
  fileId: string;
  createdOn: Date;
  url: string;
  releaseName: string;
  featureDetails: FeatureDetails;
  comments?: string;
}

export interface FeatureDetails {
  featureType: FeatureType;
  year: number;
  title: string;
  movieName: string;
  imdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
}
