import mermaid from "mermaid";
import "./style.css";
import {
  DIAGRAM_ERROR_EVENT,
  DIAGRAM_UPDATE_EVENT,
  type DiagramErrorEvent,
  type DiagramSnapshot,
  type DiagramUpdateEvent
} from "../shared/diagram-events";

const output = mustElement("diagram-output");
const viewport = mustElement("diagram-viewport");
const errorPanel = mustElement("error-panel");

const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const MIN_POSITIVE_SCALE = 0.000001;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragPointerId: number | null = null;
let lastDragX = 0;
let lastDragY = 0;

mermaid.initialize({ startOnLoad: false });

function mustElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing required element #${id}`);
  }
  return element;
}

function showError(message: string): void {
  errorPanel.textContent = message;
  errorPanel.classList.remove("hidden");
}

function clearError(): void {
  errorPanel.textContent = "";
  errorPanel.classList.add("hidden");
}

function applyTransform(): void {
  output.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function zoomAtPoint(nextScale: number, anchorX: number, anchorY: number): void {
  const clamped = Math.max(MIN_POSITIVE_SCALE, nextScale);
  const worldX = (anchorX - offsetX) / scale;
  const worldY = (anchorY - offsetY) / scale;

  scale = clamped;
  offsetX = anchorX - worldX * scale;
  offsetY = anchorY - worldY * scale;
  applyTransform();
}

function setupControls(): void {
  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const anchorX = event.clientX - bounds.left;
      const anchorY = event.clientY - bounds.top;
      const zoomFactor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);
      zoomAtPoint(scale * zoomFactor, anchorX, anchorY);
    },
    { passive: false }
  );

  viewport.addEventListener("dblclick", () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    applyTransform();
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    dragPointerId = event.pointerId;
    lastDragX = event.clientX;
    lastDragY = event.clientY;
    viewport.classList.add("dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - lastDragX;
    const deltaY = event.clientY - lastDragY;
    lastDragX = event.clientX;
    lastDragY = event.clientY;

    offsetX += deltaX;
    offsetY += deltaY;
    applyTransform();
  });

  const stopDrag = (event: PointerEvent) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    dragPointerId = null;
    viewport.classList.remove("dragging");
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  };

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
}

async function renderDiagram(event: DiagramUpdateEvent): Promise<void> {
  try {
    const renderId = `diagram-preview-${Date.now()}`;
    const { svg } = await mermaid.render(renderId, event.source);
    output.innerHTML = svg;
    if (scale === 1 && offsetX === 0 && offsetY === 0) {
      const viewportBounds = viewport.getBoundingClientRect();
      const diagramBounds = output.getBoundingClientRect();
      const centerOffsetX = (viewportBounds.width - diagramBounds.width) / 2;
      const centerOffsetY = (viewportBounds.height - diagramBounds.height) / 2;
      offsetX = Number.isFinite(centerOffsetX) ? centerOffsetX : 0;
      offsetY = Number.isFinite(centerOffsetY) ? centerOffsetY : 0;
    }
    applyTransform();
    clearError();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to render Mermaid source.";
    showError(message);
  }
}

function applyReadError(event: DiagramErrorEvent): void {
  showError(event.message);
}

async function loadInitialSnapshot(): Promise<void> {
  const response = await fetch("/__diagram-source");
  const snapshot = (await response.json()) as DiagramSnapshot;

  if (snapshot.kind === "update") {
    await renderDiagram(snapshot.payload);
    return;
  }

  applyReadError(snapshot.payload);
}

if (import.meta.hot) {
  import.meta.hot.on(DIAGRAM_UPDATE_EVENT, (event: DiagramUpdateEvent) => {
    void renderDiagram(event);
  });

  import.meta.hot.on(DIAGRAM_ERROR_EVENT, (event: DiagramErrorEvent) => {
    applyReadError(event);
  });
}

setupControls();
applyTransform();
void loadInitialSnapshot();
