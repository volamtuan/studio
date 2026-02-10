
import type { Metadata, ResolvingMetadata } from 'next';
import { getCloakedLinksAction, type CloakedLinkConfig } from '@/app/actions/cloaked-links';
import { RedirectClient } from '@/components/redirect-client';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

type Props = {
  params: { id: string }
}

async function getLinkConfig(id: string): Promise<CloakedLinkConfig | undefined> {
  const links = await getCloakedLinksAction();
  return links.find(link => link.id === id);
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const config = await getLinkConfig(params.id);

  if (!config) {
    return {
      title: 'Không tìm thấy liên kết'
    }
  }

  const headersList = headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const imageUrl = config.imageUrl.startsWith('http')
    ? config.imageUrl
    : `${baseUrl}${config.imageUrl}`;
 
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
      }, ...previousImages],
      type: 'website',
      url: config.redirectUrl,
    },
     twitter: {
        card: "summary_large_image",
        title: config.title,
        description: config.description,
        images: [imageUrl],
    },
  }
}

export default async function CloakedRedirectPage({ params }: Props) {
  const config = await getLinkConfig(params.id);

  if (!config) {
    notFound();
  }

  return <RedirectClient config={config} />;
}
