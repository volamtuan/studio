
'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface RedirectClientProps {
  redirectUrl: string;
}

export function RedirectClient({ redirectUrl }: RedirectClientProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 800); // 800ms delay like in the user's PHP snippet

    return () => clearTimeout(timer);
  }, [redirectUrl]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Đang chuyển hướng an toàn...</p>
      </div>
    </div>
  );
}
