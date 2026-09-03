const ACCESS_TOKEN_KEY = 'devcollab_access_token';
const REFRESH_TOKEN_KEY = 'devcollab_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const setAccessToken = (access: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const hasTokens = (): boolean => {
  return !!getAccessToken() || !!getRefreshToken();
};
