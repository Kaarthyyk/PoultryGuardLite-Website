'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SaleRepository } from '@/repositories/sale.repository';
import type { Sale, SaleInput } from '@/types/models';

export const salesKey = (farmId: string) => ['sales', farmId] as const;

export function useSales(farmId: string) {
  return useQuery({
    queryKey: salesKey(farmId),
    queryFn: () => SaleRepository.getSales(farmId),
    enabled: !!farmId,
    staleTime: 30_000,
  });
}

export function useAddSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaleInput) => SaleRepository.addSale(input),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: salesKey(vars.farmId) }),
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sale: Sale) => SaleRepository.updateSale(sale),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: salesKey(vars.farmId) }),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ farmId, saleId }: { farmId: string; saleId: string }) =>
      SaleRepository.deleteSale(saleId),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: salesKey(vars.farmId) }),
  });
}
