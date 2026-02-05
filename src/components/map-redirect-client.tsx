'use client';

import { useEffect } from 'react';

interface MapRedirectClientProps {
  redirectUrl: string;
}

export function MapRedirectClient({ redirectUrl }: MapRedirectClientProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.replace(redirectUrl);
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
