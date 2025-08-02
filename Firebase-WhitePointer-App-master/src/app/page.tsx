import { redirect } from 'next/navigation';

export default function RootPage() {
  // For authenticated users, this will be handled by the (app) route group
  // For unauthenticated users, AuthGuard will redirect to login
  redirect('/login');
}
