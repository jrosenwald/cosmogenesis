import {
  applyScreenSpace,
  applyWorldSpace,
  createDefaultCamera,
  resizeCanvasToDisplaySize,
  zoomCameraAtPoint,
  type Camera,
  type CanvasMetrics,
} from "./render/canvas";
import { clearCanvas } from "./render/drawing";
import { ThreeScene, type ThreeViewState } from "./render/threeScene";
import { generateHexLattice, generateHexRing, getSeedOfLifeCenters, getTripodOfLifeCenters } from "./geometry/lattice";
import type { Point } from "./geometry/vector";
import type { RenderOptions, SymbolRenderState } from "./symbols/types";

type AppMode = "3d" | "2d";
type FlowerStepId =
  | "flower"
  | "fruit"
  | "metatron"
  | "tetrahedron"
  | "cube"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "star-tetrahedron";
type MatrixDisplayOption =
  | "showMatrixWireframe"
  | "showMatrixFaces"
  | "showMatrixNodes"
  | "showMatrixSpheres"
  | "showMatrixProjection";

interface WorkbenchSymbol {
  id: string;
  label: string;
  description: string;
  note: string;
}

const symbols3d: WorkbenchSymbol[] = [
  {
    id: "sphere",
    label: "Sphere",
    description: "A single sphere: the 3D analogue of the first circle.",
    note: "One center point and one radius define the field.",
  },
  {
    id: "vesica-3d",
    label: "Vesica Piscis",
    description: "Two equal spheres whose centers lie on each other's surface.",
    note: "Center spacing equals sphere radius.",
  },
  {
    id: "tripod-3d",
    label: "Tripod",
    description: "Three equal spheres with centers forming an equilateral triangle.",
    note: "The centerpoint geometry is a triangle.",
  },
  {
    id: "tetra-spheres",
    label: "Tetrahedral Spheres",
    description: "Four equal spheres whose centers form a regular tetrahedron.",
    note: "Connect centerpoints to reveal the six tetrahedron edges.",
  },
  {
    id: "star-tetra-3d",
    label: "Star Tetrahedron",
    description: "Eight tetrahedral modules around an octahedral core, shown with circumscribing spheres.",
    note: "Connect centerpoints to show the two interpenetrating tetrahedral edge sets.",
  },
  {
    id: "vector-equilibrium-3d",
    label: "Vector Equilibrium",
    description: "Twelve spheres packed around a cuboctahedral center network: Buckminster Fuller's Vector Equilibrium.",
    note: "At 100% sphere size, neighboring spheres are tangent. Use Jitterbug to spiral the center network toward an octahedral double-cover.",
  },
  {
    id: "flower-3d",
    label: "3D Flower of Life",
    description: "A planar Flower-of-Life sphere field on a hexagonal lattice.",
    note: "This is one 3D sphere layer, not stacked staggered layers.",
  },
  {
    id: "tetra-matrix-64-3d",
    label: "64 Tetrahedron Grid",
    description: "A finite 3D tetrahedral-octahedral lattice cluster made from 64 tetrahedral cells.",
    note: "The flower-like image is a projection or sphere overlay of this 3D structure, not a flat circle construction.",
  },
  {
    id: "aether-3d",
    label: "The Aether",
    description: "An immersive 16 x 16 x 16 field of 4096 spheres extending the side-oriented 64-grid reading.",
    note: "Drag rotates the field, Shift-drag pans, scroll moves through depth, and Connect centerpoints reveals local neighbor links.",
  },
];

const symbols2d: WorkbenchSymbol[] = [
  {
    id: "circle",
    label: "Circle",
    description: "A single radius swept around one center.",
    note: "The 2D starting point for the circle constructions.",
  },
  {
    id: "vesica-piscis",
    label: "Vesica Piscis",
    description: "Two equal circles whose centers lie on each other's circumference.",
    note: "Center spacing equals circle radius.",
  },
  {
    id: "tripod-of-life",
    label: "Tripod",
    description: "Three equal circles in triangular relation.",
    note: "The centerpoint geometry is an equilateral triangle.",
  },
  {
    id: "seed-of-life",
    label: "Seed of Life",
    description: "A center circle surrounded by six equal circles.",
    note: "Generated from the first ring of the hexagonal circle lattice.",
  },
  {
    id: "flower-of-life",
    label: "Flower of Life",
    description: "A larger hexagonal field of equal circles.",
    note: "Selecting this opens the Flower to Metatron contextual workflow.",
  },
];

const flowerSteps: { id: FlowerStepId; label: string; description: string; note: string }[] = [
  {
    id: "flower",
    label: "Flower of Life",
    description: "The full center flower lattice of overlapping circles.",
    note: "Adjacent centerpoints form the underlying hexagonal graph.",
  },
  {
    id: "fruit",
    label: "Fruit of Life",
    description: "Thirteen selected circles inside the Flower of Life.",
    note: "The Fruit centers become the node set for Metatron's Cube.",
  },
  {
    id: "metatron",
    label: "Metatron's Cube",
    description: "The Fruit of Life centerpoints connected into a complete line system.",
    note: "This is the 2D network used for symbolic solid projections.",
  },
  {
    id: "tetrahedron",
    label: "Tetrahedron",
    description: "A symbolic tetrahedron overlay inside Metatron's Cube.",
    note: "Shown as triangular projected edges in the Metatron center network.",
  },
  {
    id: "cube",
    label: "Cube / Hexahedron",
    description: "A cube-like projection derived from the hexagonal Metatron network.",
    note: "Shown as a hexagon with internal projected cube edges.",
  },
  {
    id: "octahedron",
    label: "Octahedron",
    description: "A diamond-like octahedral projection inside Metatron's Cube.",
    note: "Shown as six projected vertices connected by all non-opposite octahedral edges.",
  },
  {
    id: "dodecahedron",
    label: "Dodecahedron",
    description: "A symbolic dodecahedral overlay within the Metatron network.",
    note: "Shown as a denser projected polygonal path.",
  },
  {
    id: "icosahedron",
    label: "Icosahedron",
    description: "A symbolic icosahedral overlay within the Metatron network.",
    note: "Shown as interlocking triangular paths.",
  },
  {
    id: "star-tetrahedron",
    label: "Star Tetrahedron",
    description: "The 2D star-tetrahedron projection over Metatron's Cube.",
    note: "Shown as opposing tetrahedral triangle projections.",
  },
];

const planarFlower3dSteps: FlowerStepId[] = [
  "flower",
  "fruit",
  "metatron",
  "tetrahedron",
  "cube",
  "octahedron",
  "star-tetrahedron",
];
const unsupportedPlanarFlower3dSteps = new Set<FlowerStepId>(["dodecahedron", "icosahedron"]);
const isPlanarFlower3dStepSupported = (step: FlowerStepId): boolean =>
  !unsupportedPlanarFlower3dSteps.has(step);

const standard3dViewDefaults = {
  sphereScale: 1,
  sphereOpacity: 0.13,
  sphereGridOpacity: 0.24,
};
const aether3dViewDefaults = {
  sphereScale: 1.45,
  sphereOpacity: 0.11,
  sphereGridOpacity: 0.21,
};

const matrixDisplayOptions: { key: MatrixDisplayOption; label: string }[] = [
  { key: "showMatrixWireframe", label: "Wireframe" },
  { key: "showMatrixFaces", label: "Faces" },
  { key: "showMatrixNodes", label: "Nodes" },
  { key: "showMatrixSpheres", label: "Spheres" },
  { key: "showMatrixProjection", label: "Projection" },
];

export class CosmogenesisApp {
  private readonly root: HTMLElement;
  private readonly webglCanvas: HTMLCanvasElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly threeScene: ThreeScene;
  private readonly sidebar: HTMLElement;
  private readonly symbolGrid: HTMLElement;
  private readonly slideshowControls: HTMLElement;
  private readonly previousSlideButton: HTMLButtonElement;
  private readonly playPauseButton: HTMLButtonElement;
  private readonly nextSlideButton: HTMLButtonElement;
  private readonly infoPanel: HTMLElement;
  private readonly controlsPanel: HTMLElement;
  private readonly reorientButton: HTMLButtonElement;
  private readonly connectButton: HTMLButtonElement;
  private readonly sphereSizeControl: HTMLElement;
  private readonly sphereSizeInput: HTMLInputElement;
  private readonly lineOpacityInput: HTMLInputElement;
  private readonly sphereFieldOpacityInput: HTMLInputElement;
  private readonly sphereGridOpacityInput: HTMLInputElement;
  private readonly sphereSizeReadout: HTMLElement;
  private readonly lineOpacityReadout: HTMLElement;
  private readonly sphereFieldOpacityReadout: HTMLElement;
  private readonly sphereGridOpacityReadout: HTMLElement;
  private readonly flowerStepper: HTMLElement;
  private readonly matrixControls: HTMLElement;
  private readonly jitterbugControls: HTMLElement;
  private readonly jitterbugPlayButton: HTMLButtonElement;
  private readonly jitterbugSlider: HTMLInputElement;
  private readonly jitterbugReadout: HTMLElement;
  private readonly modeButtons = new Map<AppMode, HTMLButtonElement>();
  private readonly symbolButtons = new Map<string, HTMLButtonElement>();
  private readonly stepButtons = new Map<FlowerStepId, HTMLButtonElement>();
  private readonly matrixDisplayButtons = new Map<MatrixDisplayOption, HTMLButtonElement>();
  private activeMode: AppMode = "3d";
  private active3dId = "sphere";
  private active2dId = "circle";
  private activeFlowerStep: FlowerStepId = "flower";
  private jitterbugProgress = 0;
  private jitterbugPlaying = false;
  private jitterbugDirection = 1;
  private lastJitterbugTime = 0;
  private connectCenters = true;
  private slideshowPlaying = false;
  private readonly slideshowIntervalMs = 3000;
  private lastSlideTime = 0;
  private metrics: CanvasMetrics = { width: 1, height: 1, dpr: 1 };
  private camera: Camera = createDefaultCamera();
  private readonly threeView: ThreeViewState = {
    yaw: -0.62,
    pitch: -0.72,
    zoom: 1,
    panX: 0,
    panY: 0,
  };
  private readonly options: RenderOptions = {
    geometryMode: "spheres",
    faceColor: "#70e1ff",
    lineColor: "#f4cc70",
    lineOpacity: 0.45,
    sphereColor: "#70e1ff",
    sphereScale: standard3dViewDefaults.sphereScale,
    sphereOpacity: standard3dViewDefaults.sphereOpacity,
    sphereGridOpacity: standard3dViewDefaults.sphereGridOpacity,
    showMatrixWireframe: true,
    showMatrixFaces: false,
    showMatrixNodes: true,
    showMatrixSpheres: true,
    showMatrixProjection: false,
    showLabels: false,
    showConstructionCircles: false,
    showLatticePoints: false,
    connectCenters: true,
    animation: false,
    autoRotate3d: false,
  };
  private isDragging = false;
  private lastPointer: Point = { x: 0, y: 0 };

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.className = "cosmogenesis simplified";

    this.webglCanvas = document.createElement("canvas");
    this.webglCanvas.className = "webgl-canvas is-visible";
    this.webglCanvas.setAttribute("aria-hidden", "true");
    this.threeScene = new ThreeScene(this.webglCanvas);

    this.canvas = document.createElement("canvas");
    this.canvas.className = "main-canvas is-transparent";
    this.canvas.setAttribute("aria-label", "Cosmogenesis canvas");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is not available.");
    }
    this.ctx = ctx;

    this.sidebar = this.createSidebar();
    this.slideshowControls = document.createElement("div");
    this.slideshowControls.className = "slideshow-controls";
    this.slideshowControls.setAttribute("aria-label", "3D timeline controls");

    this.previousSlideButton = this.createSlideshowButton("Back", () => this.goToPrevious3dSymbol());
    this.playPauseButton = this.createSlideshowButton("Play", () => {
      this.slideshowPlaying = !this.slideshowPlaying;
      this.lastSlideTime = performance.now();
      this.updateUI();
    });
    this.nextSlideButton = this.createSlideshowButton("Forward", () => this.goToNext3dSymbol());
    this.slideshowControls.append(this.previousSlideButton, this.playPauseButton, this.nextSlideButton);
    this.sidebar.append(this.slideshowControls);

    this.symbolGrid = document.createElement("div");
    this.symbolGrid.className = "mode-symbol-grid";
    this.sidebar.append(this.symbolGrid);

    this.controlsPanel = document.createElement("section");
    this.controlsPanel.className = "floating-controls-panel";
    this.controlsPanel.setAttribute("aria-label", "Rendering controls");

    this.reorientButton = document.createElement("button");
    this.reorientButton.type = "button";
    this.reorientButton.className = "panel-action-button";
    this.reorientButton.textContent = "Re-orient";
    this.reorientButton.addEventListener("click", () => this.resetView());

    this.connectButton = document.createElement("button");
    this.connectButton.type = "button";
    this.connectButton.className = "panel-action-button connect-center-button connect-toggle";
    this.connectButton.textContent = "Connect centerpoints";
    this.connectButton.setAttribute("aria-pressed", "true");
    this.connectButton.addEventListener("click", () => {
      this.connectCenters = !this.connectCenters;
      this.options.connectCenters = this.connectCenters;
      this.updateUI();
    });

    this.lineOpacityReadout = document.createElement("span");
    this.lineOpacityReadout.className = "sphere-size-readout";
    this.lineOpacityInput = document.createElement("input");
    this.lineOpacityInput.type = "range";
    this.lineOpacityInput.min = "0";
    this.lineOpacityInput.max = "1";
    this.lineOpacityInput.step = "0.01";
    this.lineOpacityInput.value = String(this.options.lineOpacity);
    this.lineOpacityInput.addEventListener("input", () => {
      this.options.lineOpacity = Number.parseFloat(this.lineOpacityInput.value);
      this.updateUI();
    });

    const lineOpacityControl = document.createElement("label");
    lineOpacityControl.className = "sphere-size-control is-visible";
    lineOpacityControl.append("Line opacity", this.lineOpacityInput, this.lineOpacityReadout);

    this.sphereSizeReadout = document.createElement("span");
    this.sphereSizeReadout.className = "sphere-size-readout";

    this.sphereSizeInput = document.createElement("input");
    this.sphereSizeInput.type = "range";
    this.sphereSizeInput.min = "0.55";
    this.sphereSizeInput.max = "1.5";
    this.sphereSizeInput.step = "0.01";
    this.sphereSizeInput.value = String(this.options.sphereScale);
    this.sphereSizeInput.addEventListener("input", () => {
      this.options.sphereScale = Number.parseFloat(this.sphereSizeInput.value);
      this.updateUI();
    });

    this.sphereSizeControl = document.createElement("label");
    this.sphereSizeControl.className = "sphere-size-control";
    this.sphereSizeControl.append("Sphere size", this.sphereSizeInput, this.sphereSizeReadout);

    this.sphereFieldOpacityReadout = document.createElement("span");
    this.sphereFieldOpacityReadout.className = "sphere-size-readout";
    this.sphereFieldOpacityInput = document.createElement("input");
    this.sphereFieldOpacityInput.type = "range";
    this.sphereFieldOpacityInput.min = "0";
    this.sphereFieldOpacityInput.max = "1";
    this.sphereFieldOpacityInput.step = "0.01";
    this.sphereFieldOpacityInput.value = String(this.options.sphereOpacity);
    this.sphereFieldOpacityInput.addEventListener("input", () => {
      this.options.sphereOpacity = Number.parseFloat(this.sphereFieldOpacityInput.value);
      this.updateUI();
    });

    const sphereFieldOpacityControl = document.createElement("label");
    sphereFieldOpacityControl.className = "sphere-size-control sphere-opacity-control";
    sphereFieldOpacityControl.append("Field opacity", this.sphereFieldOpacityInput, this.sphereFieldOpacityReadout);

    this.sphereGridOpacityReadout = document.createElement("span");
    this.sphereGridOpacityReadout.className = "sphere-size-readout";
    this.sphereGridOpacityInput = document.createElement("input");
    this.sphereGridOpacityInput.type = "range";
    this.sphereGridOpacityInput.min = "0";
    this.sphereGridOpacityInput.max = "1";
    this.sphereGridOpacityInput.step = "0.01";
    this.sphereGridOpacityInput.value = String(this.options.sphereGridOpacity);
    this.sphereGridOpacityInput.addEventListener("input", () => {
      this.options.sphereGridOpacity = Number.parseFloat(this.sphereGridOpacityInput.value);
      this.updateUI();
    });

    const sphereGridOpacityControl = document.createElement("label");
    sphereGridOpacityControl.className = "sphere-size-control sphere-opacity-control";
    sphereGridOpacityControl.append("Grid opacity", this.sphereGridOpacityInput, this.sphereGridOpacityReadout);

    const colorGrid = document.createElement("div");
    colorGrid.className = "panel-color-grid";
    colorGrid.append(
      this.createColorControl("Fields", "sphereColor"),
      this.createColorControl("Lines", "lineColor"),
    );

    this.controlsPanel.append(
      this.reorientButton,
      this.connectButton,
      lineOpacityControl,
      this.sphereSizeControl,
      sphereFieldOpacityControl,
      sphereGridOpacityControl,
      colorGrid,
    );

    this.flowerStepper = document.createElement("div");
    this.flowerStepper.className = "flower-stepper";
    this.flowerStepper.setAttribute("aria-label", "Flower of Life workflow");
    for (const step of flowerSteps) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = step.label;
      button.addEventListener("click", () => {
        if (
          this.activeMode === "3d" &&
          this.active3dId === "flower-3d" &&
          !isPlanarFlower3dStepSupported(step.id)
        ) {
          return;
        }
        this.activeFlowerStep = step.id;
        this.lastSlideTime = performance.now();
        this.updateUI();
      });
      this.stepButtons.set(step.id, button);
      this.flowerStepper.append(button);
    }

    this.matrixControls = document.createElement("div");
    this.matrixControls.className = "matrix-display-controls";
    this.matrixControls.setAttribute("aria-label", "64 Tetrahedron Grid display modes");
    for (const option of matrixDisplayOptions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", () => {
        this.options[option.key] = !this.options[option.key];
        this.updateUI();
      });
      this.matrixDisplayButtons.set(option.key, button);
      this.matrixControls.append(button);
    }

    this.jitterbugControls = document.createElement("div");
    this.jitterbugControls.className = "jitterbug-controls";
    this.jitterbugControls.setAttribute("aria-label", "Vector Equilibrium jitterbug controls");

    this.jitterbugPlayButton = document.createElement("button");
    this.jitterbugPlayButton.type = "button";
    this.jitterbugPlayButton.textContent = "Jitterbug";
    this.jitterbugPlayButton.addEventListener("click", () => {
      this.jitterbugPlaying = !this.jitterbugPlaying;
      this.lastJitterbugTime = performance.now();
      this.updateUI();
    });

    this.jitterbugSlider = document.createElement("input");
    this.jitterbugSlider.type = "range";
    this.jitterbugSlider.min = "0";
    this.jitterbugSlider.max = "1";
    this.jitterbugSlider.step = "0.01";
    this.jitterbugSlider.value = String(this.jitterbugProgress);
    this.jitterbugSlider.addEventListener("input", () => {
      this.jitterbugPlaying = false;
      this.jitterbugProgress = Number.parseFloat(this.jitterbugSlider.value);
      this.updateUI();
    });

    this.jitterbugReadout = document.createElement("span");
    this.jitterbugReadout.className = "jitterbug-readout";

    this.jitterbugControls.append(
      this.jitterbugPlayButton,
      this.jitterbugSlider,
      this.jitterbugReadout,
    );

    this.infoPanel = document.createElement("aside");
    this.infoPanel.className = "info-panel";

    this.root.append(
      this.webglCanvas,
      this.canvas,
      this.sidebar,
      this.controlsPanel,
      this.flowerStepper,
      this.matrixControls,
      this.jitterbugControls,
      this.infoPanel,
    );

    this.bindCanvasEvents();
    this.bindKeyboardEvents();
    this.renderSymbolGrid();
    this.updateUI();
    requestAnimationFrame((time) => this.tick(time));
  }

  private createSidebar(): HTMLElement {
    const sidebar = document.createElement("aside");
    sidebar.className = "left-rail simplified-rail";

    const brand = document.createElement("header");
    brand.className = "brand";
    brand.innerHTML = "<span>Cosmogenesis</span><strong>Geometry Atlas</strong>";

    const modeTabs = document.createElement("div");
    modeTabs.className = "mode-tabs";
    for (const mode of ["3d", "2d"] as AppMode[]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = mode.toUpperCase();
      button.addEventListener("click", () => {
        this.activeMode = mode;
        this.options.geometryMode = mode === "3d" ? "spheres" : "circles";
        if (
          mode === "3d" &&
          this.active3dId === "flower-3d" &&
          !isPlanarFlower3dStepSupported(this.activeFlowerStep)
        ) {
          this.activeFlowerStep = "flower";
        }
        this.renderSymbolGrid();
        this.updateUI();
      });
      this.modeButtons.set(mode, button);
      modeTabs.append(button);
    }

    sidebar.append(brand, modeTabs);
    return sidebar;
  }

  private createColorControl(
    labelText: string,
    optionKey: "sphereColor" | "lineColor",
  ): HTMLLabelElement {
    const label = document.createElement("label");
    label.className = "panel-color-control";

    const text = document.createElement("span");
    text.textContent = labelText;

    const input = document.createElement("input");
    input.type = "color";
    input.value = this.options[optionKey];
    input.addEventListener("input", () => {
      this.options[optionKey] = input.value;
      this.updateUI();
    });

    label.append(text, input);

    return label;
  }

  private renderSymbolGrid(): void {
    this.symbolGrid.replaceChildren();
    this.symbolButtons.clear();
    const symbols = this.activeMode === "3d" ? symbols3d : symbols2d;

    for (const symbol of symbols) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-symbol";
      button.textContent = symbol.label;
      button.addEventListener("click", () => {
        if (this.activeMode === "3d") {
          this.setActive3dSymbol(symbol.id, true);
        } else {
          this.active2dId = symbol.id;
          if (symbol.id === "flower-of-life") {
            this.activeFlowerStep = "flower";
          }
        }
        this.updateUI();
      });
      this.symbolButtons.set(symbol.id, button);
      this.symbolGrid.append(button);
    }
  }

  private tick(time: number): void {
    this.updateSlideshow(time);
    this.updateJitterbug(time);
    this.metrics = resizeCanvasToDisplaySize(this.canvas);
    applyScreenSpace(this.ctx, this.metrics);
    clearCanvas(this.ctx, this.metrics.width, this.metrics.height);

    this.canvas.classList.toggle("is-transparent", this.activeMode === "3d");
    this.webglCanvas.classList.toggle("is-visible", this.activeMode === "3d");

    if (this.activeMode === "3d") {
      this.threeScene.render(
        this.active3dId,
        this.createRenderState(time),
        this.threeView,
        this.metrics,
        this.activeFlowerStep,
        this.jitterbugProgress,
      );
    } else {
      this.draw2d();
    }

    requestAnimationFrame((nextTime) => this.tick(nextTime));
  }

  private createRenderState(time: number): SymbolRenderState {
    return {
      baseRadius: 105,
      time,
      progress: 1,
      mode: "construct",
      camera: this.camera,
      options: this.options,
    };
  }

  private updateUI(): void {
    this.modeButtons.forEach((button, mode) => {
      button.classList.toggle("is-active", mode === this.activeMode);
    });

    this.symbolButtons.forEach((button, id) => {
      button.classList.toggle(
        "is-active",
        id === (this.activeMode === "3d" ? this.active3dId : this.active2dId),
      );
    });

    this.symbolGrid.classList.toggle("is-timeline", this.activeMode === "3d");
    this.slideshowControls.classList.toggle("is-visible", this.activeMode === "3d");
    this.playPauseButton.textContent = this.slideshowPlaying ? "Pause" : "Play";
    this.playPauseButton.classList.toggle("is-active", this.slideshowPlaying);
    this.connectButton.classList.toggle("is-active", this.connectCenters);
    this.connectButton.setAttribute("aria-pressed", this.connectCenters ? "true" : "false");
    this.sphereSizeControl.classList.toggle("is-visible", this.activeMode === "3d");
    this.controlsPanel
      .querySelectorAll<HTMLElement>(".sphere-opacity-control")
      .forEach((control) => control.classList.toggle("is-visible", this.activeMode === "3d"));
    this.lineOpacityInput.value = String(this.options.lineOpacity);
    this.sphereSizeInput.value = String(this.options.sphereScale);
    this.sphereFieldOpacityInput.value = String(this.options.sphereOpacity);
    this.sphereGridOpacityInput.value = String(this.options.sphereGridOpacity);
    this.sphereSizeReadout.textContent = `${Math.round(this.options.sphereScale * 100)}%`;
    this.lineOpacityReadout.textContent = `${Math.round(this.options.lineOpacity * 100)}%`;
    this.sphereFieldOpacityReadout.textContent = `${Math.round(this.options.sphereOpacity * 100)}%`;
    this.sphereGridOpacityReadout.textContent = `${Math.round(this.options.sphereGridOpacity * 100)}%`;
    const showFlowerStepper =
      (this.activeMode === "2d" && this.active2dId === "flower-of-life") ||
      (this.activeMode === "3d" && this.active3dId === "flower-3d");
    if (
      this.activeMode === "3d" &&
      this.active3dId === "flower-3d" &&
      !isPlanarFlower3dStepSupported(this.activeFlowerStep)
    ) {
      this.activeFlowerStep = "flower";
    }
    this.flowerStepper.classList.toggle("is-visible", showFlowerStepper);
    this.stepButtons.forEach((button, id) => {
      const disabled =
        this.activeMode === "3d" &&
        this.active3dId === "flower-3d" &&
        !isPlanarFlower3dStepSupported(id);
      button.classList.toggle("is-active", id === this.activeFlowerStep);
      button.disabled = disabled;
      button.title = disabled
        ? "Deferred for this planar 3D layer; use the 2D Flower workflow for this symbolic projection."
        : "";
    });
    this.matrixControls.classList.toggle(
      "is-visible",
      this.activeMode === "3d" && this.active3dId === "tetra-matrix-64-3d",
    );
    this.matrixDisplayButtons.forEach((button, key) => {
      button.classList.toggle("is-active", this.options[key]);
      button.setAttribute("aria-pressed", this.options[key] ? "true" : "false");
    });
    const showJitterbugControls =
      this.activeMode === "3d" && this.active3dId === "vector-equilibrium-3d";
    this.jitterbugControls.classList.toggle("is-visible", showJitterbugControls);
    this.jitterbugPlayButton.classList.toggle("is-active", this.jitterbugPlaying);
    this.jitterbugPlayButton.textContent = this.jitterbugPlaying ? "Pause" : "Jitterbug";
    this.jitterbugSlider.value = String(this.jitterbugProgress);
    this.jitterbugReadout.textContent = `${Math.round(this.jitterbugProgress * 100)}%`;
    this.updateInfoPanel();
  }

  private updateInfoPanel(): void {
    const symbol =
      this.activeMode === "3d"
        ? symbols3d.find((item) => item.id === this.active3dId)
        : symbols2d.find((item) => item.id === this.active2dId);
    const flowerStep =
      ((this.activeMode === "2d" && this.active2dId === "flower-of-life") ||
        (this.activeMode === "3d" && this.active3dId === "flower-3d"))
        ? flowerSteps.find((step) => step.id === this.activeFlowerStep)
        : undefined;
    const title = flowerStep?.label ?? symbol?.label ?? "";
    const paragraphs =
      this.activeMode === "3d" && this.active3dId === "vector-equilibrium-3d"
        ? this.getVectorEquilibriumInfoParagraphs()
        : [
            flowerStep?.description ?? symbol?.description ?? "",
            flowerStep?.note ?? symbol?.note ?? "",
          ];

    this.infoPanel.innerHTML = `
      <div class="info-kicker">${this.activeMode === "3d" ? "3D Construction" : "2D Construction"}</div>
      <h1>${title}</h1>
      ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      <div class="mode-readout">${this.connectCenters ? "Centerpoints connected" : "Centerpoints hidden"}</div>
    `;
  }

  private getVectorEquilibriumInfoParagraphs(): string[] {
    return [
      "The Vector Equilibrium is Buckminster Fuller's name for the cuboctahedral balance point where every center-to-center radius and every outer edge are equal.",
      "Fuller used this geometry in Synergetics as part of a 60-degree, tetrahedral way of describing nature's structural coordination. He treated triangulated systems, geodesic spheres, and tetrahedral-octahedral frameworks as clues to how forces distribute themselves efficiently.",
      "The Jitterbug control animates Fuller's transformation: the twelve vertices spiral inward while the moving edge skeleton contracts toward six paired octahedral positions.",
      "Fuller speculated in geometric language about fields and forces, including gravity, as patterns of tensional-compressional relationship. This view is not standard physics, but it is central to the way he connected geodesic, omnitriangulated structures with nature's organizing principles.",
    ];
  }

  private draw2d(): void {
    const state = this.createRenderState(performance.now());
    const radius = state.baseRadius;
    applyWorldSpace(this.ctx, this.metrics, this.camera);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    if (this.active2dId === "flower-of-life") {
      this.drawFlowerWorkflow(radius);
      return;
    }

    const centers = this.get2dCenters(this.active2dId, radius);
    this.drawCircleSet(centers, radius);

    if (this.connectCenters) {
      this.draw2dEdges(this.get2dCenterEdges(this.active2dId, centers, radius));
    }
  }

  private drawFlowerWorkflow(radius: number): void {
    if (this.activeFlowerStep === "flower") {
      const centers = generateHexLattice(radius, 2);
      this.drawCircleSet(centers, radius);
      if (this.connectCenters) {
        this.draw2dEdges(getAdjacentEdges(centers, radius));
      }
      return;
    }

    const fruitCenters = getFruitCenters(radius);
    this.drawCircleSet(fruitCenters, radius, 0.36);

    if (this.activeFlowerStep === "fruit") {
      if (this.connectCenters) {
        this.draw2dEdges(getAdjacentEdges(fruitCenters, radius * 2));
      }
      return;
    }

    const metatronEdges = getCompleteEdges(fruitCenters);
    this.draw2dEdges(metatronEdges, this.withAlpha(this.options.sphereColor, 0.22), 0.65);

    if (this.activeFlowerStep === "metatron") {
      this.draw2dEdges(metatronEdges, this.withAlpha(this.options.lineColor, 0.55 * this.options.lineOpacity), 0.72);
      return;
    }

    this.drawPlatonicOverlay(this.activeFlowerStep, fruitCenters);
  }

  private drawCircleSet(centers: Point[], radius: number, alpha = 0.72): void {
    for (const center of centers) {
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = this.withAlpha(this.options.sphereColor, 0.78);
      this.ctx.lineWidth = Math.max(0.9, 1.2 / this.camera.scale);
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    for (const center of centers) {
      this.draw2dPoint(center);
    }
  }

  private draw2dEdges(
    edges: [Point, Point][],
    stroke = this.withAlpha(this.options.lineColor, 0.92 * this.options.lineOpacity),
    width = 2.4,
  ): void {
    this.ctx.save();
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = Math.max(1.2, width / this.camera.scale);
    this.ctx.beginPath();
    for (const [from, to] of edges) {
      this.ctx.moveTo(from.x, from.y);
      this.ctx.lineTo(to.x, to.y);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  private draw2dPoint(point: Point): void {
    this.ctx.save();
    this.ctx.fillStyle = this.withAlpha(this.options.lineColor, 0.96 * this.options.lineOpacity);
    this.ctx.shadowColor = this.withAlpha(this.options.lineColor, 0.74 * this.options.lineOpacity);
    this.ctx.shadowBlur = 8 / this.camera.scale;
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, Math.max(1.8, 2.7 / this.camera.scale), 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawPlatonicOverlay(step: FlowerStepId, centers: Point[]): void {
    const ring = centers.slice(1);
    const edgesByStep: Record<string, [Point, Point][]> = {
      tetrahedron: [
        [ring[0], ring[4]],
        [ring[4], ring[8]],
        [ring[8], ring[0]],
        [ring[2], ring[6]],
        [ring[6], ring[10]],
        [ring[10], ring[2]],
      ],
      cube: [
        ...ring.map((point, index) => [point, ring[(index + 2) % ring.length]] as [Point, Point]),
      ],
      octahedron: getProjectedOctahedronEdges(ring),
      dodecahedron: ring.map((point, index) => [point, ring[(index + 5) % ring.length]] as [Point, Point]),
      icosahedron: ring.flatMap((point, index) => [
        [point, ring[(index + 3) % ring.length]] as [Point, Point],
        [point, ring[(index + 4) % ring.length]] as [Point, Point],
      ]),
      "star-tetrahedron": [
        [ring[0], ring[4]],
        [ring[4], ring[8]],
        [ring[8], ring[0]],
        [ring[2], ring[6]],
        [ring[6], ring[10]],
        [ring[10], ring[2]],
      ],
    };

    this.draw2dEdges(edgesByStep[step] ?? [], this.withAlpha(this.options.lineColor, 0.96 * this.options.lineOpacity), 3.2);
  }

  private withAlpha(hex: string, alpha: number): string {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);

    if (normalized.length !== 6 || Number.isNaN(value)) {
      return hex;
    }

    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  private get2dCenters(symbolId: string, radius: number): Point[] {
    if (symbolId === "circle") {
      return [{ x: 0, y: 0 }];
    }
    if (symbolId === "vesica-piscis") {
      return [
        { x: -radius / 2, y: 0 },
        { x: radius / 2, y: 0 },
      ];
    }
    if (symbolId === "tripod-of-life") {
      return getTripodOfLifeCenters(radius);
    }
    if (symbolId === "seed-of-life") {
      return getSeedOfLifeCenters(radius);
    }
    return generateHexLattice(radius, 2);
  }

  private get2dCenterEdges(symbolId: string, centers: Point[], radius: number): [Point, Point][] {
    if (symbolId === "vesica-piscis") {
      return [[centers[0], centers[1]]];
    }
    if (symbolId === "tripod-of-life") {
      return [
        [centers[0], centers[1]],
        [centers[1], centers[2]],
        [centers[2], centers[0]],
      ];
    }
    if (symbolId === "seed-of-life") {
      const center = centers[0];
      const ring = centers.slice(1);
      return [
        ...ring.map((point) => [center, point] as [Point, Point]),
        ...ring.map((point, index) => [point, ring[(index + 1) % ring.length]] as [Point, Point]),
      ];
    }
    if (symbolId === "flower-of-life") {
      return getAdjacentEdges(centers, radius);
    }
    return [];
  }

  private bindCanvasEvents(): void {
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const screenPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const zoomFactor = event.deltaY < 0 ? 1.09 : 0.92;

      if (this.activeMode === "3d") {
        this.threeView.zoom = Math.min(3.5, Math.max(0.45, this.threeView.zoom * zoomFactor));
      } else {
        this.camera = zoomCameraAtPoint(this.camera, this.metrics, screenPoint, zoomFactor);
      }
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.isDragging = true;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.isDragging) {
        return;
      }
      const dx = event.clientX - this.lastPointer.x;
      const dy = event.clientY - this.lastPointer.y;

      if (this.activeMode === "3d") {
        if (this.active3dId === "aether-3d" && event.shiftKey) {
          this.threeView.panX = Math.max(-760, Math.min(760, this.threeView.panX - dx * 2.2));
          this.threeView.panY = Math.max(-760, Math.min(760, this.threeView.panY + dy * 2.2));
        } else {
          this.threeView.yaw += dx * 0.008;
          this.threeView.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.threeView.pitch + dy * 0.008));
        }
      } else {
        this.camera = {
          ...this.camera,
          offsetX: this.camera.offsetX + dx,
          offsetY: this.camera.offsetY + dy,
        };
      }
      this.lastPointer = { x: event.clientX, y: event.clientY };
    });

    const stopDragging = (event: PointerEvent): void => {
      this.isDragging = false;
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    };
    this.canvas.addEventListener("pointerup", stopDragging);
    this.canvas.addEventListener("pointercancel", stopDragging);
    this.canvas.addEventListener("dblclick", () => this.resetView());
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  private bindKeyboardEvents(): void {
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "r") {
        this.resetView();
      }
    });
  }

  private resetView(): void {
    this.camera = createDefaultCamera();
    this.threeView.yaw = -0.62;
    this.threeView.pitch = -0.72;
    this.threeView.zoom = 1;
    this.threeView.panX = 0;
    this.threeView.panY = 0;
  }

  private createSlideshowButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);

    return button;
  }

  private apply3dViewDefaults(symbolId: string): void {
    const defaults = symbolId === "aether-3d" ? aether3dViewDefaults : standard3dViewDefaults;
    this.options.sphereScale = defaults.sphereScale;
    this.options.sphereOpacity = defaults.sphereOpacity;
    this.options.sphereGridOpacity = defaults.sphereGridOpacity;
  }

  private setActive3dSymbol(id: string, pauseSlideshow: boolean): void {
    this.active3dId = id;
    this.apply3dViewDefaults(id);
    if (id !== "vector-equilibrium-3d") {
      this.jitterbugPlaying = false;
      this.jitterbugProgress = 0;
      this.lastJitterbugTime = 0;
    }
    if (id === "tetra-matrix-64-3d") {
      this.options.showMatrixSpheres = true;
    }
    if (id === "flower-3d") {
      this.activeFlowerStep = "flower";
    }
    if (pauseSlideshow) {
      this.slideshowPlaying = false;
    }
    this.lastSlideTime = performance.now();
    this.updateUI();
  }

  private goToPrevious3dSymbol(): void {
    if (this.active3dId === "flower-3d") {
      const currentStepIndex = planarFlower3dSteps.indexOf(this.activeFlowerStep);
      if (currentStepIndex > 0) {
        this.activeFlowerStep = planarFlower3dSteps[currentStepIndex - 1];
        this.lastSlideTime = performance.now();
        this.updateUI();
        return;
      }
    }

    const currentIndex = symbols3d.findIndex((symbol) => symbol.id === this.active3dId);
    const nextIndex = (currentIndex - 1 + symbols3d.length) % symbols3d.length;
    this.setActive3dSymbol(symbols3d[nextIndex].id, false);
    if (this.active3dId === "flower-3d") {
      this.activeFlowerStep = planarFlower3dSteps[planarFlower3dSteps.length - 1];
      this.updateUI();
    }
  }

  private goToNext3dSymbol(): void {
    if (this.active3dId === "flower-3d") {
      const currentStepIndex = planarFlower3dSteps.indexOf(this.activeFlowerStep);
      if (currentStepIndex >= 0 && currentStepIndex < planarFlower3dSteps.length - 1) {
        this.activeFlowerStep = planarFlower3dSteps[currentStepIndex + 1];
        this.lastSlideTime = performance.now();
        this.updateUI();
        return;
      }
    }

    const currentIndex = symbols3d.findIndex((symbol) => symbol.id === this.active3dId);
    const nextIndex = (currentIndex + 1) % symbols3d.length;
    this.setActive3dSymbol(symbols3d[nextIndex].id, false);
  }

  private updateSlideshow(time: number): void {
    if (this.activeMode !== "3d") {
      if (this.slideshowPlaying) {
        this.slideshowPlaying = false;
        this.updateUI();
      }
      return;
    }

    if (!this.slideshowPlaying) {
      return;
    }

    if (this.lastSlideTime === 0) {
      this.lastSlideTime = time;
      return;
    }

    if (time - this.lastSlideTime >= this.slideshowIntervalMs) {
      this.goToNext3dSymbol();
      this.lastSlideTime = time;
    }
  }

  private updateJitterbug(time: number): void {
    if (
      this.activeMode !== "3d" ||
      this.active3dId !== "vector-equilibrium-3d" ||
      !this.jitterbugPlaying
    ) {
      this.lastJitterbugTime = time;
      return;
    }

    const delta = Math.min(80, Math.max(0, time - this.lastJitterbugTime));
    this.lastJitterbugTime = time;
    this.jitterbugProgress += delta * 0.00034 * this.jitterbugDirection;

    if (this.jitterbugProgress >= 1) {
      this.jitterbugProgress = 1;
      this.jitterbugDirection = -1;
    } else if (this.jitterbugProgress <= 0) {
      this.jitterbugProgress = 0;
      this.jitterbugDirection = 1;
    }

    this.jitterbugSlider.value = String(this.jitterbugProgress);
    this.jitterbugReadout.textContent = `${Math.round(this.jitterbugProgress * 100)}%`;
    this.updateInfoPanel();
  }
}

const getFruitCenters = (radius: number): Point[] => [
  { x: 0, y: 0 },
  ...generateHexRing(radius, 2),
];

const getAdjacentEdges = (centers: Point[], spacing: number): [Point, Point][] => {
  const edges: [Point, Point][] = [];

  for (let i = 0; i < centers.length; i += 1) {
    for (let j = i + 1; j < centers.length; j += 1) {
      const distance = Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y);
      if (Math.abs(distance - spacing) < spacing * 0.08) {
        edges.push([centers[i], centers[j]]);
      }
    }
  }

  return edges;
};

const getCompleteEdges = (centers: Point[]): [Point, Point][] => {
  const edges: [Point, Point][] = [];

  for (let i = 0; i < centers.length; i += 1) {
    for (let j = i + 1; j < centers.length; j += 1) {
      edges.push([centers[i], centers[j]]);
    }
  }

  return edges;
};

const getProjectedOctahedronEdges = (ring: Point[]): [Point, Point][] => {
  const vertices = ring.filter((_, index) => index % 2 === 0);
  const edges: [Point, Point][] = [];

  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const separation = (j - i + vertices.length) % vertices.length;
      const isOppositePair = separation === vertices.length / 2;

      if (!isOppositePair) {
        edges.push([vertices[i], vertices[j]]);
      }
    }
  }

  return edges;
};
