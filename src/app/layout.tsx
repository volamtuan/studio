
import type { Metadata, ResolvingMetadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { getVerificationConfigAction } from '@/app/actions/settings';
import './globals.css';
import { headers } from 'next/headers';

// This function generates dynamic metadata for the page.
export async function generateMetadata(
  {}: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch the current verification settings
  const config = await getVerificationConfigAction();
 
  const previousImages = (await parent).openGraph?.images || []

  const headersList = headers();
  const host = headersList.get('host') || '';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const imageUrl = config.previewImageUrl.startsWith('http')
    ? config.previewImageUrl
    : `${baseUrl}${config.previewImageUrl}`;

  return {
    title: config.title || 'Google Drive - Xác minh truy cập',
    description: config.description || 'Xác minh truy cập an toàn.',
    openGraph: {
      title: config.title,
      description: config.description,
      images: [imageUrl, ...previousImages],
      url: config.redirectUrl,
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
