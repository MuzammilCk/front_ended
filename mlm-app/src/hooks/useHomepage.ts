// src/hooks/useHomepage.ts
// Shared hook that fetches homepage content once and caches in component state.
// All homepage components should use this instead of importing from src/data/*.

import { useState, useEffect } from 'react';
import { getHomepageContent } from '../api/homepage';
import type { HomepageContent } from '../api/types';

interface UseHomepageReturn {
  data: HomepageContent | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache so multiple components share the same request.
let cachedData: HomepageContent | null = null;
let cachePromise: Promise<HomepageContent> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useHomepage(): UseHomepageReturn {
  const [data, setData] = useState<HomepageContent | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use cached data if it's fresh
    if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      // De-duplicate concurrent requests
      if (!cachePromise) {
        cachePromise = getHomepageContent();
      }

      try {
        const result = await cachePromise;
        if (!cancelled) {
          cachedData = result;
          cacheTimestamp = Date.now();
          setData(result);
        }
      } catch (err) {
        // Allow retry on next mount by clearing the failed promise
        cachePromise = null;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load homepage content');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
