import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeliveryType } from "../backend.d";
import BrickSelector, {
  initBrickState,
  getTotalBricks,
  type BrickStateMap,
} from "../components/BrickSelector";
import PageHeader from "../components/PageHeader";
import { useCreatePendingDelivery } from "../hooks/useQueries";
import { getTodayString } from "../types";

interface AddPendingDeliveryProps {
  onBack: () => void;
  onSuccess: () => void;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
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

  const createMutation = useCreatePendingDelivery();
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

    // Build brick selections for non-Bats types
    const brickSelections = Object.entries(brickState)
      .filter(([bt, s]) => s.selected && bt !== "Bats")
      .map(([bt, s]) => ({
        brickType: bt,
        quantity: BigInt(s.quantity || 0),
      }));

    // Handle Bats notes separately
    const batsState = brickState.Bats;
    const batsNotes = batsState?.selected ? batsState.batsNotes || null : null;

    // Include Bats in selections with quantity 0 so it shows in list page
    if (batsState?.selected) {
      brickSelections.push({
        brickType: "Bats",
        quantity: BigInt(0),
      });
    }

    try {
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
      toast.success("Pending delivery saved successfully!");
      onSuccess();
    } catch (err) {
      console.error("Save error:", err);
      const message = extractErrorMessage(err);
      toast.error(`Save failed: ${message}`, { duration: 8000 });
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
            disabled={createMutation.isPending}
            data-ocid="pending_form.submit_button"
          >
            {createMutation.isPending ? (
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
