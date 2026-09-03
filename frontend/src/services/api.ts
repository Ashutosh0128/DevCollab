import axios from 'axios';
import type { HealthResponse } from '../types/api';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealthStatus = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health/');
  return response.data;
};

export default api;
