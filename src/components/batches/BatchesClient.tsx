'use client';

import { useState } from 'react';
import { useBatches, useAddBatch, useUpdateBatch } from '@/hooks/useBatches';
import { BatchCard } from '@/components/batches/BatchCard';
import { BatchForm } from '@/components/batches/BatchForm';
import { Modal } from '@/components/ui/Modal';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import type { Batch, BatchInput } from '@/types/models';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrandedPDF } from '@/lib/pdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

export function BatchesClient({ farmId }: { farmId: string }) {
  const router = useRouter();
  const { data: batches, isLoading, error } = useBatches(farmId);
  const addBatch = useAddBatch();
  const updateBatch = useUpdateBatch();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | undefined>();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorState title="Failed to load batches" />;

  const handleOpenModal = (batch?: Batch) => {
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBatch(undefined);
  };

  const handleSubmit = async (data: BatchInput) => {
    try {
      if (editingBatch) {
        await updateBatch.mutateAsync({ ...editingBatch, ...data });
        toast('Batch updated successfully', 'success');
      } else {
        await addBatch.mutateAsync(data);
        toast('Batch added successfully', 'success');
      }
      handleCloseModal();
    } catch {
      toast('Failed to save batch', 'error');
    }
  };

  const exportToPDF = async () => {
    if (!batches || batches.length === 0) {
      toast('No data to export', 'error');
      return;
    }
    
    const { doc, startY, addFooter } = await createBrandedPDF('PoultryGuardLite Batch Report');
    
    const tableData = batches.map(b => [
      b.batchName,
      b.birdType,
      b.breed,
      b.status,
      b.currentBirds.toLocaleString(),
      b.arrivalDate ? formatDate(b.arrivalDate) : 'Unknown'
    ]);

    autoTable(doc, {
      startY,
      head: [['Batch Name', 'Type', 'Breed', 'Status', 'Birds', 'Arrival Date']],
      body: tableData,
    });
    
    addFooter();
    doc.save('PoultryGuard_Batch_Report.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/farms')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Batches</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage flocks for this farm.</p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button onClick={() => handleOpenModal()} style={{ background: 'linear-gradient(135deg, #F4A900, #d4920a)', color: '#1A1200' }}>
            + Add Batch
          </Button>
        </div>
      </div>

      {batches && batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} onEdit={handleOpenModal} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-8 text-center glass">
          <p className="text-muted-foreground text-sm">
            No batches found. Add your first batch to get started!
          </p>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingBatch ? 'Edit Batch' : 'Add Batch'}
      >
        <BatchForm
          farmId={farmId}
          defaultValues={editingBatch}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={addBatch.isPending || updateBatch.isPending}
        />
      </Modal>
    </div>
  );
}
