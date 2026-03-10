import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import { useCompleteDeliveries } from "../hooks/useLocalStorage";
import { formatCurrency, formatDate } from "../types";

interface CompleteDeliveryListProps {
  onBack: () => void;
}

export default function CompleteDeliveryList({
  onBack,
}: CompleteDeliveryListProps) {
  const { deliveries, removeDelivery } = useCompleteDeliveries();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this delivery record?")) return;
    removeDelivery(id);
    toast.success("Delivery deleted");
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
          return (
            <Card
              key={delivery.id}
              data-ocid={`complete_list.item.${idx + 1}`}
              className="overflow-hidden"
            >
              <div className="h-1 bg-green-500" />
              <CardContent className="pt-4 space-y-3">
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

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Bricks</div>
                    <div className="text-sm font-bold text-primary mt-0.5">
                      {totalBricks.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-xs font-semibold mt-0.5 capitalize">
                      {delivery.deliveryType}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="text-xs text-muted-foreground">Dist</div>
                    <div className="text-xs font-semibold mt-0.5">
                      {delivery.distance} km
                    </div>
                  </div>
                </div>

                {delivery.loadingLabor.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Loading:{" "}
                    </span>
                    <span className="text-xs">
                      {delivery.loadingLabor.join(", ")}
                    </span>
                  </div>
                )}

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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => handleDelete(delivery.id)}
                  data-ocid={`complete_list.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
