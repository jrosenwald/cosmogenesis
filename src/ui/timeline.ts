import { getTimelineSymbols } from "../symbols/registry";

interface TimelineOptions {
  onSelect: (id: string) => void;
}

export class Timeline {
  readonly element: HTMLElement;
  private readonly itemMap = new Map<string, HTMLElement>();

  constructor(options: TimelineOptions) {
    this.element = document.createElement("nav");
    this.element.className = "timeline";
    this.element.setAttribute("aria-label", "Construction timeline");

    const symbols = getTimelineSymbols();

    for (const symbol of symbols) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-item";
      button.title = symbol.label;
      button.addEventListener("click", () => options.onSelect(symbol.id));

      const dot = document.createElement("span");
      dot.className = "timeline-dot";

      const label = document.createElement("span");
      label.textContent = symbol.label;

      if (symbol.geometryModes?.length === 1 && symbol.geometryModes[0] === "spheres") {
        const badge = document.createElement("em");
        badge.textContent = "3D";
        label.append(badge);
      }

      button.append(dot, label);
      this.itemMap.set(symbol.id, button);
      this.element.append(button);
    }
  }

  updateActive(activeId: string): void {
    for (const [id, element] of this.itemMap) {
      element.classList.toggle("is-active", id === activeId);
      element.setAttribute("aria-current", id === activeId ? "step" : "false");
    }
  }
}
