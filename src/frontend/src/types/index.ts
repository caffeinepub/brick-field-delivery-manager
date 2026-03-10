export interface Vehicle {
  type: "tractor" | "twelveWheel";
  number: string;
}

export interface RateSettings {
  tractorLocal: number;
  tractorOutside: number;
  tractorBats: number;
  twelveWheelPer1000: number;
  twelveWheelSafety: number;
}

export interface BrickSelectionLocal {
  brickType: string;
  quantity: number;
}

export interface LocalCompleteDelivery {
  id: number;
  customerName: string;
  vehicleType: string;
  date: string;
  vehicleNumber: string;
  calculatedAmount: number;
  unloadingLabor: string[];
  brickSelections: BrickSelectionLocal[];
  loadingLabor: string[];
  deliveryType: string;
  distance: number;
  batsNotes?: string;
  address: string;
  dueAmount: number;
}

export interface LocalPendingDelivery {
  id: number;
  customerName: string;
  date: string;
  address: string;
  dueAmount: number;
  deliveryType: string;
  brickSelections: BrickSelectionLocal[];
  batsNotes?: string;
}

export const BRICK_TYPES = [
  "1 No Bricks",
  "2 No Bricks",
  "3 No Bricks",
  "1 No Picket",
  "2 No Picket",
  "Crack",
  "Goria",
  "Bats",
];

export const DEFAULT_RATES: RateSettings = {
  tractorLocal: 150,
  tractorOutside: 200,
  tractorBats: 50,
  twelveWheelPer1000: 300,
  twelveWheelSafety: 100,
};

export function calculateDeliveryAmount(
  vehicleType: string,
  deliveryType: string,
  totalBricks: number,
  hasBats: boolean,
  rates: RateSettings,
): number {
  if (vehicleType === "tractor") {
    const ratePerK =
      deliveryType === "local" ? rates.tractorLocal : rates.tractorOutside;
    let amount = (totalBricks / 1000) * ratePerK;
    if (hasBats) amount += rates.tractorBats;
    return Math.round(amount);
  }
  let amount = (totalBricks / 1000) * rates.twelveWheelPer1000;
  if (hasBats) amount += rates.twelveWheelSafety;
  return Math.round(amount);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
