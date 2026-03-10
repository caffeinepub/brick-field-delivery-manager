import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeliveryType } from "../backend.d";
import type { BrickSelection, PendingDelivery } from "../backend.d";
import { useActor } from "./useActor";

export function useGetPendingDeliveries() {
  const { actor, isFetching } = useActor();
  return useQuery<PendingDelivery[]>({
    queryKey: ["pendingDeliveries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPendingDeliveries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePendingDelivery() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      customerName: string;
      address: string;
      dueAmount: number;
      distance: number;
      deliveryType: DeliveryType;
      brickSelections: BrickSelection[];
      batsNotes: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.createPendingDelivery(
        params.date,
        params.customerName,
        params.address,
        params.dueAmount,
        params.distance,
        params.deliveryType,
        params.brickSelections,
        params.batsNotes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDeliveries"] });
    },
  });
}

export function useDeletePendingDelivery() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deletePendingDelivery(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDeliveries"] });
    },
  });
}
