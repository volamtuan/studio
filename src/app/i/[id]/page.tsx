
import type { Metadata, ResolvingMetadata } from 'next';
import { getImageLinksAction, type ImageLinkConfig } from '@/app/actions/image-links';
import { ImageRedirectClient } from '@/components/image-redirect-client';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string }
}

async function getLinkConfig(id: string): Promise<ImageLinkConfig | undefined> {
  const links = await getImageLinksAction();
  return links.find(link => link.id === id);
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const config = await getLinkConfig(params.id);

  if (!config) {
    return {
      title: 'Không tìm thấy ảnh'
    }
  }
 
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: config.title,
    description: 'Nhấn để xem ảnh đầy đủ.',
    openGraph: {
      title: config.title,
      description: 'Nhấn để xem ảnh đầy đủ.',
      images: [config.imageUrl, ...previousImages],
      type: 'website',
    },
     twitter: {
        card: "summary_large_image",
        title: config.title,
        description: 'Nhấn để xem ảnh đầy đủ.',
        images: [config.imageUrl],
    },
  }
}

export default async function ImagePreviewPage({ params }: Props) {
  const config = await getLinkConfig(params.id);

  if (!config) {
    notFound();
  }

  // The client component will handle logging and redirection.
  return <ImageRedirectClient imageUrl={config.imageUrl} />;
}
