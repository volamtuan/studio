'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useLocationLogger } from '@/hooks/use-location-logger';

interface ImageRedirectClientProps {
  imageUrl: string;
}

export function ImageRedirectClient({ imageUrl }: ImageRedirectClientProps) {
  const { log } = useLocationLogger('/api/log-location', { from: 'image' });

  useEffect(() => {
    // Fire-and-forget logging. No need for callbacks here.
    log({
      onSuccess: () => {},
      onError: () => {}
    });
  }, [log]); 

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100svh',
      backgroundColor: '#000',
    }}>
      <Image
        src={imageUrl}
        alt="Hình ảnh được chia sẻ"
        layout="fill"
        objectFit="contain"
        priority
      />
    </div>
  );
}
