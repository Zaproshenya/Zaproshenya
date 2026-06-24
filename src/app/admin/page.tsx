import { Metadata } from 'next';
import ClientAdminPage from './ClientAdminPage';

export const metadata: Metadata = {
  title: 'Дашборд ✦',
  description: 'Панель адміністратора',
};

export default function AdminPage() {
  return <ClientAdminPage />;
}
