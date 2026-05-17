'use client';

import { useEffect, useRef, useState } from 'react';
import { djangoApi } from '@/lib/api';

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface Asset {
  id: string;
  type: string;
  url: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
}

export interface GenerationUpdate {
  id: string;
  status: JobStatus;
  progress: number | null;
  error_message: string | null;
  assets: Asset[];
}

const TERMINAL = new Set<JobStatus>(['completed', 'failed']);
const POLL_MS = 3000;

export function useGenerationPoll(generationId: string | null): GenerationUpdate | null {
  const [update, setUpdate] = useState<GenerationUpdate | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setUpdate(null);

    if (!generationId) return;

    async function poll() {
      if (cancelledRef.current) return;
      try {
        const data = await djangoApi.getGeneration(generationId!);
        if (cancelledRef.current || !data) return;
        setUpdate(data as GenerationUpdate);
        if (!TERMINAL.has(data.status)) {
          timerRef.current = setTimeout(poll, POLL_MS);
        }
      } catch {
        if (!cancelledRef.current) {
          timerRef.current = setTimeout(poll, POLL_MS);
        }
      }
    }

    poll();

    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generationId]);

  return update;
}
