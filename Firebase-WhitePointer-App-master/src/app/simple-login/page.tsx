import { redirect } from 'next/navigation';

export default function SimpleLoginPage() {
  // Redirect to main login page to consolidate authentication
  redirect('/login');
}