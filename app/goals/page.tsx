import { redirect } from 'next/navigation';

export default function GoalsPage() {
  redirect('/settings?tab=goals');
} 