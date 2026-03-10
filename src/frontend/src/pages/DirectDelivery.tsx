import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
  useRates,
  useVehicles,
} from "../hooks/useLocalStorage";
import {
  calculateDeliveryAmount,
  formatCurrency,
  getTodayString,
} from "../types";

interface DirectDeliveryProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function DirectDelivery({
  onBack,
  onSuccess,
}: DirectDeliveryProps) {
  const [date, setDate] = useState(getTodayString());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [deliveryType, setDeliveryType] = useState<"local" | "outside">(
    "local",
  );
  const [brickState, setBrickState] = useState<BrickStateMap>(initBrickState());
  const [vehicleType, setVehicleType] = useState<"tractor" | "twelveWheel">(
    "tractor",
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loadingLabor, setLoadingLabor] = useState<string[]>([]);
  const [unloadingLabor, setUnloadingLabor] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { vehicles } = useVehicles();
  const { laborNames } = useLaborNames();
  const { rates } = useRates();
  const { addDelivery } = useCompleteDeliveries();

  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => v.type === vehicleType),
    [vehicles, vehicleType],
  );

  const totalBricks = getTotalBricks(brickState);
  const hasBats = brickState.Bats?.selected ?? false;

  const calculatedAmount = useMemo(
    () =>
      calculateDeliveryAmount(
        vehicleType,
        deliveryType,
        totalBricks,
        hasBats,
        rates,
      ),
    [vehicleType, deliveryType, totalBricks, hasBats, rates],
  );

  const toggleLabor = (
    name: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    if (list.includes(name)) {
      setter(list.filter((n) => n !== name));
    } else {
      setter([...list, name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!vehicleNumber) {
      toast.error("Please select a vehicle number");
      return;
    }
    const anyBrickSelected = Object.values(brickState).some((s) => s.selected);
    if (!anyBrickSelected) {
      toast.error("Please select at least one brick type");
      return;
    }

    setIsSaving(true);
    try {
      const batsState = brickState.Bats;
      const brickSelections = Object.entries(brickState)
        .filter(([, s]) => s.selected)
        .map(([brickType, s]) => ({
          brickType,
          quantity: brickType === "Bats" ? 0 : s.quantity,
        }));

      addDelivery({
        id: Date.now(),
        customerName: customerName.trim(),
        vehicleType,
        date,
        vehicleNumber,
        calculatedAmount,
        unloadingLabor,
        brickSelections,
        loadingLabor,
        deliveryType,
        distance: 0,
        batsNotes: batsState?.selected ? batsState.batsNotes : undefined,
        address: address.trim(),
        dueAmount: Number.parseFloat(dueAmount) || 0,
      });
      toast.success("Delivery Completed Successfully");
      onSuccess();
    } catch {
      toast.error("Failed to save delivery");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Direct Delivery" onBack={onBack} />

      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-32">
        {/* Basic Info */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                    data-ocid={`direct_form.delivery_type.${type}.toggle`}
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

        {/* Brick Types */}
        <Card>
          <CardContent className="pt-4">
            <BrickSelector brickState={brickState} onChange={setBrickState} />
          </CardContent>
        </Card>

        {/* Vehicle Section */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Vehicle
            </h3>
            <div className="space-y-1.5">
              <Label>Vehicle Type</Label>
              <div className="flex gap-2">
                {(["tractor", "twelveWheel"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setVehicleType(type);
                      setVehicleNumber("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      vehicleType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white border-border text-foreground"
                    }`}
                  >
                    {type === "tractor" ? "Tractor" : "12 Wheel"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              {filteredVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No vehicles added. Go to Settings to add vehicles.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredVehicles.map((v) => (
                    <button
                      key={v.number}
                      type="button"
                      onClick={() => setVehicleNumber(v.number)}
                      data-ocid="direct_form.vehicle_number.toggle"
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        vehicleNumber === v.number
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white text-primary border-primary/60 hover:border-primary"
                      }`}
                    >
                      {v.number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Labor Section */}
        <Card>
          <CardContent className="pt-4 space-y-5">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Labor
            </h3>
            {laborNames.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No labor added. Go to Settings to add labor names.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">
                    Loading Labor
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {laborNames.map((name) => (
                      <button
                        key={`load-${name}`}
                        type="button"
                        onClick={() =>
                          toggleLabor(name, loadingLabor, setLoadingLabor)
                        }
                        data-ocid="direct_form.loading_labor.toggle"
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          loadingLabor.includes(name)
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-white text-primary border-primary/60 hover:border-primary"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">
                    Unloading Labor
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {laborNames.map((name) => (
                      <button
                        key={`unload-${name}`}
                        type="button"
                        onClick={() =>
                          toggleLabor(name, unloadingLabor, setUnloadingLabor)
                        }
                        data-ocid="direct_form.unloading_labor.toggle"
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          unloadingLabor.includes(name)
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-white text-primary border-primary/60 hover:border-primary"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Calculated Amount */}
        <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              Calculated Amount
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(calculatedAmount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {totalBricks.toLocaleString("en-IN")} bricks ·{" "}
            {vehicleType === "tractor" ? "Tractor" : "12 Wheel"} ·{" "}
            {deliveryType === "local" ? "Local" : "Outside"}
          </p>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-white border-t shadow-lg">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSaving}
            data-ocid="direct_form.submit_button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              `Save Delivery · ${formatCurrency(calculatedAmount)}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
