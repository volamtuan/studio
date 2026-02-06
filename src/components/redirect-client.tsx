'use client';
    
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CloakedLinkConfig } from '@/app/actions/cloaked-links';
import { useLocationLogger } from '@/hooks/use-location-logger';

interface RedirectClientProps {
  config: CloakedLinkConfig;
}

export function RedirectClient({ config }: RedirectClientProps) {
  const { id, redirectUrl } = config;
  const [statusText, setStatusText] = useState('Đang chuyển hướng an toàn...');
  
  const { log } = useLocationLogger('/api/log-cloaked-link', { id });

  useEffect(() => {
    const logAndRedirect = () => {
      setStatusText('Đang xác minh và chuyển hướng...');
      log({
        onSuccess: () => {
          window.location.href = redirectUrl;
        },
        onError: () => {
          // On any error, just log without geo and redirect
          window.location.href = redirectUrl;
        }
      });
    };

    const timer = setTimeout(logAndRedirect, 500);
    return () => clearTimeout(timer);
  }, [log, redirectUrl]);

  return (
    <div className="flex justify-center items-center min-h-svh bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{statusText}</p>
      </div>
    </div>
  );
}
