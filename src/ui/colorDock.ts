import type { RenderOptions } from "../symbols/types";

interface ColorDockOptions {
  options: RenderOptions;
  onChange: () => void;
}

type ColorOption = "faceColor" | "lineColor" | "sphereColor";

const colorControls: { key: ColorOption; label: string }[] = [
  { key: "faceColor", label: "Faces" },
  { key: "lineColor", label: "Lines" },
  { key: "sphereColor", label: "Spheres" },
];

export class ColorDock {
  readonly element: HTMLElement;

  constructor(options: ColorDockOptions) {
    this.element = document.createElement("section");
    this.element.className = "color-dock";
    this.element.setAttribute("aria-label", "3D color controls");

    for (const control of colorControls) {
      const label = document.createElement("label");
      label.className = "color-swatch";

      const input = document.createElement("input");
      input.type = "color";
      input.value = options.options[control.key];
      input.addEventListener("input", () => {
        options.options[control.key] = input.value;
        options.onChange();
      });

      const text = document.createElement("span");
      text.textContent = control.label;

      label.append(input, text);
      this.element.append(label);
    }
  }

  updateVisibility(visible: boolean): void {
    this.element.classList.toggle("is-visible", visible);
    this.element.setAttribute("aria-hidden", visible ? "false" : "true");
  }
}
