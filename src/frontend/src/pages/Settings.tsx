import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import { useLaborNames, useRates, useVehicles } from "../hooks/useLocalStorage";
import type { RateSettings } from "../types";

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const { vehicles, addVehicle, removeVehicle } = useVehicles();
  const { laborNames, addLabor, removeLabor } = useLaborNames();
  const { rates, saveRates } = useRates();

  const [vehicleType, setVehicleType] = useState<"tractor" | "twelveWheel">(
    "tractor",
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [laborName, setLaborName] = useState("");
  const [rateForm, setRateForm] = useState<RateSettings>({ ...rates });

  const handleAddVehicle = () => {
    const num = vehicleNumber.trim().toUpperCase();
    if (!num) {
      toast.error("Enter a vehicle number");
      return;
    }
    if (vehicles.some((v) => v.number === num)) {
      toast.error("Vehicle already exists");
      return;
    }
    addVehicle({ type: vehicleType, number: num });
    setVehicleNumber("");
    toast.success(`Vehicle ${num} added`);
  };

  const handleAddLabor = () => {
    const name = laborName.trim();
    if (!name) {
      toast.error("Enter a labor name");
      return;
    }
    if (laborNames.includes(name)) {
      toast.error("Labor already exists");
      return;
    }
    addLabor(name);
    setLaborName("");
    toast.success(`${name} added`);
  };

  const handleSaveRates = () => {
    saveRates(rateForm);
    toast.success("Rates saved successfully");
  };

  const rateFields: Array<{
    key: keyof RateSettings;
    label: string;
    section: "tractor" | "12wheel";
  }> = [
    {
      key: "tractorLocal",
      label: "Local Rate per 1000 Bricks",
      section: "tractor",
    },
    {
      key: "tractorOutside",
      label: "Outside Rate per 1000 Bricks",
      section: "tractor",
    },
    { key: "tractorBats", label: "100 Safety Bats Rate", section: "tractor" },
    {
      key: "twelveWheelPer1000",
      label: "Rate per 1000 Bricks",
      section: "12wheel",
    },
    { key: "twelveWheelSafety", label: "100 Safety Rate", section: "12wheel" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Settings" onBack={onBack} />

      <div className="p-4 pb-8">
        <Tabs defaultValue="vehicle">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="vehicle"
              className="flex-1"
              data-ocid="settings.tab"
            >
              Vehicles
            </TabsTrigger>
            <TabsTrigger
              value="labor"
              className="flex-1"
              data-ocid="settings.tab"
            >
              Labor
            </TabsTrigger>
            <TabsTrigger
              value="rates"
              className="flex-1"
              data-ocid="settings.tab"
            >
              Rates
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Tab */}
          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <div className="flex gap-2">
                    {(["tractor", "twelveWheel"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setVehicleType(t)}
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Vehicle number (e.g. WB-12-3456)"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddVehicle()}
                    data-ocid="settings.input"
                  />
                  <Button
                    onClick={handleAddVehicle}
                    className="bg-primary text-primary-foreground"
                    data-ocid="settings.add_vehicle_button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {vehicles.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No vehicles added yet
              </p>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v, idx) => (
                  <div
                    key={v.number}
                    data-ocid={`settings.item.${idx + 1}`}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border shadow-xs"
                  >
                    <div>
                      <span className="font-semibold">{v.number}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {v.type === "tractor" ? "Tractor" : "12 Wheel"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        removeVehicle(v.number);
                        toast.success(`${v.number} removed`);
                      }}
                      data-ocid={`settings.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Labor Tab */}
          <TabsContent value="labor" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Labor name (e.g. Rahul)"
                    value={laborName}
                    onChange={(e) => setLaborName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLabor()}
                    data-ocid="settings.input"
                  />
                  <Button
                    onClick={handleAddLabor}
                    className="bg-primary text-primary-foreground"
                    data-ocid="settings.add_labor_button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {laborNames.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No labor names added yet
              </p>
            ) : (
              <div className="space-y-2">
                {laborNames.map((name, idx) => (
                  <div
                    key={name}
                    data-ocid={`settings.item.${idx + 1}`}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border shadow-xs"
                  >
                    <span className="font-medium">{name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        removeLabor(name);
                        toast.success(`${name} removed`);
                      }}
                      data-ocid={`settings.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-5">
                <div>
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider mb-3">
                    Tractor Rates (₹)
                  </h3>
                  <div className="space-y-3">
                    {rateFields
                      .filter((f) => f.section === "tractor")
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-sm">{field.label}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={rateForm[field.key]}
                            onChange={(e) =>
                              setRateForm((prev) => ({
                                ...prev,
                                [field.key]:
                                  Number.parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider mb-3">
                    12 Wheel Rates (₹)
                  </h3>
                  <div className="space-y-3">
                    {rateFields
                      .filter((f) => f.section === "12wheel")
                      .map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-sm">{field.label}</Label>
                          <Input
                            type="number"
                            min={0}
                            value={rateForm[field.key]}
                            onChange={(e) =>
                              setRateForm((prev) => ({
                                ...prev,
                                [field.key]:
                                  Number.parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      ))}
                  </div>
                </div>
                <Button
                  onClick={handleSaveRates}
                  className="w-full bg-primary text-primary-foreground"
                  data-ocid="settings.save_rates_button"
                >
                  Save Rates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
