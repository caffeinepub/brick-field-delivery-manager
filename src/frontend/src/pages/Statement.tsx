import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { getCompleteDeliveriesStatic } from "../hooks/useLocalStorage";
import { formatCurrency, formatDate, getTodayString } from "../types";
import type { LocalCompleteDelivery } from "../types";

interface StatementProps {
  onBack: () => void;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  return d;
}

function dateToStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function StatsSummary({ deliveries }: { deliveries: LocalCompleteDelivery[] }) {
  const totalTrips = deliveries.length;
  const totalBricks = deliveries.reduce(
    (sum, d) =>
      sum +
      d.brickSelections.reduce(
        (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
        0,
      ),
    0,
  );
  const totalAmount = deliveries.reduce(
    (sum, d) => sum + d.calculatedAmount,
    0,
  );

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
        <div className="text-2xl font-bold text-primary">{totalTrips}</div>
        <div className="text-xs text-muted-foreground mt-1">Total Trips</div>
      </div>
      <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
        <div className="text-xl font-bold text-primary">
          {totalBricks >= 1000
            ? `${(totalBricks / 1000).toFixed(1)}K`
            : totalBricks}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Total Bricks</div>
      </div>
      <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/20">
        <div className="text-lg font-bold text-primary">
          {totalAmount >= 1000
            ? `₹${(totalAmount / 1000).toFixed(0)}K`
            : formatCurrency(totalAmount)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Labor Amt</div>
      </div>
    </div>
  );
}

function DeliveryTable({
  deliveries,
}: { deliveries: LocalCompleteDelivery[] }) {
  if (deliveries.length === 0) {
    return (
      <div
        className="text-center py-10 text-muted-foreground"
        data-ocid="statement.empty_state"
      >
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No deliveries found</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {deliveries.map((d, idx) => {
        const bricks = d.brickSelections.reduce(
          (sum, b) => (b.brickType !== "Bats" ? sum + b.quantity : sum),
          0,
        );
        return (
          <div
            key={d.id}
            data-ocid={`statement.item.${idx + 1}`}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">{d.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  {d.vehicleNumber} · {bricks.toLocaleString("en-IN")} bricks
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary text-sm">
                  {formatCurrency(d.calculatedAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(d.date)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Statement({ onBack }: StatementProps) {
  const today = getTodayString();
  const monday = getMonday(new Date());
  const [weekStart, setWeekStart] = useState(dateToStr(monday));
  const [weekEnd, setWeekEnd] = useState(dateToStr(getSunday(monday)));

  const allDeliveries = useMemo(() => getCompleteDeliveriesStatic(), []);

  const todayDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.date === today),
    [allDeliveries, today],
  );

  const weeklyDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.date >= weekStart && d.date <= weekEnd),
    [allDeliveries, weekStart, weekEnd],
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Statement" onBack={onBack} />

      <div className="p-4 pb-8">
        <Tabs defaultValue="today">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              value="today"
              className="flex-1"
              data-ocid="statement.tab"
            >
              Today
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="flex-1"
              data-ocid="statement.tab"
            >
              Weekly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              {formatDate(today)}
            </div>
            <StatsSummary deliveries={todayDeliveries} />
            <Card>
              <CardContent className="pt-4">
                <DeliveryTable deliveries={todayDeliveries} />
              </CardContent>
            </Card>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/5"
              data-ocid="statement.primary_button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Today PDF
            </Button>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  data-ocid="statement.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  data-ocid="statement.input"
                />
              </div>
            </div>
            <StatsSummary deliveries={weeklyDeliveries} />
            <Card>
              <CardContent className="pt-4">
                <DeliveryTable deliveries={weeklyDeliveries} />
              </CardContent>
            </Card>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/5"
              data-ocid="statement.secondary_button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Weekly PDF
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
