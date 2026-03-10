import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import BrickSelector, {
  getTotalBricks,
  initBrickState,
  type BrickStateMap,
} from "../components/BrickSelector";
import PageHeader from "../components/PageHeader";
import { usePendingDeliveries } from "../hooks/useLocalStorage";
import { getTodayString } from "../types";

interface AddPendingDeliveryProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddPendingDelivery({
  onBack,
  onSuccess,
}: AddPendingDeliveryProps) {
  const [date, setDate] = useState(getTodayString());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [deliveryType, setDeliveryType] = useState<"local" | "outside">(
    "local",
  );
  const [brickState, setBrickState] = useState<BrickStateMap>(initBrickState());
  const [isSaving, setIsSaving] = useState(false);

  const { addPendingDelivery } = usePendingDeliveries();
  const totalBricks = getTotalBricks(brickState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const hasAnySelected = Object.values(brickState).some((s) => s.selected);
    if (!hasAnySelected) {
      toast.error("Please select at least one brick type");
      return;
    }

    setIsSaving(true);
    try {
      const brickSelections = Object.entries(brickState)
        .filter(([bt, s]) => s.selected && bt !== "Bats")
        .map(([bt, s]) => ({
          brickType: bt,
          quantity: s.quantity || 0,
        }));

      const batsState = brickState.Bats;
      const batsNotes = batsState?.selected
        ? (batsState.batsNotes ?? undefined)
        : undefined;

      if (batsState?.selected) {
        brickSelections.push({ brickType: "Bats", quantity: 0 });
      }

      addPendingDelivery({
        id: Date.now(),
        date,
        customerName: customerName.trim(),
        address: address.trim(),
        dueAmount: Number.parseFloat(dueAmount) || 0,
        deliveryType,
        brickSelections,
        batsNotes,
      });

      toast.success("Pending Delivery Saved");
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Add Pending Delivery" onBack={onBack} />

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-ocid="pending_form.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer Name *</Label>
              <Input
                id="customer"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                data-ocid="pending_form.customer.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-ocid="pending_form.address.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due Amount (₹)</Label>
              <Input
                id="due"
                type="number"
                min={0}
                placeholder="0"
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value)}
                data-ocid="pending_form.due.input"
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
                    data-ocid={`pending_form.delivery_type.${type}.toggle`}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      deliveryType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white border-border text-foreground"
                    }`}
                  >
                    {type === "local" ? "Local" : "Outside"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <BrickSelector brickState={brickState} onChange={setBrickState} />
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-white border-t shadow-lg">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSaving}
            data-ocid="pending_form.submit_button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : totalBricks > 0 ? (
              `Save Pending Delivery (${totalBricks.toLocaleString("en-IN")} bricks)`
            ) : (
              "Save Pending Delivery"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
