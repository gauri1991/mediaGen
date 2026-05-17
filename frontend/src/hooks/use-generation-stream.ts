'use client';

import { useEffect, useRef, useState } from 'react';
import { streamUrl } from '@/lib/api';

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

export function useGenerationStream(generationId: string | null) {
  const [update, setUpdate] = useState<GenerationUpdate | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!generationId) {
      const t = setTimeout(() => setUpdate(null), 0);
      return () => clearTimeout(t);
    }

    const es = new EventSource(streamUrl(generationId));
    esRef.current = es;

    es.addEventListener('update', (e) => {
      const data = JSON.parse(e.data) as GenerationUpdate;
      setUpdate(data);
      if (TERMINAL.has(data.status)) {
        es.close();
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [generationId]);

  return update;
}
