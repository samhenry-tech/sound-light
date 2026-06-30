/**
 * React Query hooks over the data layer. Mutations use optimistic cache updates
 * so pin / banish / add / remove feel instant (matching the prototype), then
 * reconcile with the backend.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuthSession } from '~auth/useAuthSession';
import type { CreateMixInput, Mix, UpdateMixInput, UpdateUserPrefsInput } from '~shared/contract';

import type { DataContext } from './adapters/types';
import { dataAdapter } from './dataAdapter';
import { dataKeys } from './queryKeys';

function useDataContext(): DataContext & { ready: boolean } {
  const { user, accessToken, isAuthenticated } = useAuthSession();
  return useMemo(
    () => ({
      token: accessToken,
      owner: user?.sub ?? '',
      ready: isAuthenticated && Boolean(user),
    }),
    [accessToken, user, isAuthenticated],
  );
}

export function useMixes() {
  const ctx = useDataContext();
  return useQuery({
    queryKey: dataKeys.mixes(ctx.owner),
    queryFn: () => dataAdapter.listMixes(ctx),
    enabled: ctx.ready,
    staleTime: 60_000,
  });
}

export function usePrefs() {
  const ctx = useDataContext();
  return useQuery({
    queryKey: dataKeys.prefs(ctx.owner),
    queryFn: () => dataAdapter.getPrefs(ctx),
    enabled: ctx.ready,
    staleTime: 5 * 60_000,
  });
}

export function useCreateMix() {
  const ctx = useDataContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMixInput) => dataAdapter.createMix(ctx, input),
    onSuccess: (mix) => {
      qc.setQueryData<Mix[]>(dataKeys.mixes(ctx.owner), (prev) => [...(prev ?? []), mix]);
    },
  });
}

export function useUpdateMix() {
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
}

export function useDeleteMix() {
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
}

export function useUpdatePrefs() {
  const ctx = useDataContext();
  const qc = useQueryClient();
  const key = dataKeys.prefs(ctx.owner);

  return useMutation({
    mutationFn: (input: UpdateUserPrefsInput) => dataAdapter.updatePrefs(ctx, input),
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
}
