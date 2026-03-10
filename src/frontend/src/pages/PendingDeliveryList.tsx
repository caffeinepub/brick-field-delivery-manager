import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeliveryType, type PendingDelivery } from "../backend.d";
import BrickSelector, {
  initBrickState,
  getTotalBricks,
  type BrickStateMap,
} from "../components/BrickSelector";
import PageHeader from "../components/PageHeader";
import {
  saveCompleteDeliveryStatic,
  useLaborNames,
  useRates,
  useVehicles,
} from "../hooks/useLocalStorage";
import {
  useCreatePendingDelivery,
  useDeletePendingDelivery,
  useGetPendingDeliveries,
} from "../hooks/useQueries";
import { calculateDeliveryAmount, formatCurrency, formatDate } from "../types";

// ─── Mark Complete Dialog ───────────────────────────────────────────────────
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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    vehicleType === t
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-orange-500 border-orange-400"
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
              <div className="flex flex-wrap gap-2">
                {filteredVehicles.map((v) => (
                  <button
                    key={v.number}
                    type="button"
                    onClick={() => setVehicleNumber(v.number)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      vehicleNumber === v.number
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-orange-500 border-orange-400"
                    }`}
                  >
                    {v.number}
                  </button>
                ))}
              </div>
            )}
          </div>

          {laborNames.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">Loading Labor</Label>
                <div className="flex flex-wrap gap-2">
                  {laborNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        toggleLabor(name, loadingLabor, setLoadingLabor)
                      }
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        loadingLabor.includes(name)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-orange-500 border-orange-400"
                      }`}
                      data-ocid="pending_list.toggle"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Unloading Labor</Label>
                <div className="flex flex-wrap gap-2">
                  {laborNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        toggleLabor(name, unloadingLabor, setUnloadingLabor)
                      }
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        unloadingLabor.includes(name)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-orange-500 border-orange-400"
                      }`}
                      data-ocid="pending_list.toggle"
                    >
                      {name}
                    </button>
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

// ─── Edit Pending Delivery Dialog ───────────────────────────────────────────
interface EditPendingDialogProps {
  delivery: PendingDelivery;
  onClose: () => void;
  onDone: () => void;
}

function brickSelectionsToState(delivery: PendingDelivery): BrickStateMap {
  const state = initBrickState();
  for (const sel of delivery.brickSelections) {
    if (state[sel.brickType] !== undefined) {
      state[sel.brickType] = {
        selected: true,
        quantity: Number(sel.quantity),
        batsNotes: sel.brickType === "Bats" ? (delivery.batsNotes ?? "") : "",
      };
    }
  }
  return state;
}

function EditPendingDialog({
  delivery,
  onClose,
  onDone,
}: EditPendingDialogProps) {
  const [date, setDate] = useState(delivery.date);
  const [customerName, setCustomerName] = useState(delivery.customerName);
  const [address, setAddress] = useState(delivery.address);
  const [dueAmount, setDueAmount] = useState(String(delivery.dueAmount || ""));
  const [deliveryType, setDeliveryType] = useState<"local" | "outside">(
    delivery.deliveryType === "local" ? "local" : "outside",
  );
  const [brickState, setBrickState] = useState<BrickStateMap>(() =>
    brickSelectionsToState(delivery),
  );

  const deleteMutation = useDeletePendingDelivery();
  const createMutation = useCreatePendingDelivery();
  const isSaving = deleteMutation.isPending || createMutation.isPending;
  const totalBricks = getTotalBricks(brickState);

  const handleSave = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const hasAnySelected = Object.values(brickState).some((s) => s.selected);
    if (!hasAnySelected) {
      toast.error("Please select at least one brick type");
      return;
    }

    const brickSelections = Object.entries(brickState)
      .filter(([bt, s]) => s.selected && bt !== "Bats")
      .map(([bt, s]) => ({ brickType: bt, quantity: BigInt(s.quantity || 0) }));

    const batsState = brickState.Bats;
    const batsNotes = batsState?.selected ? batsState.batsNotes || null : null;
    if (batsState?.selected) {
      brickSelections.push({ brickType: "Bats", quantity: BigInt(0) });
    }

    try {
      await deleteMutation.mutateAsync(delivery.id);
      await createMutation.mutateAsync({
        date,
        customerName: customerName.trim(),
        address: address.trim(),
        dueAmount: Number.parseFloat(dueAmount) || 0,
        distance: 0,
        deliveryType:
          deliveryType === "local" ? DeliveryType.local : DeliveryType.outside,
        brickSelections,
        batsNotes,
      });
      toast.success("Delivery updated successfully!");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Update failed: ${msg}`, { duration: 8000 });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl"
        data-ocid="edit_pending.dialog"
      >
        <DialogHeader>
          <DialogTitle>Edit Pending Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="edit_pending.date.input"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-ocid="edit_pending.customer.input"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-ocid="edit_pending.address.input"
            />
          </div>

          {/* Due Amount */}
          <div className="space-y-1.5">
            <Label>Due Amount (₹)</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              data-ocid="edit_pending.due.input"
            />
          </div>

          {/* Delivery Type */}
          <div className="space-y-1.5">
            <Label>Delivery Type</Label>
            <div className="flex gap-2">
              {(["local", "outside"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDeliveryType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    deliveryType === type
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-orange-500 border-orange-400"
                  }`}
                >
                  {type === "local" ? "Local" : "Outside"}
                </button>
              ))}
            </div>
          </div>

          {/* Brick Selector */}
          <BrickSelector brickState={brickState} onChange={setBrickState} />
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="edit_pending.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground flex-1"
            data-ocid="edit_pending.save_button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : totalBricks > 0 ? (
              `Save Update (${totalBricks.toLocaleString("en-IN")} bricks)`
            ) : (
              "Save Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
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
  const [editing, setEditing] = useState<PendingDelivery | null>(null);

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
              className="overflow-hidden rounded-2xl shadow-sm"
            >
              <CardContent className="pt-4 space-y-3">
                {/* Header */}
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

                {/* Stats */}
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

                {/* Brick badges */}
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

                {/* Action buttons: Delete | Edit | Mark Complete */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(delivery.id)}
                    disabled={deleteMutation.isPending}
                    data-ocid={`pending_list.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={() => setEditing(delivery)}
                    data-ocid={`pending_list.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setMarkingComplete(delivery)}
                    data-ocid={`pending_list.confirm_button.${idx + 1}`}
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

      {editing && (
        <EditPendingDialog
          delivery={editing}
          onClose={() => setEditing(null)}
          onDone={() => setEditing(null)}
        />
      )}
    </div>
  );
}
