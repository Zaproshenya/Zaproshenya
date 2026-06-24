import { Metadata } from 'next';
import ClientUserProfile from './ClientUserProfile';

export const metadata: Metadata = {
  title: 'Профіль ✦',
};

export default async function UserProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  return <ClientUserProfile uid={uid} />;
}
