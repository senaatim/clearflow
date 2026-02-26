'use client';

import { redirect } from 'next/navigation';

export default function ProfilePage() {
  // Redirect to settings page with profile tab
  redirect('/settings');
}
