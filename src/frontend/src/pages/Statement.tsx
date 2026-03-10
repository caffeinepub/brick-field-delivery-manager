import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
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

  const hasLabor = allLaborNames.length > 0;

  return (
    <div
      className="rounded-xl shadow-md overflow-hidden bg-white"
      data-ocid={`statement.vehicle.card.${cardIndex}`}
    >
      {/* Orange header */}
      <div className="bg-orange-500 text-white px-3 py-2.5 flex justify-between items-center">
        <span className="text-xs font-medium">
          {formatDate(deliveries[0]?.date ?? "")}
        </span>
        <span className="text-sm font-bold tracking-wide">{vehicleNumber}</span>
      </div>

      {/* ── TABLE LAYOUT ── */}
      <div className="w-full overflow-x-auto">
        <table
          className="w-full text-xs"
          style={{
            tableLayout: hasLabor ? "auto" : "fixed",
            minWidth: hasLabor
              ? `${320 + allLaborNames.length * 60}px`
              : "320px",
          }}
        >
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "14%" }} />
            {allLaborNames.map((ln) => (
              <col key={`col-${ln}`} style={{ minWidth: "60px" }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-orange-100 text-orange-800">
              <th className="px-2 py-2 text-left font-semibold">Customer</th>
              <th className="px-2 py-2 text-left font-semibold">Address</th>
              <th className="px-2 py-2 text-right font-semibold">Bricks</th>
              <th className="px-2 py-2 text-right font-semibold">Trip Amt</th>
              {allLaborNames.map((ln) => (
                <th
                  key={ln}
                  className="px-2 py-2 text-right font-semibold bg-orange-100 text-orange-800 truncate"
                >
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
                  <td className="px-2 py-2 font-semibold text-gray-800 truncate">
                    {d.customerName}
                  </td>
                  <td className="px-2 py-2 text-gray-600 truncate">
                    {d.address || "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-orange-600">
                    {formatCurrency(d.calculatedAmount)}
                  </td>
                  {allLaborNames.map((ln) => {
                    const share = getLaborShare(d, ln);
                    return (
                      <td key={ln} className="px-2 py-2 text-right">
                        {share === null ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(share)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-orange-50 font-bold border-t-2 border-orange-200">
              <td className="px-2 py-2 text-orange-700 uppercase text-[11px] tracking-wide">
                Total
              </td>
              <td className="px-2 py-2" />
              <td className="px-2 py-2 text-right text-orange-700">
                {totalQty.toLocaleString("en-IN")}
              </td>
              <td className="px-2 py-2 text-right text-orange-700">
                {formatCurrency(totalTrip)}
              </td>
              {allLaborNames.map((ln) => (
                <td key={ln} className="px-2 py-2 text-right text-orange-700">
                  {formatCurrency(laborTotals[ln] ?? 0)}
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

  const [todayFrom, setTodayFrom] = useState(today);
  const [todayTo, setTodayTo] = useState(today);

  const [weekStart, setWeekStart] = useState(dateToStr(monday));
  const [weekEnd, setWeekEnd] = useState(dateToStr(getSunday(monday)));

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

  // ── PDF GENERATION ──
  const handleDownloadTodayPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const orange: [number, number, number] = [249, 115, 22];
    const orangeLight: [number, number, number] = [255, 237, 213];
    const white: [number, number, number] = [255, 255, 255];
    const darkText: [number, number, number] = [30, 30, 30];

    let y = 15;

    // ── HEADER ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...darkText);
    doc.text("SAHA", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(13);
    doc.text("S B C O BRICK FIELD", pageWidth / 2, y, { align: "center" });
    y += 6;

    // thin divider line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // ── VEHICLE GROUPS ──
    for (const [vehicleNumber, deliveries] of vehicleGroups) {
      // vehicle sub-header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.setFillColor(...orange);
      doc.roundedRect(14, y, pageWidth - 28, 8, 1.5, 1.5, "F");
      doc.text(vehicleNumber, pageWidth / 2, y + 5.5, { align: "center" });
      y += 11;

      // build table rows
      const head = [["Address", "Bricks", "Trip Amt", ...todayLaborNames]];

      const body = deliveries.map((d) => {
        const qty = d.brickSelections.reduce(
          (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
          0,
        );
        const laborCells = todayLaborNames.map((ln) => {
          const share = getLaborShare(d, ln);
          return share === null ? "-" : `Rs${share}`;
        });
        return [
          d.address || d.customerName || "-",
          qty.toLocaleString("en-IN"),
          `Rs${d.calculatedAmount}`,
          ...laborCells,
        ];
      });

      // total row
      const totalQty = deliveries.reduce(
        (sum, d) =>
          sum +
          d.brickSelections.reduce(
            (s, b) => (b.brickType !== "Bats" ? s + b.quantity : s),
            0,
          ),
        0,
      );
      const totalTrip = deliveries.reduce(
        (sum, d) => sum + d.calculatedAmount,
        0,
      );
      const laborTotals = todayLaborNames.map((ln) => {
        const t = deliveries.reduce((sum, d) => {
          const share = getLaborShare(d, ln);
          return sum + (share ?? 0);
        }, 0);
        return `Rs${t}`;
      });

      const foot = [
        [
          "TOTAL",
          totalQty.toLocaleString("en-IN"),
          `Rs${totalTrip}`,
          ...laborTotals,
        ],
      ];

      // Build equal-width labor column styles
      const tableContentWidth = pageWidth - 28;
      const fixedWidth = 50 + 20 + 25; // address + bricks + tripAmt
      const laborColWidth = Math.max(
        18,
        (tableContentWidth - fixedWidth) / Math.max(todayLaborNames.length, 1),
      );
      const dynamicColumnStyles: Record<
        number,
        { halign: "left" | "center" | "right"; cellWidth?: number }
      > = {
        0: { halign: "left", cellWidth: 50 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "center", cellWidth: 25 },
      };
      todayLaborNames.forEach((_, i) => {
        dynamicColumnStyles[3 + i] = {
          halign: "center",
          cellWidth: laborColWidth,
        };
      });

      autoTable(doc, {
        startY: y,
        head,
        body,
        foot,
        margin: { left: 14, right: 14 },
        tableWidth: tableContentWidth,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          overflow: "linebreak",
          halign: "center",
        },
        headStyles: {
          fillColor: orange,
          textColor: white,
          fontStyle: "bold",
          halign: "center",
        },
        footStyles: {
          fillColor: orangeLight,
          textColor: [180, 60, 0] as [number, number, number],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: dynamicColumnStyles,
        alternateRowStyles: {
          fillColor: [255, 250, 245] as [number, number, number],
        },
        tableLineColor: [220, 180, 150] as [number, number, number],
        tableLineWidth: 0.2,
        didDrawPage: (data) => {
          y = (data.cursor?.y ?? y) + 6;
        },
      });

      y =
        (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 8;
    }

    // ── LABOR GRAND TOTAL ──
    if (todayLaborNames.length > 0) {
      // section header
      doc.setFillColor(...orange);
      doc.roundedRect(14, y, pageWidth - 28, 8, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...white);
      doc.text("LABOR GRAND TOTAL", pageWidth / 2, y + 5.5, {
        align: "center",
      });
      y += 12;

      for (const ln of todayLaborNames) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...darkText);
        doc.text(ln, 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...orange);
        doc.text(`Rs${laborGrandTotals[ln] ?? 0}`, pageWidth - 20, y, {
          align: "right",
        });
        // thin divider
        doc.setDrawColor(230, 200, 180);
        doc.setLineWidth(0.2);
        doc.line(14, y + 2, pageWidth - 14, y + 2);
        y += 7;
      }
    }

    const dateLabel =
      todayFrom === todayTo ? todayFrom : `${todayFrom}_to_${todayTo}`;
    doc.save(`statement_${dateLabel}.pdf`);
  };

  const handlePrintWeekly = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Statement" onBack={onBack} />

      <div className="p-4 pb-8">
        <Tabs defaultValue="today">
          <TabsList className="w-full mb-4">
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

                {/* Labor Grand Total — compact, unchanged */}
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
              onClick={handleDownloadTodayPDF}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
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
                              : "-"}
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
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <Button
              onClick={handlePrintWeekly}
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
