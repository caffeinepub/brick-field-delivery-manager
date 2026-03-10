import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BRICK_TYPES } from "../types";

export interface BrickState {
  selected: boolean;
  quantity: number;
  batsNotes: string;
}

export type BrickStateMap = Record<string, BrickState>;

export function initBrickState(): BrickStateMap {
  const state: BrickStateMap = {};
  for (const bt of BRICK_TYPES) {
    state[bt] = { selected: false, quantity: 0, batsNotes: "" };
  }
  return state;
}

export function getTotalBricks(brickState: BrickStateMap): number {
  let total = 0;
  for (const [brickType, state] of Object.entries(brickState)) {
    if (brickType !== "Bats" && state.selected) {
      total += state.quantity;
    }
  }
  return total;
}

interface BrickSelectorProps {
  brickState: BrickStateMap;
  onChange: (state: BrickStateMap) => void;
}

export default function BrickSelector({
  brickState,
  onChange,
}: BrickSelectorProps) {
  const toggleBrick = (brickType: string) => {
    const current = brickState[brickType];
    onChange({
      ...brickState,
      [brickType]: { ...current, selected: !current.selected },
    });
  };

  const setQuantity = (brickType: string, qty: number) => {
    onChange({
      ...brickState,
      [brickType]: { ...brickState[brickType], quantity: qty },
    });
  };

  const setBatsNotes = (notes: string) => {
    onChange({
      ...brickState,
      Bats: { ...brickState.Bats, batsNotes: notes },
    });
  };

  const totalBricks = getTotalBricks(brickState);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        Brick Types
      </h3>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-2 gap-3" data-ocid="brick.selection.panel">
        {BRICK_TYPES.map((brickType) => {
          const state = brickState[brickType];
          const isBats = brickType === "Bats";
          const ocid = `brick.${brickType
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "")}.toggle`;

          return (
            <div key={brickType} className="flex flex-col gap-2">
              {/* Brick Type Button Card */}
              <button
                type="button"
                onClick={() => toggleBrick(brickType)}
                data-ocid={ocid}
                className={`w-full py-3 px-2 rounded-2xl text-sm font-semibold border-2 transition-all active:scale-95 shadow-sm text-center ${
                  state.selected
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white text-primary border-orange-200 hover:border-primary"
                }`}
              >
                {brickType}
              </button>

              {/* Quantity input below the button (non-Bats) */}
              {state.selected && !isBats && (
                <div className="bg-orange-50 rounded-xl px-3 py-2 border border-orange-200">
                  <Input
                    type="number"
                    min={0}
                    value={state.quantity || ""}
                    onChange={(e) =>
                      setQuantity(
                        brickType,
                        Number.parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="Qty"
                    className="w-full text-center font-bold border-orange-300 focus:border-primary"
                    data-ocid="brick.qty.input"
                  />
                </div>
              )}

              {/* Safety Notes below Bats button */}
              {state.selected && isBats && (
                <div className="bg-orange-50 rounded-xl px-3 py-2 border border-orange-200 space-y-1">
                  <span className="text-xs font-semibold text-primary block">
                    Safety Notes
                  </span>
                  <Textarea
                    placeholder="Enter safety notes..."
                    value={state.batsNotes}
                    onChange={(e) => setBatsNotes(e.target.value)}
                    className="resize-none border-orange-300 focus:border-primary text-sm"
                    rows={2}
                    data-ocid="brick.bats.textarea"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Bricks */}
      <div className="bg-primary rounded-xl px-4 py-3 flex items-center justify-between mt-2">
        <span className="font-semibold text-white">Total Bricks</span>
        <span className="text-xl font-bold text-white">
          {totalBricks.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
