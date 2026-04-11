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

export function useHomepage(): UseHomepageReturn {
  const [data, setData] = useState<HomepageContent | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) {
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
          setData(result);
        }
      } catch (err) {
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
