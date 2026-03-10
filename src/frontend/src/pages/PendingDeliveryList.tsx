import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PendingDelivery } from "../backend.d";
import PageHeader from "../components/PageHeader";
import {
  saveCompleteDeliveryStatic,
  useLaborNames,
  useRates,
  useVehicles,
} from "../hooks/useLocalStorage";
import {
  useDeletePendingDelivery,
  useGetPendingDeliveries,
} from "../hooks/useQueries";
import { calculateDeliveryAmount, formatCurrency, formatDate } from "../types";

interface MarkCompleteDialogProps {
  delivery: PendingDelivery;
  onClose: () => void;
  onDone: () => void;
}

function MarkCompleteDialog({
  delivery,
  onClose,
  onDone,
}: MarkCompleteDialogProps) {
  const { vehicles } = useVehicles();
  const { laborNames } = useLaborNames();
  const { rates } = useRates();
  const deleteMutation = useDeletePendingDelivery();

  const [vehicleType, setVehicleType] = useState<"tractor" | "twelveWheel">(
    "tractor",
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loadingLabor, setLoadingLabor] = useState<string[]>([]);
  const [unloadingLabor, setUnloadingLabor] = useState<string[]>([]);

  const filteredVehicles = vehicles.filter((v) => v.type === vehicleType);
  const totalBricks = delivery.brickSelections.reduce(
    (sum, b) => (b.brickType !== "Bats" ? sum + Number(b.quantity) : sum),
    0,
  );
  const hasBats = delivery.brickSelections.some((b) => b.brickType === "Bats");
  const calculatedAmount = calculateDeliveryAmount(
    vehicleType,
    delivery.deliveryType,
    totalBricks,
    hasBats,
    rates,
  );

  const toggleLabor = (
    name: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(name) ? list.filter((n) => n !== name) : [...list, name],
    );
  };

  const handleConfirm = async () => {
    if (!vehicleNumber) {
      toast.error("Please select a vehicle number");
      return;
    }
    try {
      saveCompleteDeliveryStatic({
        id: Date.now(),
        customerName: delivery.customerName,
        vehicleType,
        date: delivery.date,
        vehicleNumber,
        calculatedAmount,
        unloadingLabor,
        brickSelections: delivery.brickSelections.map((b) => ({
          brickType: b.brickType,
          quantity: Number(b.quantity),
        })),
        loadingLabor,
        deliveryType: delivery.deliveryType,
        distance: delivery.distance,
        batsNotes: delivery.batsNotes,
        address: delivery.address,
        dueAmount: delivery.dueAmount,
      });
      await deleteMutation.mutateAsync(delivery.id);
      toast.success("Delivery marked as complete!");
      onDone();
    } catch {
      toast.error("Failed to mark complete");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl"
        data-ocid="pending_list.dialog"
      >
        <DialogHeader>
          <DialogTitle>Mark as Complete</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {delivery.customerName} · {totalBricks.toLocaleString("en-IN")}{" "}
              bricks
            </p>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <div className="flex gap-2">
              {(["tractor", "twelveWheel"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setVehicleType(t);
                    setVehicleNumber("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    vehicleType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  {t === "tractor" ? "Tractor" : "12 Wheel"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Number</Label>
            {filteredVehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No vehicles added in Settings
              </p>
            ) : (
              <select
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Select vehicle</option>
                {filteredVehicles.map((v) => (
                  <option key={v.number} value={v.number}>
                    {v.number}
                  </option>
                ))}
              </select>
            )}
          </div>
          {laborNames.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">Loading Labor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {laborNames.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <Checkbox
                        id={`cload-${name}`}
                        checked={loadingLabor.includes(name)}
                        onCheckedChange={() =>
                          toggleLabor(name, loadingLabor, setLoadingLabor)
                        }
                      />
                      <Label htmlFor={`cload-${name}`}>{name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Unloading Labor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {laborNames.map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <Checkbox
                        id={`cunload-${name}`}
                        checked={unloadingLabor.includes(name)}
                        onCheckedChange={() =>
                          toggleLabor(name, unloadingLabor, setUnloadingLabor)
                        }
                      />
                      <Label htmlFor={`cunload-${name}`}>{name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="bg-accent rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-semibold">Calculated Amount</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(calculatedAmount)}
            </span>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="pending_list.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-primary text-primary-foreground"
            data-ocid="pending_list.confirm_button"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm Complete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PendingDeliveryListProps {
  onBack: () => void;
}

export default function PendingDeliveryList({
  onBack,
}: PendingDeliveryListProps) {
  const { data: deliveries = [], isLoading } = useGetPendingDeliveries();
  const deleteMutation = useDeletePendingDelivery();
  const [markingComplete, setMarkingComplete] =
    useState<PendingDelivery | null>(null);

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete this pending delivery?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted successfully");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Pending Deliveries" onBack={onBack} />

      <div className="p-4 space-y-3 pb-8">
        {isLoading && (
          <div
            className="flex justify-center py-12"
            data-ocid="pending_list.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && deliveries.length === 0 && (
          <div
            className="text-center py-16 space-y-3"
            data-ocid="pending_list.empty_state"
          >
            <Package className="w-14 h-14 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">
              No pending deliveries
            </p>
            <p className="text-sm text-muted-foreground/60">
              Add a pending delivery to get started
            </p>
          </div>
        )}

        {deliveries.map((delivery, idx) => {
          const totalBricks = delivery.brickSelections.reduce(
            (sum, b) =>
              b.brickType !== "Bats" ? sum + Number(b.quantity) : sum,
            0,
          );
          return (
            <Card
              key={delivery.id.toString()}
              data-ocid={`pending_list.item.${idx + 1}`}
              className="overflow-hidden"
            >
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {delivery.customerName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {delivery.address}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/30 bg-primary/5 shrink-0"
                  >
                    {delivery.deliveryType === "local" ? "Local" : "Outside"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {formatDate(delivery.date)}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Bricks</div>
                    <div className="text-sm font-bold text-primary mt-0.5">
                      {totalBricks.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Due</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {formatCurrency(delivery.dueAmount)}
                    </div>
                  </div>
                </div>

                {delivery.brickSelections.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {delivery.brickSelections.map((b) => (
                      <Badge
                        key={b.brickType}
                        variant="secondary"
                        className="text-xs"
                      >
                        {b.brickType}:
                        {b.brickType === "Bats"
                          ? " Safety"
                          : ` ${Number(b.quantity).toLocaleString("en-IN")}`}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(delivery.id)}
                    disabled={deleteMutation.isPending}
                    data-ocid={`pending_list.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setMarkingComplete(delivery)}
                    data-ocid={`pending_list.edit_button.${idx + 1}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {markingComplete && (
        <MarkCompleteDialog
          delivery={markingComplete}
          onClose={() => setMarkingComplete(null)}
          onDone={() => setMarkingComplete(null)}
        />
      )}
    </div>
  );
}
