'use client';

import { useMemo, useState, useEffect } from 'react';
import { Building2, Users, FileText, Activity } from 'lucide-react';
import { useFarms } from '@/hooks/useFarms';
import { useScanHistory } from '@/hooks/useScanHistory';
import { BatchRepository } from '@/repositories/batch.repository';
import { EntryRepository } from '@/repositories/entry.repository';
import { SaleRepository } from '@/repositories/sale.repository';
import type { Batch, WeeklyEntry, Sale } from '@/types/models';
import { DashboardCharts } from '@/components/home/DashboardCharts';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/ui/States';

export default function HomePage() {
  const { data: farms, isLoading: loadingFarms, error: errorFarms } = useFarms();
  const { data: scans, isLoading: loadingScans, error: errorScans } = useScanHistory();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Fetch all batches and sales across all farms
  useEffect(() => {
    let isMounted = true;
    const fetchAllBatches = async () => {
      if (!farms || farms.length === 0) {
        if (isMounted) {
          setBatches([]);
          setSales([]);
        }
        return;
      }
      setLoadingBatches(true);
      setLoadingSales(true);
      try {
        const batchPromises = farms.map((farm) => BatchRepository.getBatches(farm.id));
        const salesPromises = farms.map((farm) => SaleRepository.getSales(farm.id));
        const batchResults = await Promise.all(batchPromises);
        const salesResults = await Promise.all(salesPromises);
        if (isMounted) {
          setBatches(batchResults.flat());
          setSales(salesResults.flat());
        }
      } catch (error) {
        console.error("Failed to fetch batches or sales:", error);
      } finally {
        if (isMounted) {
          setLoadingBatches(false);
          setLoadingSales(false);
        }
      }
    };
    
    fetchAllBatches();
    return () => {
      isMounted = false;
    };
  }, [farms]);

  // Fetch entries for all active batches
  useEffect(() => {
    let isMounted = true;
    const fetchEntries = async () => {
      const activeBatches = batches.filter(b => b.status === 'Active');
      if (activeBatches.length === 0) {
        if (isMounted) setEntries([]);
        return;
      }
      setLoadingEntries(true);
      try {
        const entryPromises = activeBatches.map(b => EntryRepository.getEntries(b.farmId, b.id));
        const results = await Promise.all(entryPromises);
        if (isMounted) {
          setEntries(results.flat());
        }
      } catch (err) {
        console.error("Failed to fetch entries", err);
      } finally {
        if (isMounted) setLoadingEntries(false);
      }
    };
    if (batches.length > 0) {
      fetchEntries();
    }
    return () => {
      isMounted = false;
    };
  }, [batches]);

  const activeBatchesCount = useMemo(() => {
    return batches.filter(b => b.status === 'Active').length;
  }, [batches]);
  
  const totalBirds = useMemo(() => {
    return batches.filter(b => b.status === 'Active').reduce((sum, b) => sum + b.currentBirds, 0);
  }, [batches]);

  const mortalityPercent = useMemo(() => {
    const activeBatches = batches.filter(b => b.status === 'Active');
    const initialBirds = activeBatches.reduce((sum, b) => sum + b.totalBirds, 0);
    const currentBirds = activeBatches.reduce((sum, b) => sum + b.currentBirds, 0);
    if (initialBirds === 0) return 0;
    return (((initialBirds - currentBirds) / initialBirds) * 100).toFixed(1);
  }, [batches]);

  const totalFeed = useMemo(() => {
    return entries.reduce((sum, e) => sum + e.feedConsumedKg, 0);
  }, [entries]);
  
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.revenue, 0);
  }, [sales]);

  const totalProfit = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.estimatedProfit, 0);
  }, [sales]);

  const survivalRate = useMemo(() => {
    const activeBatches = batches.filter(b => b.status === 'Active');
    const initialBirds = activeBatches.reduce((sum, b) => sum + b.totalBirds, 0);
    const currentBirds = activeBatches.reduce((sum, b) => sum + b.currentBirds, 0);
    if (initialBirds === 0) return '0.0';
    return ((currentBirds / initialBirds) * 100).toFixed(1);
  }, [batches]);

  if (loadingFarms || loadingScans || loadingBatches || loadingEntries || loadingSales) {
    return <LoadingScreen />;
  }

  if (errorFarms || errorScans) {
    return <ErrorState title="Failed to load dashboard" message="An error occurred while loading your data." />;
  }

  const stats = [
    { label: 'Total Farms', value: farms?.length ?? 0, icon: Building2 },
    { label: 'Initial Birds', value: batches.filter(b => b.status === 'Active').reduce((s, b) => s + b.totalBirds, 0).toLocaleString(), icon: Users },
    { label: 'Remaining Birds', value: totalBirds.toLocaleString(), icon: Users },
    { label: 'Survival Rate', value: `${survivalRate}%`, icon: Activity },
    { label: 'Mortality %', value: `${mortalityPercent}%`, icon: Activity },
    { label: 'Feed (kg)', value: totalFeed.toLocaleString(), icon: FileText },
    { label: 'Revenue ($)', value: totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), icon: Activity },
    { label: 'Profit ($)', value: totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s a summary of your farm activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 glass group transition-all duration-300 hover:border-primary/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#F4A900' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 glass">
          <h3 className="font-semibold mb-4">Recent AI Scans</h3>
          {scans && scans.length > 0 ? (
            <div className="space-y-3">
              {scans.slice(0, 5).map(scan => (
                <div key={scan.id} className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{scan.result.diseaseName}</p>
                    <p className="text-xs text-muted-foreground">{scan.farmName} - {scan.batchName}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    scan.result.severity === 'High' || scan.result.severity === 'Critical' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {scan.result.severity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent AI scans found.</p>
          )}
        </div>
        
        <div className="rounded-2xl p-6 glass">
          <h3 className="font-semibold mb-4">Your Farms</h3>
          {farms && farms.length > 0 ? (
            <div className="space-y-3">
              {farms.slice(0, 5).map(farm => (
                <div key={farm.id} className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{farm.name}</p>
                    <p className="text-xs text-muted-foreground">{farm.type}</p>
                  </div>
                  <div className="text-sm font-medium">
                    {farm.capacity.toLocaleString()} birds cap
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No farms added yet.</p>
          )}
        </div>
      </div>
      
      <DashboardCharts batches={batches} entries={entries} scans={scans ?? []} />
    </div>
  );
}
