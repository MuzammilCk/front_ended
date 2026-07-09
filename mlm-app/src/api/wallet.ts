import { apiRequest } from './client';

export interface WalletSummary {
  available: number;
  pending: number;
  total_earned: number;
}

/**
 * Fix B8: Fetch real wallet balance from the backend.
 * Maps to GET /wallet/balance
 */
export async function getWalletBalance(): Promise<WalletSummary> {
  return apiRequest<WalletSummary>('/wallet/balance', {
    method: 'GET',
  });
}
