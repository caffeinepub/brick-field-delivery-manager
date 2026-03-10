import { Card, CardContent } from "@/components/ui/card";
import {
  CheckSquare,
  ClipboardList,
  FileText,
  Package,
  Plus,
  Settings,
  Truck,
  Zap,
} from "lucide-react";
import { getCompleteDeliveriesStatic } from "../hooks/useLocalStorage";
import { formatCurrency } from "../types";

type Page =
  | "dashboard"
  | "add-pending"
  | "direct-delivery"
  | "pending-list"
  | "complete-list"
  | "settings"
  | "statement";

interface DashboardProps {
  navigate: (page: Page) => void;
}

export default function Dashboard({ navigate }: DashboardProps) {
  const deliveries = getCompleteDeliveriesStatic();
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
  const totalLabor = deliveries.reduce((sum, d) => sum + d.calculatedAmount, 0);

  const navTiles = [
    {
      page: "add-pending" as Page,
      label: "Add Pending Delivery",
      icon: Plus,
      ocid: "dashboard.add_pending_button",
      color: "bg-orange-50 border-orange-200 text-orange-700",
      iconBg: "bg-primary",
    },
    {
      page: "direct-delivery" as Page,
      label: "Direct Delivery",
      icon: Zap,
      ocid: "dashboard.direct_delivery_button",
      color: "bg-blue-50 border-blue-200 text-blue-700",
      iconBg: "bg-blue-500",
    },
    {
      page: "pending-list" as Page,
      label: "Pending Delivery List",
      icon: ClipboardList,
      ocid: "dashboard.pending_list_button",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      iconBg: "bg-yellow-500",
    },
    {
      page: "complete-list" as Page,
      label: "Complete Delivery List",
      icon: CheckSquare,
      ocid: "dashboard.complete_list_button",
      color: "bg-green-50 border-green-200 text-green-700",
      iconBg: "bg-green-500",
    },
    {
      page: "settings" as Page,
      label: "Settings",
      icon: Settings,
      ocid: "dashboard.settings_button",
      color: "bg-purple-50 border-purple-200 text-purple-700",
      iconBg: "bg-purple-500",
    },
    {
      page: "statement" as Page,
      label: "Statement",
      icon: FileText,
      ocid: "dashboard.statement_button",
      color: "bg-teal-50 border-teal-200 text-teal-700",
      iconBg: "bg-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-5 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-none">Brick Field</h1>
            <p className="text-white/70 text-sm">Delivery Manager</p>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-4 -mt-1 pb-2">
        <div
          className="bg-primary/10 rounded-2xl p-4 -mt-3 border border-primary/20"
          style={{ marginTop: "-12px" }}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-primary">
                {totalTrips}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">
                Total Trips
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-primary">
                {totalBricks >= 1000
                  ? `${(totalBricks / 1000).toFixed(1)}K`
                  : totalBricks}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">
                Total Bricks
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg font-bold text-primary">
                {totalLabor >= 1000
                  ? `₹${(totalLabor / 1000).toFixed(0)}K`
                  : formatCurrency(totalLabor)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">
                Labor Amount
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tiles */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {navTiles.map(({ page, label, icon: Icon, ocid, color, iconBg }) => (
            <button
              type="button"
              key={page}
              data-ocid={ocid}
              onClick={() => navigate(page)}
              className={`${color} border rounded-2xl p-4 flex flex-col items-start gap-3 text-left active:scale-95 transition-all hover:shadow-md`}
            >
              <div
                className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-sm leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pb-6 px-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
