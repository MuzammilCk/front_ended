// src/api/network.ts
// User network view — upline path, downline tree, qualification state.
// Endpoints:
//   GET /network/upline
//   GET /network/downline
//   GET /network/qualification

import { apiRequest } from './client';
import type { NetworkNode, QualificationState } from './types';

export async function getUplinePath(): Promise<string[]> {
  return apiRequest<string[]>('/network/upline', {
    method: 'GET',
  });
}

export interface GetDownlineParams {
  maxDepth?: number;
}

export async function getDownline(params: GetDownlineParams = {}): Promise<NetworkNode[]> {
  const query = new URLSearchParams();
  if (params.maxDepth !== undefined) query.set('maxDepth', String(params.maxDepth));
  const qs = query.toString();
  return apiRequest<NetworkNode[]>(`/network/downline${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getQualificationState(): Promise<QualificationState> {
  return apiRequest<QualificationState>('/network/qualification-status', {
    method: 'GET',
  });
}
