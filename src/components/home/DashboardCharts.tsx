'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { Batch, WeeklyEntry, ScanHistory } from '@/types/models';
import { formatDate } from '@/lib/utils';

const COLORS = ['#F4A900', '#4ADE80', '#F87171', '#60A5FA', '#A78BFA'];

export function DashboardCharts({
  entries,
  scans
}: {
  batches: Batch[];
  entries: WeeklyEntry[];
  scans: ScanHistory[];
}) {
  // 1. Mortality Trend
  const mortalityData = useMemo(() => {
    const dates: Record<string, number> = {};
    entries.forEach(e => {
      if (!e.entryDate) return;
      const d = formatDate(e.entryDate);
      dates[d] = (dates[d] || 0) + e.mortalityCount;
    });
    return Object.entries(dates)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Last 10 data points
  }, [entries]);

  // 2. Disease Distribution
  const diseaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    scans.forEach(s => {
      const name = s.result.diseaseName;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scans]);

  // 3. Feed Usage
  const feedData = useMemo(() => {
    const dates: Record<string, number> = {};
    entries.forEach(e => {
      if (!e.entryDate) return;
      const d = formatDate(e.entryDate);
      dates[d] = (dates[d] || 0) + e.feedConsumedKg;
    });
    return Object.entries(dates)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [entries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="rounded-2xl p-6 glass border border-border/50">
        <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wider">Mortality Trend</h3>
        <div className="h-[250px] w-full">
          {mortalityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mortalityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1200', borderColor: 'rgba(244,169,0,0.4)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" name="Mortality" stroke="#F87171" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No mortality data</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6 glass border border-border/50">
        <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wider">Feed Consumption (kg)</h3>
        <div className="h-[250px] w-full">
          {feedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1200', borderColor: 'rgba(244,169,0,0.4)', borderRadius: '8px' }} />
                <Bar dataKey="amount" name="Feed (kg)" fill="#4ADE80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No feed data</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6 glass border border-border/50 lg:col-span-2">
        <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wider">AI Scan Disease Distribution</h3>
        <div className="h-[300px] w-full">
          {diseaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {diseaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1200', borderColor: 'rgba(244,169,0,0.4)', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No scan data</div>
          )}
        </div>
      </div>
    </div>
  );
}
