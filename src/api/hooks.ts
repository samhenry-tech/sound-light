/**
 * React Query hooks over the data layer. Mutations use optimistic cache updates
 * so pin / banish / add / remove feel instant (matching the prototype), then
 * reconcile with the backend.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuthSession } from '~auth/useAuthSession';
import type { CreateMixInput, Mix, UpdateMixInput, UpdateUserSettingsInput } from '~shared/contract';

import type { DataContext } from './adapters/types';
import { dataAdapter } from './dataAdapter';
import { dataKeys } from './queryKeys';

const useDataContext = (): DataContext & { ready: boolean } => {
  const { owner, googleIdToken, isAuthenticated } = useAuthSession();
  return useMemo(
    () => ({
      owner,
      googleIdToken: googleIdToken ?? '',
      ready: isAuthenticated && Boolean(owner) && Boolean(googleIdToken),
    }),
    [owner, googleIdToken, isAuthenticated],
  );
};

export const useMixes = () => {
  const ctx = useDataContext();
  return useQuery({
    queryKey: dataKeys.mixes(ctx.owner),
    queryFn: () => dataAdapter.listMixes(ctx),
    enabled: ctx.ready,
    staleTime: 60_000,
  });
};

export const useUserSettings = () => {
  const ctx = useDataContext();
  return useQuery({
    queryKey: dataKeys.settings(ctx.owner),
    queryFn: () => dataAdapter.getSettings(ctx),
    enabled: ctx.ready,
    staleTime: 5 * 60_000,
  });
};

export const useCreateMix = () => {
  const ctx = useDataContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMixInput) => dataAdapter.createMix(ctx, input),
    onSuccess: (mix) => {
      qc.setQueryData<Mix[]>(dataKeys.mixes(ctx.owner), (prev) => [...(prev ?? []), mix]);
    },
  });
};

export const useUpdateMix = () => {
  const ctx = useDataContext();
  const qc = useQueryClient();
  const key = dataKeys.mixes(ctx.owner);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMixInput }) =>
      dataAdapter.updateMix(ctx, id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Mix[]>(key);
      qc.setQueryData<Mix[]>(key, (prev) =>
        prev?.map((m) => (m.id === id ? { ...m, ...input } : m)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
};

export const useDeleteMix = () => {
  const ctx = useDataContext();
  const qc = useQueryClient();
  const key = dataKeys.mixes(ctx.owner);

  return useMutation({
    mutationFn: (id: string) => dataAdapter.deleteMix(ctx, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Mix[]>(key);
      qc.setQueryData<Mix[]>(key, (prev) => prev?.filter((m) => m.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
};

export const useUpdateUserSettings = () => {
  const ctx = useDataContext();
  const qc = useQueryClient();
  const key = dataKeys.settings(ctx.owner);

  return useMutation({
    mutationFn: (input: UpdateUserSettingsInput) => dataAdapter.updateSettings(ctx, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (prev) => (prev ? { ...prev, ...input } : prev));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  });
};
