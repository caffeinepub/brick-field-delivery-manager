import { useCallback, useState } from "react";
import type {
  LocalCompleteDelivery,
  LocalPendingDelivery,
  RateSettings,
  Vehicle,
} from "../types";
import { DEFAULT_RATES } from "../types";

const KEYS = {
  vehicles: "bf_vehicles",
  laborNames: "bf_laborNames",
  rates: "bf_rates",
  completeDeliveries: "bf_completeDeliveries",
  pendingDeliveries: "bf_pendingDeliveries",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently fail
  }
}

export function useVehicles() {
  const [vehicles, setVehiclesState] = useState<Vehicle[]>(() =>
    load<Vehicle[]>(KEYS.vehicles, []),
  );

  const setVehicles = useCallback(
    (v: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => {
      setVehiclesState((prev) => {
        const next = typeof v === "function" ? v(prev) : v;
        save(KEYS.vehicles, next);
        return next;
      });
    },
    [],
  );

  const addVehicle = useCallback(
    (vehicle: Vehicle) => {
      setVehicles((prev) => [...prev, vehicle]);
    },
    [setVehicles],
  );

  const removeVehicle = useCallback(
    (number: string) => {
      setVehicles((prev) => prev.filter((v) => v.number !== number));
    },
    [setVehicles],
  );

  return { vehicles, addVehicle, removeVehicle };
}

export function useLaborNames() {
  const [laborNames, setLaborNamesState] = useState<string[]>(() =>
    load<string[]>(KEYS.laborNames, [
      "Rahul",
      "Soma",
      "Bharat",
      "Raju",
      "Sinu",
    ]),
  );

  const setLaborNames = useCallback(
    (names: string[] | ((prev: string[]) => string[])) => {
      setLaborNamesState((prev) => {
        const next = typeof names === "function" ? names(prev) : names;
        save(KEYS.laborNames, next);
        return next;
      });
    },
    [],
  );

  const addLabor = useCallback(
    (name: string) => {
      setLaborNames((prev) => [...prev, name]);
    },
    [setLaborNames],
  );

  const removeLabor = useCallback(
    (name: string) => {
      setLaborNames((prev) => prev.filter((n) => n !== name));
    },
    [setLaborNames],
  );

  return { laborNames, addLabor, removeLabor };
}

export function useRates() {
  const [rates, setRatesState] = useState<RateSettings>(() =>
    load<RateSettings>(KEYS.rates, DEFAULT_RATES),
  );

  const saveRates = useCallback((r: RateSettings) => {
    save(KEYS.rates, r);
    setRatesState(r);
  }, []);

  return { rates, saveRates };
}

export function useCompleteDeliveries() {
  const [deliveries, setDeliveriesState] = useState<LocalCompleteDelivery[]>(
    () => load<LocalCompleteDelivery[]>(KEYS.completeDeliveries, []),
  );

  const addDelivery = useCallback((delivery: LocalCompleteDelivery) => {
    const current = load<LocalCompleteDelivery[]>(KEYS.completeDeliveries, []);
    const next = [delivery, ...current];
    save(KEYS.completeDeliveries, next);
    setDeliveriesState(next);
  }, []);

  const removeDelivery = useCallback((id: number) => {
    const current = load<LocalCompleteDelivery[]>(KEYS.completeDeliveries, []);
    const next = current.filter((d) => d.id !== id);
    save(KEYS.completeDeliveries, next);
    setDeliveriesState(next);
  }, []);

  const updateDelivery = useCallback(
    (id: number, updated: LocalCompleteDelivery) => {
      const current = load<LocalCompleteDelivery[]>(
        KEYS.completeDeliveries,
        [],
      );
      const next = current.map((d) => (d.id === id ? updated : d));
      save(KEYS.completeDeliveries, next);
      setDeliveriesState(next);
    },
    [],
  );

  return { deliveries, addDelivery, removeDelivery, updateDelivery };
}

export function usePendingDeliveries() {
  const [deliveries, setDeliveriesState] = useState<LocalPendingDelivery[]>(
    () => load<LocalPendingDelivery[]>(KEYS.pendingDeliveries, []),
  );

  const addPendingDelivery = useCallback((delivery: LocalPendingDelivery) => {
    const current = load<LocalPendingDelivery[]>(KEYS.pendingDeliveries, []);
    const next = [delivery, ...current];
    save(KEYS.pendingDeliveries, next);
    setDeliveriesState(next);
  }, []);

  const removePendingDelivery = useCallback((id: number) => {
    const current = load<LocalPendingDelivery[]>(KEYS.pendingDeliveries, []);
    const next = current.filter((d) => d.id !== id);
    save(KEYS.pendingDeliveries, next);
    setDeliveriesState(next);
  }, []);

  const updatePendingDelivery = useCallback(
    (id: number, updated: LocalPendingDelivery) => {
      const current = load<LocalPendingDelivery[]>(KEYS.pendingDeliveries, []);
      const next = current.map((d) => (d.id === id ? updated : d));
      save(KEYS.pendingDeliveries, next);
      setDeliveriesState(next);
    },
    [],
  );

  return {
    deliveries,
    addPendingDelivery,
    removePendingDelivery,
    updatePendingDelivery,
  };
}

export function getRatesStatic(): RateSettings {
  return load<RateSettings>(KEYS.rates, DEFAULT_RATES);
}

export function getVehiclesStatic(): Vehicle[] {
  return load<Vehicle[]>(KEYS.vehicles, []);
}

export function getLaborNamesStatic(): string[] {
  return load<string[]>(KEYS.laborNames, [
    "Rahul",
    "Soma",
    "Bharat",
    "Raju",
    "Sinu",
  ]);
}

export function getCompleteDeliveriesStatic(): LocalCompleteDelivery[] {
  return load<LocalCompleteDelivery[]>(KEYS.completeDeliveries, []);
}

export function saveCompleteDeliveryStatic(
  delivery: LocalCompleteDelivery,
): void {
  const existing = getCompleteDeliveriesStatic();
  save(KEYS.completeDeliveries, [delivery, ...existing]);
}

export function getPendingDeliveriesStatic(): LocalPendingDelivery[] {
  return load<LocalPendingDelivery[]>(KEYS.pendingDeliveries, []);
}
