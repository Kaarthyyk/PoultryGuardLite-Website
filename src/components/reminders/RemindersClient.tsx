'use client';

import { useState } from 'react';
import { Bell, CheckCircle2, Clock, Syringe, Wheat, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ReminderStatus = 'Completed' | 'Pending' | 'Upcoming';
type ReminderType = 'Vaccination' | 'Weekly Entry' | 'Feed' | 'Medicine';

interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  date: Date;
  status: ReminderStatus;
  description?: string;
}

export function RemindersClient() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const now = new Date().getTime();
    return [
      {
        id: '1',
        title: 'Newcastle Disease Vaccination',
        type: 'Vaccination',
        date: new Date(now + 86400000 * 2), // 2 days from now
        status: 'Upcoming',
        description: 'Administer ND vaccine via drinking water to Batch A'
      },
      {
        id: '2',
        title: 'Weekly Farm Entry',
        type: 'Weekly Entry',
        date: new Date(now - 86400000), // yesterday
        status: 'Pending',
        description: 'Record feed, water, and mortality for Week 4'
      },
      {
        id: '3',
        title: 'Restock Starter Feed',
        type: 'Feed',
        date: new Date(now - 86400000 * 3), // 3 days ago
        status: 'Completed',
        description: 'Order 50 bags of starter feed from supplier'
      }
    ];
  });

  const getIcon = (type: ReminderType) => {
    switch (type) {
      case 'Vaccination': return <Syringe className="w-5 h-5 text-blue-500" />;
      case 'Weekly Entry': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'Feed': return <Wheat className="w-5 h-5 text-amber-500" />;
      case 'Medicine': return <Syringe className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ReminderStatus) => {
    switch (status) {
      case 'Completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Pending': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Upcoming': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const markCompleted = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'Completed' } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reminders & Tasks</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage vaccinations, feed schedules, and entries.</p>
        </div>
        <div className="flex-1" />
        <Button style={{ background: 'linear-gradient(135deg, #F4A900, #d4920a)', color: '#1A1200' }}>
          + Add Reminder
        </Button>
      </div>
      
      <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 p-4 rounded-xl text-sm flex gap-3">
        <Bell className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold mb-1">System Limitation Notice</p>
          <p>Cloud functions and automated push notifications are currently disabled. Reminders must be checked manually in this dashboard. We plan to re-enable automated push notifications in the future.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Upcoming & Pending Tasks</h3>
          {reminders.filter(r => r.status !== 'Completed').map(reminder => (
            <div key={reminder.id} className="rounded-2xl border border-border bg-card p-5 glass group transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                  {getIcon(reminder.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{reminder.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(reminder.status)}`}>
                      {reminder.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {reminder.date.toLocaleDateString()}
                    </div>
                    {reminder.status === 'Pending' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markCompleted(reminder.id)}>
                        Mark as Done
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {reminders.filter(r => r.status !== 'Completed').length === 0 && (
            <p className="text-muted-foreground text-sm">All caught up! No pending tasks.</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg">Completed Tasks</h3>
          <div className="rounded-2xl border border-border bg-card p-5 glass space-y-4">
            {reminders.filter(r => r.status === 'Completed').map(reminder => (
              <div key={reminder.id} className="flex gap-3 items-start pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm line-through text-muted-foreground">{reminder.title}</h4>
                  <p className="text-xs text-muted-foreground/70">{reminder.date.toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
