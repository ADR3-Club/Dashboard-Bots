import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { processesAPI } from '../services/api';

export function useProcesses() {
  return useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const response = await processesAPI.getAll();
      return response.data.processes;
    },
    refetchInterval: 1000, // Refresh every 1 second
  });
}

export function useProcess(id) {
  return useQuery({
    queryKey: ['process', id],
    queryFn: async () => {
      const response = await processesAPI.getOne(id);
      return response.data.process;
    },
    enabled: !!id,
  });
}

export function useRestartProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => processesAPI.restart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}

export function useStopProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => processesAPI.stop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}

export function useStartProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => processesAPI.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}

export function useDeleteProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => processesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });
}
