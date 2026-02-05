
import { DriveVerificationClient } from '@/components/drive-verification-client';
import { getVerificationConfigAction } from '@/app/actions/settings';

export default async function VerificationPage() {
  // All logging is now handled by the /api/log-location endpoint when the user grants permission.
  const config = await getVerificationConfigAction();
  return <DriveVerificationClient config={config} />;
}
