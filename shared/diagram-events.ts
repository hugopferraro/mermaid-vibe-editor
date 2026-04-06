export const DIAGRAM_UPDATE_EVENT = "diagram:update";
export const DIAGRAM_ERROR_EVENT = "diagram:error";

export interface DiagramUpdateEvent {
  path: string;
  source: string;
  updatedAt: string;
}

export interface DiagramErrorEvent {
  path: string;
  message: string;
  missing: boolean;
  updatedAt: string;
}

export type DiagramSnapshot =
  | { kind: "update"; payload: DiagramUpdateEvent }
  | { kind: "error"; payload: DiagramErrorEvent };
