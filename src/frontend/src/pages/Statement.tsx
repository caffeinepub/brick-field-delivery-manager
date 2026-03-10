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

interface VehicleCardProps {
  vehicleNumber: string;
  deliveries: LocalCompleteDelivery[];
  allLaborNames: string[];
  cardIndex: number;
}

function VehicleCard({
  vehicleNumber,
  deliveries,
  allLaborNames,
  cardIndex,
}: VehicleCardProps) {
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
      <div className="bg-orange-500 text-white px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-medium">
          {formatDate(deliveries[0]?.date ?? "")}
        </span>
        <span className="text-base font-bold tracking-wide">
          {vehicleNumber}
        </span>
      </div>
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

export default function Statement({ onBack }: StatementProps) {
  const today = getTodayString();
  const monday = getMonday(new Date());
  const [weekStart, setWeekStart] = useState(dateToStr(monday));
  const [weekEnd, setWeekEnd] = useState(dateToStr(getSunday(monday)));

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

  // Labor names present in today deliveries
  const todayLaborNames = useMemo(() => {
    const namesInDeliveries = new Set<string>();
    for (const d of todayDeliveries) {
      for (const l of d.loadingLabor) namesInDeliveries.add(l);
      for (const l of d.unloadingLabor) namesInDeliveries.add(l);
    }
    const ordered = allLaborNamesStored.filter((n) => namesInDeliveries.has(n));
    for (const n of namesInDeliveries) {
      if (!ordered.includes(n)) ordered.push(n);
    }
    return ordered;
  }, [todayDeliveries, allLaborNamesStored]);

  // Labor names present in weekly deliveries
  const weeklyLaborNames = useMemo(() => {
    const namesInDeliveries = new Set<string>();
    for (const d of weeklyDeliveries) {
      for (const l of d.loadingLabor) namesInDeliveries.add(l);
      for (const l of d.unloadingLabor) namesInDeliveries.add(l);
    }
    const ordered = allLaborNamesStored.filter((n) => namesInDeliveries.has(n));
    for (const n of namesInDeliveries) {
      if (!ordered.includes(n)) ordered.push(n);
    }
    return ordered;
  }, [weeklyDeliveries, allLaborNamesStored]);

  // Group today's deliveries by vehicle
  const vehicleGroups = useMemo(() => {
    const map = new Map<string, LocalCompleteDelivery[]>();
    for (const d of todayDeliveries) {
      const key = d.vehicleNumber || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries());
  }, [todayDeliveries]);

  // Labor grand totals for today
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

  // Weekly labor grand total by date
  const weeklyLaborByDate = useMemo(() => {
    // Get all unique dates in range that have deliveries
    const dateSet = new Set<string>();
    for (const d of weeklyDeliveries) dateSet.add(d.date);
    const dates = Array.from(dateSet).sort();

    return dates.map((date) => {
      const dayDeliveries = weeklyDeliveries.filter((d) => d.date === date);
      const laborAmounts: Record<string, number> = {};
      for (const ln of weeklyLaborNames) {
        laborAmounts[ln] = dayDeliveries.reduce((sum, d) => {
          const allLabor = [...d.loadingLabor, ...d.unloadingLabor];
          if (!allLabor.includes(ln)) return sum;
          const share = Math.round(d.calculatedAmount / allLabor.length);
          return sum + share;
        }, 0);
      }
      return { date, laborAmounts };
    });
  }, [weeklyDeliveries, weeklyLaborNames]);

  // Weekly labor column totals
  const weeklyLaborColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const ln of weeklyLaborNames) {
      totals[ln] = weeklyLaborByDate.reduce(
        (sum, row) => sum + (row.laborAmounts[ln] ?? 0),
        0,
      );
    }
    return totals;
  }, [weeklyLaborByDate, weeklyLaborNames]);

  const handlePrint = () => window.print();

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
            {/* Date header */}
            <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-orange-100">
              <p className="text-sm font-semibold text-gray-700">
                Date:{" "}
                <span className="text-orange-600">{formatDate(today)}</span>
              </p>
            </div>

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
                    <div className="p-4 space-y-2">
                      {todayLaborNames.map((ln) => (
                        <div
                          key={ln}
                          className="flex justify-between items-center border-b border-orange-50 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="font-semibold text-gray-700">
                            {ln}
                          </span>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(laborGrandTotals[ln] ?? 0)}
                          </span>
                        </div>
                      ))}
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
            {/* Date range inputs */}
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

            {/* Labor Grand Total table */}
            {weeklyDeliveries.length === 0 ? (
              <div
                className="text-center py-16 text-gray-400"
                data-ocid="statement.weekly.empty_state"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium">No deliveries in this period</p>
                <p className="text-xs mt-1">Adjust the date range above</p>
              </div>
            ) : (
              <div
                className="rounded-xl shadow-md overflow-hidden bg-white"
                data-ocid="statement.weekly.grand_total.section"
              >
                <div className="bg-orange-500 px-4 py-3">
                  <h2 className="text-white font-bold text-center text-sm tracking-widest uppercase">
                    Labor Grand Total
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    style={{
                      minWidth: `${120 + weeklyLaborNames.length * 90}px`,
                    }}
                  >
                    <thead>
                      <tr className="bg-orange-500 text-white">
                        <th className="px-3 py-2 text-left whitespace-nowrap">
                          Date
                        </th>
                        {weeklyLaborNames.map((ln) => (
                          <th
                            key={ln}
                            className="px-3 py-2 text-right whitespace-nowrap"
                          >
                            {ln}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyLaborByDate.map(({ date, laborAmounts }, idx) => (
                        <tr
                          key={date}
                          className={
                            idx % 2 === 0 ? "bg-white" : "bg-orange-50/40"
                          }
                        >
                          <td className="px-3 py-2 whitespace-nowrap font-medium">
                            {formatDate(date)}
                          </td>
                          {weeklyLaborNames.map((ln) => (
                            <td
                              key={ln}
                              className="px-3 py-2 text-right whitespace-nowrap"
                            >
                              {laborAmounts[ln] > 0
                                ? formatCurrency(laborAmounts[ln])
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-orange-50 font-bold border-t-2 border-orange-200">
                        <td className="px-3 py-2 whitespace-nowrap text-orange-700">
                          TOTAL
                        </td>
                        {weeklyLaborNames.map((ln) => (
                          <td
                            key={ln}
                            className="px-3 py-2 text-right whitespace-nowrap text-orange-700"
                          >
                            {weeklyLaborColumnTotals[ln] > 0
                              ? formatCurrency(weeklyLaborColumnTotals[ln])
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full border-orange-400 text-orange-500 hover:bg-orange-50 font-semibold rounded-xl no-print"
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
