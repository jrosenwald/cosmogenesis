import { lifePatternSymbols } from "./lifePatterns";
import { polyhedronSymbols } from "./polyhedra";
import { primitiveSymbols } from "./primitives";
import { spatialPatternSymbols } from "./spatialPatterns";
import type { ConstructibleSymbol, SymbolCategory } from "./types";

export const symbolRegistry: ConstructibleSymbol[] = [
  ...primitiveSymbols,
  ...lifePatternSymbols,
  ...polyhedronSymbols,
  ...spatialPatternSymbols,
];

export const categoryOrder: SymbolCategory[] = [
  "Origins / primitives",
  "Circle constructions",
  "Life patterns",
  "Lattice patterns",
  "Metatron / line systems",
  "Platonic solids",
  "Optional symbolic overlays",
];

export const getSymbolById = (id: string): ConstructibleSymbol => {
  const symbol = symbolRegistry.find((item) => item.id === id);

  if (!symbol) {
    throw new Error(`Unknown symbol id: ${id}`);
  }

  return symbol;
};

export const getTimelineSymbols = (): ConstructibleSymbol[] =>
  symbolRegistry
    .filter((symbol) => typeof symbol.timelineIndex === "number")
    .sort((a, b) => Number(a.timelineIndex) - Number(b.timelineIndex));

export const getSymbolsByCategory = (): Map<SymbolCategory, ConstructibleSymbol[]> => {
  const grouped = new Map<SymbolCategory, ConstructibleSymbol[]>();

  for (const category of categoryOrder) {
    const symbols = symbolRegistry.filter((symbol) => symbol.category === category);

    if (symbols.length > 0) {
      grouped.set(category, symbols);
    }
  }

  return grouped;
};
