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
import { Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import BrickSelector, {
  initBrickState,
  getTotalBricks,
  type BrickStateMap,
} from "../components/BrickSelector";
import PageHeader from "../components/PageHeader";
import {
  useCompleteDeliveries,
  useLaborNames,
  useVehicles,
} from "../hooks/useLocalStorage";
import {
  type LocalCompleteDelivery,
  formatCurrency,
  formatDate,
} from "../types";

// ─── Edit Complete Delivery Dialog ───────────────────────────────────────────
interface EditCompleteDialogProps {
  delivery: LocalCompleteDelivery;
  onClose: () => void;
  onSave: (updated: LocalCompleteDelivery) => void;
}

function brickSelectionsToState(
  brickSelections: { brickType: string; quantity: number }[],
  batsNotes?: string,
): BrickStateMap {
  const state = initBrickState();
  for (const sel of brickSelections) {
    if (state[sel.brickType] !== undefined) {
      state[sel.brickType] = {
        selected: true,
        quantity: sel.quantity,
        batsNotes: sel.brickType === "Bats" ? (batsNotes ?? "") : "",
      };
    }
  }
  return state;
}

function EditCompleteDialog({
  delivery,
  onClose,
  onSave,
}: EditCompleteDialogProps) {
  const { vehicles } = useVehicles();
  const { laborNames } = useLaborNames();

  const [date, setDate] = useState(delivery.date);
  const [customerName, setCustomerName] = useState(delivery.customerName);
  const [address, setAddress] = useState(delivery.address);
  const [dueAmount, setDueAmount] = useState(String(delivery.dueAmount || ""));
  const [deliveryType, setDeliveryType] = useState<"local" | "outside">(
    delivery.deliveryType === "local" ? "local" : "outside",
  );
  const [vehicleType, setVehicleType] = useState<"tractor" | "twelveWheel">(
    delivery.vehicleType === "tractor" ? "tractor" : "twelveWheel",
  );
  const [vehicleNumber, setVehicleNumber] = useState(delivery.vehicleNumber);
  const [loadingLabor, setLoadingLabor] = useState<string[]>(
    delivery.loadingLabor,
  );
  const [unloadingLabor, setUnloadingLabor] = useState<string[]>(
    delivery.unloadingLabor,
  );
  const [brickState, setBrickState] = useState<BrickStateMap>(() =>
    brickSelectionsToState(delivery.brickSelections, delivery.batsNotes),
  );

  const filteredVehicles = vehicles.filter((v) => v.type === vehicleType);
  const totalBricks = getTotalBricks(brickState);

  const toggleLabor = (
    name: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(name) ? list.filter((n) => n !== name) : [...list, name],
    );
  };

  const handleSave = () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    const hasAny = Object.values(brickState).some((s) => s.selected);
    if (!hasAny) {
      toast.error("Please select at least one brick type");
      return;
    }

    const brickSelections = Object.entries(brickState)
      .filter(([, s]) => s.selected)
      .map(([bt, s]) => ({
        brickType: bt,
        quantity: bt === "Bats" ? 0 : s.quantity,
      }));

    const batsState = brickState.Bats;
    const batsNotes = batsState?.selected ? batsState.batsNotes : undefined;

    onSave({
      ...delivery,
      date,
      customerName: customerName.trim(),
      address: address.trim(),
      dueAmount: Number.parseFloat(dueAmount) || 0,
      deliveryType,
      vehicleType,
      vehicleNumber,
      loadingLabor,
      unloadingLabor,
      brickSelections,
      batsNotes,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl"
        data-ocid="edit_complete.dialog"
      >
        <DialogHeader>
          <DialogTitle>Edit Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="edit_complete.date.input"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-ocid="edit_complete.customer.input"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-ocid="edit_complete.address.input"
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
              data-ocid="edit_complete.due.input"
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

          {/* Vehicle Type */}
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

          {/* Vehicle Number */}
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

          {/* Labor */}
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
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Brick Selector */}
          <BrickSelector brickState={brickState} onChange={setBrickState} />
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="edit_complete.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground flex-1"
            data-ocid="edit_complete.save_button"
          >
            {totalBricks > 0
              ? `Save Update (${totalBricks.toLocaleString("en-IN")} bricks)`
              : "Save Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
interface CompleteDeliveryListProps {
  onBack: () => void;
}

export default function CompleteDeliveryList({
  onBack,
}: CompleteDeliveryListProps) {
  const { deliveries, removeDelivery, updateDelivery } =
    useCompleteDeliveries();
  const [editing, setEditing] = useState<LocalCompleteDelivery | null>(null);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this delivery record?")) return;
    removeDelivery(id);
    toast.success("Delivery deleted");
  };

  const handleSaveEdit = (updated: LocalCompleteDelivery) => {
    updateDelivery(updated.id, updated);
    toast.success("Delivery updated successfully!");
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Complete Deliveries" onBack={onBack} />

      <div className="p-4 space-y-3 pb-8">
        {deliveries.length === 0 && (
          <div
            className="text-center py-16 space-y-3"
            data-ocid="complete_list.empty_state"
          >
            <Package className="w-14 h-14 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground font-medium">
              No complete deliveries
            </p>
            <p className="text-sm text-muted-foreground/60">
              Complete deliveries will appear here
            </p>
          </div>
        )}

        {deliveries.map((delivery, idx) => {
          const totalBricks = delivery.brickSelections.reduce(
            (sum, b) => (b.brickType !== "Bats" ? sum + b.quantity : sum),
            0,
          );
          const allLabor = [
            ...delivery.loadingLabor,
            ...delivery.unloadingLabor,
          ].filter(Boolean);
          const uniqueLabor = [...new Set(allLabor)];

          return (
            <Card
              key={delivery.id}
              data-ocid={`complete_list.item.${idx + 1}`}
              className="overflow-hidden rounded-2xl shadow-sm"
            >
              <div className="h-1 bg-green-500" />
              <CardContent className="pt-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {delivery.customerName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {delivery.vehicleNumber} ·{" "}
                      {delivery.vehicleType === "tractor"
                        ? "Tractor"
                        : "12 Wheel"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(delivery.calculatedAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(delivery.date)}
                    </div>
                  </div>
                </div>

                {/* Stats: Bricks + Type only (no Dist/KM) */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Bricks</div>
                    <div className="text-sm font-bold text-primary mt-0.5">
                      {totalBricks.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-xs font-semibold mt-0.5 capitalize">
                      {delivery.deliveryType === "local" ? "Local" : "Outside"}
                    </div>
                  </div>
                </div>

                {/* Labor names */}
                {uniqueLabor.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Labor:{" "}
                    <span className="text-foreground font-medium">
                      {uniqueLabor.join(", ")}
                    </span>
                  </div>
                )}

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
                          : ` ${b.quantity.toLocaleString("en-IN")}`}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action buttons: Delete | Edit */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(delivery.id)}
                    data-ocid={`complete_list.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                    onClick={() => setEditing(delivery)}
                    data-ocid={`complete_list.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing && (
        <EditCompleteDialog
          delivery={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
