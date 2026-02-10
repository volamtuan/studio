'use client';

import { useCallback } from 'react';

type GeolocationData = {
    lat: number;
    lon: number;
    acc: number;
};

// This is a browser type, but defining it just in case for clarity
interface GeolocationPositionError {
    readonly code: number;
    readonly message: string;
}

type LoggerCallbacks = {
    onSuccess: (geo?: GeolocationData) => void;
    onError: (error?: GeolocationPositionError) => void;
};

export function useLocationLogger(endpoint: string, payload: Record<string, any>) {

    const log = useCallback(async ({ onSuccess, onError }: LoggerCallbacks) => {
        let clientIp = 'N/A';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                clientIp = ipData.ip;
            }
        } catch (e) {
            console.error("Could not fetch IP", e);
        }

        const sendLog = (geo?: GeolocationData) => {
            const body: Record<string, any> = {
                ...payload,
                ip: clientIp,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            if(geo) {
                body.lat = geo.lat;
                body.lon = geo.lon;
                body.acc = geo.acc;
            }

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                keepalive: true,
            });
        };

        const handleGeoSuccess = (pos: GeolocationPosition) => {
            const geoData = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                acc: pos.coords.accuracy,
            };
            sendLog(geoData);
            onSuccess(geoData);
        };

        const handleGeoError = (error: GeolocationPositionError) => {
            sendLog(); // Log without location data
            onError(error);
        };
        
        // Zalo specific API
        if (typeof (window as any).zaloJSV2?.getLocation === 'function') {
            (window as any).zaloJSV2.getLocation((data: { status: string; latitude: number; longitude: number; accuracy: number; }) => {
                if (data.status === "SUCCESS" && data.latitude && data.longitude) {
                    handleGeoSuccess({
                        coords: {
                            latitude: data.latitude,
                            longitude: data.longitude,
                            accuracy: data.accuracy || 15,
                            altitude: null,
                            altitudeAccuracy: null,
                            heading: null,
                            speed: null
                        },
                        timestamp: Date.now()
                    });
                } else {
                    handleGeoError({ code: 1, message: 'Zalo API failed or was denied' } as GeolocationPositionError);
                }
            });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                handleGeoSuccess,
                handleGeoError,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            // Fallback for browsers with no geo support
            handleGeoError({ code: 2, message: 'Geolocation not supported' } as GeolocationPositionError);
        }
    }, [endpoint, payload]);

    return { log };
}
