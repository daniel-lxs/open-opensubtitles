export interface LoginResponse {
  user: User;
  base_url: string;
  token: string;
  status: number;
}

export interface User {
  allowed_downloads: number;
  allowed_translations: number;
  level: string;
  user_id: number;
  ext_installed: boolean;
  vip: boolean;
}
