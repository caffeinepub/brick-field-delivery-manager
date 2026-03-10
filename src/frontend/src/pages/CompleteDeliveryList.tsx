import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Pencil, Trash2 } from "lucide-react";
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
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-ocid="edit_complete.date.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-ocid="edit_complete.customer.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-ocid="edit_complete.address.input"
            />
          </div>
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

      <div className="p-3 space-y-2.5 pb-8">
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
            <div
              key={delivery.id}
              data-ocid={`complete_list.item.${idx + 1}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              {/* Green top accent line */}
              <div className="h-[3px] bg-green-500" />

              <div className="px-3 py-2.5 space-y-1.5">
                {/* Row 1: Customer Name — Amount */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-sm text-gray-900 truncate flex-1">
                    {delivery.customerName}
                  </span>
                  <span className="font-bold text-sm text-orange-500 shrink-0">
                    {formatCurrency(delivery.calculatedAmount)}
                  </span>
                </div>

                {/* Row 2: Vehicle Number • Date */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">
                    {delivery.vehicleNumber}
                  </span>
                  <span>•</span>
                  <span>{formatDate(delivery.date)}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Row 3: Bricks | Type */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">
                    Bricks:{" "}
                    <span className="font-semibold text-gray-800">
                      {totalBricks.toLocaleString("en-IN")}
                    </span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">
                    Type:{" "}
                    <span className="font-semibold text-gray-800 capitalize">
                      {delivery.deliveryType === "local" ? "Local" : "Outside"}
                    </span>
                  </span>
                </div>

                {/* Row 4: Labor names */}
                {uniqueLabor.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Labor:{" "}
                    <span className="font-bold text-gray-800 text-sm">
                      {uniqueLabor.join(", ")}
                    </span>
                  </div>
                )}

                {/* Row 5: Brick type breakdown */}
                {delivery.brickSelections.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {delivery.brickSelections.map((b) => (
                      <span key={b.brickType} className="text-xs text-gray-500">
                        {b.brickType}:{" "}
                        <span className="font-semibold text-gray-700">
                          {b.brickType === "Bats"
                            ? "Safety"
                            : b.quantity.toLocaleString("en-IN")}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    onClick={() => handleDelete(delivery.id)}
                    data-ocid={`complete_list.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg"
                    onClick={() => setEditing(delivery)}
                    data-ocid={`complete_list.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
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
