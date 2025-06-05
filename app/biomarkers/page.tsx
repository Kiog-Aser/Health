import { redirect } from 'next/navigation';

export default function BiomarkersPage() {
  redirect('/settings?tab=biomarkers');
} 