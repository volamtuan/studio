
import { getIpLinksAction } from '@/app/actions/ip-links';
import { notFound } from 'next/navigation';
import { IpRedirectClient } from '@/components/ip-redirect-client';

export default async function IpRedirectPage({ params }: { params: { id: string } }) {
  const links = await getIpLinksAction();
  const config = links.find(link => link.id === params.id);

  if (!config) {
    notFound();
  }

  // The client component now handles location request, logging, and redirection.
  return <IpRedirectClient config={config} />;
}
