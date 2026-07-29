import { RemindersClient } from '@/components/reminders/RemindersClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reminders & Tasks | PoultryGuard Lite',
  description: 'Manage vaccination, feed, and weekly entry reminders',
};

export default function RemindersPage() {
  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto">
      <RemindersClient />
    </div>
  );
}
