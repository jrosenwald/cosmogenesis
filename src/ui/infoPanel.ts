import { getSymbolById } from "../symbols/registry";
import type { ConstructibleSymbol } from "../symbols/types";

interface InfoPanelOptions {
  onSelect: (id: string) => void;
}

export class InfoPanel {
  readonly element: HTMLElement;
  private readonly title: HTMLElement;
  private readonly category: HTMLElement;
  private readonly description: HTMLElement;
  private readonly basis: HTMLElement;
  private readonly prerequisites: HTMLElement;
  private readonly related: HTMLElement;
  private readonly mode: HTMLElement;
  private readonly onSelect: (id: string) => void;

  constructor(options: InfoPanelOptions) {
    this.onSelect = options.onSelect;
    this.element = document.createElement("aside");
    this.element.className = "info-panel";

    this.category = document.createElement("div");
    this.category.className = "info-kicker";

    this.title = document.createElement("h1");
    this.description = document.createElement("p");
    this.basis = document.createElement("p");
    this.prerequisites = document.createElement("div");
    this.prerequisites.className = "link-row";
    this.related = document.createElement("div");
    this.related.className = "link-row";
    this.mode = document.createElement("div");
    this.mode.className = "mode-readout";

    this.element.append(
      this.category,
      this.title,
      this.description,
      this.basis,
      this.createLabeledBlock("Prerequisites", this.prerequisites),
      this.createLabeledBlock("Related", this.related),
      this.mode,
    );
  }

  update(
    symbol: ConstructibleSymbol,
    mode: "construct" | "inspect",
    geometryMode: "circles" | "spheres",
  ): void {
    this.category.textContent = symbol.category;
    this.title.textContent = symbol.label;
    this.description.textContent = symbol.description;
    this.basis.textContent = symbol.constructionBasis;
    this.mode.textContent = `Mode: ${
      mode === "construct" ? "Construct" : "Inspect"
    } / ${geometryMode === "circles" ? "2D circles" : "3D spheres"}${
      symbol.geometryModes?.length === 1 && symbol.geometryModes[0] === "spheres"
        ? " / 3D only"
        : ""
    }`;
    this.setLinks(this.prerequisites, symbol.prerequisites);
    this.setLinks(this.related, symbol.related);
  }

  private createLabeledBlock(label: string, content: HTMLElement): HTMLElement {
    const block = document.createElement("div");
    block.className = "info-block";

    const heading = document.createElement("span");
    heading.textContent = label;

    block.append(heading, content);

    return block;
  }

  private setLinks(container: HTMLElement, ids: string[]): void {
    container.replaceChildren();

    if (ids.length === 0) {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "None";
      container.append(empty);
      return;
    }

    for (const id of ids) {
      const symbol = getSymbolById(id);
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = symbol.label;
      button.addEventListener("click", () => this.onSelect(id));
      container.append(button);
    }
  }
}
