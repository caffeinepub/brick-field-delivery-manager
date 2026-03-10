import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  getCompleteDeliveriesStatic,
  getLaborNamesStatic,
} from "../hooks/useLocalStorage";
import { formatCurrency, formatDate, getTodayString } from "../types/index";
import type { LocalCompleteDelivery } from "../types/index";

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
      <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
        <div className="text-2xl font-bold text-orange-600">{totalTrips}</div>
        <div className="text-xs text-gray-500 mt-1">Total Trips</div>
      </div>
      <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
        <div className="text-xl font-bold text-orange-600">
          {totalBricks >= 1000
            ? `${(totalBricks / 1000).toFixed(1)}K`
            : totalBricks}
        </div>
        <div className="text-xs text-gray-500 mt-1">Total Bricks</div>
      </div>
      <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
        <div className="text-lg font-bold text-orange-600">
          {totalAmount >= 1000
            ? `₹${(totalAmount / 1000).toFixed(0)}K`
            : formatCurrency(totalAmount)}
        </div>
        <div className="text-xs text-gray-500 mt-1">Total Amt</div>
      </div>
    </div>
  );
}

interface VehicleCardProps {
  vehicleNumber: string;
  deliveries: LocalCompleteDelivery[];
  allLaborNames: string[];
  cardIndex: number;
}

function getLaborShare(
  delivery: LocalCompleteDelivery,
  laborName: string,
): number | null {
  const allLabor = [...delivery.loadingLabor, ...delivery.unloadingLabor];
  if (!allLabor.includes(laborName)) return null;
  const total = allLabor.length;
  if (total === 0) return null;
  return Math.round(delivery.calculatedAmount / total);
}

function VehicleCard({
  vehicleNumber,
  deliveries,
  allLaborNames,
  cardIndex,
}: VehicleCardProps) {
  const date = deliveries[0]?.date ?? "";

  // Compute totals
  const totalQty = deliveries.reduce(
    (sum, d) =>
      sum +
      d.brickSelections.reduce(
        (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
        0,
      ),
    0,
  );
  const totalTrip = deliveries.reduce((sum, d) => sum + d.calculatedAmount, 0);
  const laborTotals: Record<string, number> = {};
  for (const ln of allLaborNames) {
    laborTotals[ln] = deliveries.reduce((sum, d) => {
      const share = getLaborShare(d, ln);
      return sum + (share ?? 0);
    }, 0);
  }

  return (
    <div
      className="rounded-xl shadow-md overflow-hidden bg-white"
      data-ocid={`statement.vehicle.card.${cardIndex}`}
    >
      {/* Card Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium">{formatDate(date)}</span>
        <span className="text-base font-bold tracking-wide">
          {vehicleNumber}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="px-3 py-2 text-left whitespace-nowrap">
                Customer
              </th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Address</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Qty</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">Trip ₹</th>
              {allLaborNames.map((ln) => (
                <th key={ln} className="px-3 py-2 text-right whitespace-nowrap">
                  {ln}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d, idx) => {
              const qty = d.brickSelections.reduce(
                (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
                0,
              );
              return (
                <tr
                  key={d.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-orange-50/40"}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {d.customerName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                    {d.address || "—"}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                    {formatCurrency(d.calculatedAmount)}
                  </td>
                  {allLaborNames.map((ln) => {
                    const share = getLaborShare(d, ln);
                    return (
                      <td
                        key={ln}
                        className="px-3 py-2 text-right whitespace-nowrap"
                      >
                        {share !== null ? formatCurrency(share) : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-orange-50 font-bold border-t-2 border-orange-200">
              <td
                className="px-3 py-2 whitespace-nowrap text-orange-700"
                colSpan={2}
              >
                TOTAL
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap text-orange-700">
                {totalQty.toLocaleString("en-IN")}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap text-orange-700">
                {formatCurrency(totalTrip)}
              </td>
              {allLaborNames.map((ln) => (
                <td
                  key={ln}
                  className="px-3 py-2 text-right whitespace-nowrap text-orange-700"
                >
                  {laborTotals[ln] > 0 ? formatCurrency(laborTotals[ln]) : "—"}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
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
        className="text-center py-10 text-gray-400"
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
                <div className="text-xs text-gray-500">
                  {d.vehicleNumber} · {bricks.toLocaleString("en-IN")} bricks
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-500 text-sm">
                  {formatCurrency(d.calculatedAmount)}
                </div>
                <div className="text-xs text-gray-400">
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

  // Inject print styles
  useEffect(() => {
    let styleEl = document.getElementById(
      "print-styles",
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "print-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { background: white; }
        .print-page { padding: 0; }
      }
    `;
    return () => {
      // leave styles in head
    };
  }, []);

  const allDeliveries = useMemo(() => getCompleteDeliveriesStatic(), []);
  const allLaborNamesStored = useMemo(() => getLaborNamesStatic(), []);

  const todayDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.date === today),
    [allDeliveries, today],
  );

  const weeklyDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.date >= weekStart && d.date <= weekEnd),
    [allDeliveries, weekStart, weekEnd],
  );

  // All unique labor names that appear in today's deliveries
  const todayLaborNames = useMemo(() => {
    const namesInDeliveries = new Set<string>();
    for (const d of todayDeliveries) {
      for (const l of d.loadingLabor) namesInDeliveries.add(l);
      for (const l of d.unloadingLabor) namesInDeliveries.add(l);
    }
    // Keep stored order, filter to only those present today
    const ordered = allLaborNamesStored.filter((n) => namesInDeliveries.has(n));
    // Add any that aren't in stored but appear in deliveries
    for (const n of namesInDeliveries) {
      if (!ordered.includes(n)) ordered.push(n);
    }
    return ordered;
  }, [todayDeliveries, allLaborNamesStored]);

  // Group today's deliveries by vehicle
  const vehicleGroups = useMemo(() => {
    const map = new Map<string, LocalCompleteDelivery[]>();
    for (const d of todayDeliveries) {
      const key = d.vehicleNumber || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries()); // [vehicleNumber, deliveries[]]
  }, [todayDeliveries]);

  // Labor grand totals across all vehicles
  const laborGrandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const ln of todayLaborNames) {
      totals[ln] = todayDeliveries.reduce((sum, d) => {
        const allLabor = [...d.loadingLabor, ...d.unloadingLabor];
        if (!allLabor.includes(ln)) return sum;
        const share = Math.round(d.calculatedAmount / allLabor.length);
        return sum + share;
      }, 0);
    }
    return totals;
  }, [todayDeliveries, todayLaborNames]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <PageHeader title="Statement" onBack={onBack} />
      </div>

      <div className="p-4 pb-8 print-page">
        <Tabs defaultValue="today">
          <TabsList className="w-full mb-4 no-print">
            <TabsTrigger
              value="today"
              className="flex-1"
              data-ocid="statement.today.tab"
            >
              Today
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="flex-1"
              data-ocid="statement.weekly.tab"
            >
              Weekly
            </TabsTrigger>
          </TabsList>

          {/* ── TODAY TAB ── */}
          <TabsContent value="today" className="space-y-4">
            <div className="text-sm text-gray-500 text-center font-medium">
              {formatDate(today)}
            </div>

            <StatsSummary deliveries={todayDeliveries} />

            {/* Vehicle-wise statement cards */}
            {todayDeliveries.length === 0 ? (
              <div
                className="text-center py-16 text-gray-400"
                data-ocid="statement.empty_state"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium">No deliveries today</p>
                <p className="text-xs mt-1">
                  Complete deliveries will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {vehicleGroups.map(([vehicleNumber, vDeliveries], idx) => (
                  <VehicleCard
                    key={vehicleNumber}
                    vehicleNumber={vehicleNumber}
                    deliveries={vDeliveries}
                    allLaborNames={todayLaborNames}
                    cardIndex={idx + 1}
                  />
                ))}

                {/* Labor Grand Total */}
                {todayLaborNames.length > 0 && (
                  <div
                    className="rounded-xl border-2 border-orange-400 bg-white shadow-sm overflow-hidden"
                    data-ocid="statement.grand_total.section"
                  >
                    <div className="bg-orange-500 px-4 py-3">
                      <h2 className="text-white font-bold text-center text-sm tracking-widest uppercase">
                        Labor Grand Total
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {todayLaborNames.map((ln) => (
                          <div
                            key={ln}
                            className="flex justify-between items-center bg-orange-50 rounded-lg px-3 py-2 border border-orange-100"
                          >
                            <span className="font-semibold text-gray-700 text-sm">
                              {ln}
                            </span>
                            <span className="font-bold text-orange-600 text-sm">
                              {formatCurrency(laborGrandTotals[ln] ?? 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handlePrint}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl no-print"
              data-ocid="statement.download.primary_button"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Today PDF
            </Button>
          </TabsContent>

          {/* ── WEEKLY TAB ── */}
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
            <div className="rounded-xl overflow-hidden bg-white shadow-md">
              <div className="bg-orange-500 text-white px-4 py-3">
                <h3 className="font-bold text-sm">Weekly Deliveries</h3>
              </div>
              <div className="p-3">
                <DeliveryTable deliveries={weeklyDeliveries} />
              </div>
            </div>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full border-orange-400 text-orange-500 hover:bg-orange-50 font-semibold rounded-xl"
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
