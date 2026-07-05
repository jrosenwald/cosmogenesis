import type { RenderOptions } from "../symbols/types";

type BooleanRenderOption = {
  [Key in keyof RenderOptions]: RenderOptions[Key] extends boolean ? Key : never;
}[keyof RenderOptions];

interface ControlsOptions {
  options: RenderOptions;
  mode: "construct" | "inspect";
  geometryMode: RenderOptions["geometryMode"];
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onModeChange: (mode: "construct" | "inspect") => void;
  onGeometryModeChange: (mode: RenderOptions["geometryMode"]) => void;
  onOptionsChange: () => void;
}

export class Controls {
  readonly element: HTMLElement;
  private readonly constructButton: HTMLButtonElement;
  private readonly inspectButton: HTMLButtonElement;
  private readonly circlesButton: HTMLButtonElement;
  private readonly spheresButton: HTMLButtonElement;
  private readonly options: RenderOptions;
  private readonly onOptionsChange: () => void;

  constructor(options: ControlsOptions) {
    this.options = options.options;
    this.onOptionsChange = options.onOptionsChange;
    this.element = document.createElement("section");
    this.element.className = "control-panel";

    const navRow = document.createElement("div");
    navRow.className = "button-row";
    navRow.append(
      this.createButton("Previous", options.onPrevious),
      this.createButton("Next", options.onNext),
      this.createButton("Reset", options.onReset),
    );

    const modeRow = document.createElement("div");
    modeRow.className = "segmented";
    this.constructButton = this.createButton("Construct", () =>
      options.onModeChange("construct"),
    );
    this.inspectButton = this.createButton("Inspect", () =>
      options.onModeChange("inspect"),
    );
    modeRow.append(this.constructButton, this.inspectButton);

    const geometryRow = document.createElement("div");
    geometryRow.className = "segmented";
    this.circlesButton = this.createButton("2D Circles", () =>
      options.onGeometryModeChange("circles"),
    );
    this.spheresButton = this.createButton("3D Spheres", () =>
      options.onGeometryModeChange("spheres"),
    );
    geometryRow.append(this.circlesButton, this.spheresButton);

    const toggleGrid = document.createElement("div");
    toggleGrid.className = "toggle-grid";
    toggleGrid.append(
      this.createToggle("Labels", "showLabels"),
      this.createToggle("Circles", "showConstructionCircles"),
      this.createToggle("Points", "showLatticePoints"),
      this.createToggle("Connect centers", "connectCenters"),
      this.createToggle("Animation", "animation"),
      this.createToggle("Auto rotate", "autoRotate3d"),
    );

    this.element.append(navRow, modeRow, geometryRow, toggleGrid);
    this.updateMode(options.mode);
    this.updateGeometryMode(options.geometryMode);
  }

  updateMode(mode: "construct" | "inspect"): void {
    this.constructButton.classList.toggle("is-active", mode === "construct");
    this.inspectButton.classList.toggle("is-active", mode === "inspect");
  }

  updateGeometryMode(mode: RenderOptions["geometryMode"]): void {
    this.circlesButton.classList.toggle("is-active", mode === "circles");
    this.spheresButton.classList.toggle("is-active", mode === "spheres");
  }

  private createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);

    return button;
  }

  private createToggle(
    label: string,
    key: BooleanRenderOption,
  ): HTMLLabelElement {
    const wrapper = document.createElement("label");
    wrapper.className = "toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.options[key];
    input.addEventListener("change", () => {
      this.options[key] = input.checked;
      this.onOptionsChange();
    });

    const text = document.createElement("span");
    text.textContent = label;

    wrapper.append(input, text);

    return wrapper;
  }
}
