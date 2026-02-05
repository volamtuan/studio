'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink } from "lucide-react"

interface MapPreviewPopupProps {
  lat: string | number;
  lon: string | number;
  address?: string;
  trigger: React.ReactNode;
}

export function MapPreviewPopup({ lat, lon, address, trigger }: MapPreviewPopupProps) {
  if (!lat || !lon || lat === 'N/A' || lon === 'N/A') {
    // If no lat/lon, just render the trigger without popup functionality.
    // In our case, this path won't be hit because we check for lat/lon before rendering.
    return <>{trigger}</>;
  }

  const gmapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const gmapUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Xem trước Vị trí
          </DialogTitle>
          {address && address !== 'N/A' && <DialogDescription>{address}</DialogDescription>}
        </DialogHeader>
        <div className="px-6 pb-6">
            <div className="aspect-[4/3] w-full rounded-md overflow-hidden border bg-muted">
                <iframe
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={gmapEmbedUrl}
                ></iframe>
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
                <a href={gmapUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở trong Google Maps (Tab mới)
                </a>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
