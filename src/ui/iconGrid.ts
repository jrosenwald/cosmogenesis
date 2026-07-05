import type { ConstructibleSymbol, SymbolRenderState } from "../symbols/types";
import { getSymbolsByCategory } from "../symbols/registry";

interface IconGridOptions {
  state: SymbolRenderState;
  onSelect: (id: string) => void;
}

export class IconGrid {
  readonly element: HTMLElement;
  private readonly itemMap = new Map<string, HTMLElement>();

  constructor(options: IconGridOptions) {
    this.element = document.createElement("section");
    this.element.className = "atlas-panel";
    this.element.setAttribute("aria-label", "Symbol atlas");

    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Atlas";
    this.element.append(title);

    for (const [category, symbols] of getSymbolsByCategory()) {
      const group = document.createElement("div");
      group.className = "atlas-group";

      const heading = document.createElement("h2");
      heading.textContent = category;
      group.append(heading);

      const grid = document.createElement("div");
      grid.className = "icon-grid";

      for (const symbol of symbols) {
        const item = this.createItem(symbol, options);
        this.itemMap.set(symbol.id, item);
        grid.append(item);
      }

      group.append(grid);
      this.element.append(group);
    }
  }

  updateActive(activeId: string): void {
    for (const [id, item] of this.itemMap) {
      item.classList.toggle("is-active", id === activeId);
      item.setAttribute("aria-pressed", id === activeId ? "true" : "false");
    }
  }

  private createItem(
    symbol: ConstructibleSymbol,
    options: IconGridOptions,
  ): HTMLElement {
    const button = document.createElement("button");
    button.className = "icon-item";
    button.classList.toggle(
      "is-3d-only",
      symbol.geometryModes?.length === 1 && symbol.geometryModes[0] === "spheres",
    );
    button.type = "button";
    button.title = symbol.label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => options.onSelect(symbol.id));

    const canvas = document.createElement("canvas");
    canvas.width = 72 * window.devicePixelRatio;
    canvas.height = 72 * window.devicePixelRatio;
    canvas.style.width = "72px";
    canvas.style.height = "72px";

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      symbol.drawIcon(
        ctx,
        { x: 7, y: 7, width: 58, height: 58 },
        options.state,
      );
    }

    const label = document.createElement("span");
    label.textContent = symbol.label;

    if (symbol.geometryModes?.length === 1 && symbol.geometryModes[0] === "spheres") {
      const badge = document.createElement("em");
      badge.textContent = "3D";
      label.append(badge);
    }

    button.append(canvas, label);

    return button;
  }
}
