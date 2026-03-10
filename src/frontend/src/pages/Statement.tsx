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
      {/* Orange header — shared by both layouts */}
      <div className="bg-orange-500 text-white px-3 py-2.5 flex justify-between items-center">
        <span className="text-xs font-medium">
          {formatDate(deliveries[0]?.date ?? "")}
        </span>
        <span className="text-sm font-bold tracking-wide">{vehicleNumber}</span>
      </div>

      {/* ── MOBILE LAYOUT: compact single-line delivery cards ── */}
      <div className="block md:hidden divide-y divide-orange-100">
        {deliveries.map((d, idx) => {
          const qty = d.brickSelections.reduce(
            (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
            0,
          );
          const laborOnDelivery = allLaborNames.filter(
            (ln) => getLaborShare(d, ln) !== null,
          );
          return (
            <div
              key={d.id}
              className={`px-3 py-2 ${
                idx % 2 === 0 ? "bg-white" : "bg-orange-50/30"
              }`}
            >
              {/* Single line: Name - Address - Qty Bricks | Amount on right */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-800 truncate min-w-0">
                  {d.customerName}
                  {d.address ? ` - ${d.address}` : ""}
                  {` - ${qty.toLocaleString("en-IN")} Bricks`}
                </div>
                <div className="font-bold text-orange-600 text-sm whitespace-nowrap shrink-0">
                  {formatCurrency(d.calculatedAmount)}
                </div>
              </div>

              {/* Labor chips: Rahul ₹29 | Soma ₹29 | Bharat ₹29 — slightly bigger */}
              {laborOnDelivery.length > 0 && (
                <div className="text-sm text-gray-400 mt-0.5 truncate">
                  {laborOnDelivery
                    .map((ln) => {
                      const share = getLaborShare(d, ln);
                      return `${ln} ${share !== null ? formatCurrency(share) : "—"}`;
                    })
                    .join(" | ")}
                </div>
              )}
            </div>
          );
        })}

        {/* Mobile total row */}
        <div className="bg-orange-50 px-3 py-2.5 flex justify-between items-center border-t-2 border-orange-200">
          <div>
            <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">
              Total
            </span>
            <span className="text-xs text-orange-600 ml-2">
              {totalQty.toLocaleString("en-IN")} bricks
            </span>
          </div>
          <span className="font-bold text-orange-700 text-sm">
            {formatCurrency(totalTrip)}
          </span>
        </div>
      </div>

      {/* ── DESKTOP LAYOUT: full table ── */}
      <div className="hidden md:block">
        <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: allLaborNames.length > 0 ? "35%" : "50%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "20%" }} />
            {allLaborNames.map((ln) => (
              <col
                key={`col-${ln}`}
                style={{
                  width: `${Math.floor(30 / Math.max(allLaborNames.length, 1))}%`,
                }}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="px-1.5 py-1.5 text-left">Customer</th>
              <th className="px-1 py-1.5 text-right">Qty</th>
              <th className="px-1 py-1.5 text-right">Amt</th>
              {allLaborNames.map((ln) => (
                <th key={ln} className="px-1 py-1.5 text-right truncate">
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
                  <td className="px-1.5 py-1.5">
                    <div className="font-semibold text-gray-800 leading-tight truncate">
                      {d.customerName}
                    </div>
                    {d.address && (
                      <div className="text-gray-400 text-[10px] leading-tight truncate mt-0.5">
                        {d.address}
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-1.5 text-right text-gray-700">
                    {qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-1 py-1.5 text-right font-medium text-gray-800">
                    {formatCurrency(d.calculatedAmount)}
                  </td>
                  {allLaborNames.map((ln) => {
                    const share = getLaborShare(d, ln);
                    return (
                      <td
                        key={ln}
                        className="px-1 py-1.5 text-right text-gray-600"
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
              <td className="px-1.5 py-1.5 text-orange-700">TOTAL</td>
              <td className="px-1 py-1.5 text-right text-orange-700">
                {totalQty.toLocaleString("en-IN")}
              </td>
              <td className="px-1 py-1.5 text-right text-orange-700">
                {formatCurrency(totalTrip)}
              </td>
              {allLaborNames.map((ln) => (
                <td key={ln} className="px-1 py-1.5 text-right text-orange-700">
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

  // Today tab date range (defaults to today → today)
  const [todayFrom, setTodayFrom] = useState(today);
  const [todayTo, setTodayTo] = useState(today);

  // Weekly tab date range
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
    () => allDeliveries.filter((d) => d.date >= todayFrom && d.date <= todayTo),
    [allDeliveries, todayFrom, todayTo],
  );

  const weeklyDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.date >= weekStart && d.date <= weekEnd),
    [allDeliveries, weekStart, weekEnd],
  );

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

  const vehicleGroups = useMemo(() => {
    const map = new Map<string, LocalCompleteDelivery[]>();
    for (const d of todayDeliveries) {
      const key = d.vehicleNumber || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries());
  }, [todayDeliveries]);

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

  const weeklyLaborByDate = useMemo(() => {
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
            {/* Date range filter — same design as Weekly */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={todayFrom}
                  onChange={(e) => setTodayFrom(e.target.value)}
                  data-ocid="statement.today.from.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={todayTo}
                  onChange={(e) => setTodayTo(e.target.value)}
                  data-ocid="statement.today.to.input"
                />
              </div>
            </div>

            {/* Vehicle-wise statement cards */}
            {todayDeliveries.length === 0 ? (
              <div
                className="text-center py-16 text-gray-400"
                data-ocid="statement.empty_state"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-25" />
                <p className="font-medium">No deliveries found</p>
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

                {/* Labor Grand Total — compact */}
                {todayLaborNames.length > 0 && (
                  <div
                    className="rounded-xl border border-orange-300 bg-white shadow-sm overflow-hidden"
                    data-ocid="statement.grand_total.section"
                  >
                    <div className="bg-orange-500 px-3 py-2">
                      <h2 className="text-white font-bold text-center text-sm tracking-widest uppercase">
                        Labor Grand Total
                      </h2>
                    </div>

                    {/* Mobile: 4-column compact chip grid */}
                    <div className="block md:hidden p-1.5">
                      <div className="grid grid-cols-4 gap-1">
                        {todayLaborNames.map((ln) => (
                          <div
                            key={ln}
                            className="flex flex-col items-center justify-center bg-orange-50 border border-orange-200 rounded-md py-1 px-1"
                          >
                            <span className="text-[10px] font-medium text-gray-600 leading-tight">
                              {ln}
                            </span>
                            <span className="text-[11px] font-bold text-orange-600 leading-tight">
                              {formatCurrency(laborGrandTotals[ln] ?? 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop: list style */}
                    <div className="hidden md:block p-3 space-y-1">
                      {todayLaborNames.map((ln) => (
                        <div
                          key={ln}
                          className="flex justify-between items-center border-b border-orange-50 pb-1 last:border-0 last:pb-0"
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
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  data-ocid="statement.weekly.from.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  data-ocid="statement.weekly.to.input"
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
                <table
                  className="w-full text-xs"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col
                      style={{
                        width: `${Math.max(30, 100 - weeklyLaborNames.length * 15)}%`,
                      }}
                    />
                    {weeklyLaborNames.map((ln) => (
                      <col
                        key={`col-${ln}`}
                        style={{
                          width: `${Math.min(
                            15,
                            Math.floor(
                              (100 -
                                Math.max(
                                  30,
                                  100 - weeklyLaborNames.length * 15,
                                )) /
                                Math.max(weeklyLaborNames.length, 1),
                            ),
                          )}%`,
                        }}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-orange-500 text-white">
                      <th className="px-2 py-1.5 text-left">Date</th>
                      {weeklyLaborNames.map((ln) => (
                        <th
                          key={ln}
                          className="px-1 py-1.5 text-right truncate"
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
                        <td className="px-2 py-1.5 font-medium text-gray-800">
                          {formatDate(date)}
                        </td>
                        {weeklyLaborNames.map((ln) => (
                          <td
                            key={ln}
                            className="px-1 py-1.5 text-right text-gray-700"
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
                      <td className="px-2 py-1.5 text-orange-700">TOTAL</td>
                      {weeklyLaborNames.map((ln) => (
                        <td
                          key={ln}
                          className="px-1 py-1.5 text-right text-orange-700"
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
