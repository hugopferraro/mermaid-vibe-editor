import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect } from "vite";
import { defineConfig } from "vitest/config";
import {
  DIAGRAM_ERROR_EVENT,
  DIAGRAM_UPDATE_EVENT,
  type DiagramErrorEvent,
  type DiagramSnapshot,
  type DiagramUpdateEvent
} from "./shared/diagram-events";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const diagramPath = path.resolve(__dirname, "diagram.mermaid");

async function readSnapshot(): Promise<DiagramSnapshot> {
  const updatedAt = new Date().toISOString();

  try {
    const source = await fs.readFile(diagramPath, "utf8");
    const payload: DiagramUpdateEvent = {
      path: "diagram.mermaid",
      source,
      updatedAt
    };
    return { kind: "update", payload };
  } catch (error) {
    const missing = isMissingFileError(error);
    const payload: DiagramErrorEvent = {
      path: "diagram.mermaid",
      message: missing
        ? "diagram.mermaid is missing. Create it at the project root to start rendering."
        : asMessage(error),
      missing,
      updatedAt
    };
    return { kind: "error", payload };
  }
}

function asMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Unable to read diagram.mermaid";
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function createSnapshotHandler() {
  let snapshot: DiagramSnapshot | null = null;

  return {
    get: () => snapshot,
    refresh: async () => {
      snapshot = await readSnapshot();
      return snapshot;
    }
  };
}

export default defineConfig({
  plugins: [
    {
      name: "diagram-watch",
      configureServer(server) {
        const snapshots = createSnapshotHandler();

        const sendSnapshot = async () => {
          const next = await snapshots.refresh();
          if (next.kind === "update") {
            server.ws.send({
              type: "custom",
              event: DIAGRAM_UPDATE_EVENT,
              data: next.payload
            });
            return;
          }

          server.ws.send({
            type: "custom",
            event: DIAGRAM_ERROR_EVENT,
            data: next.payload
          });
        };

        const diagramAbsolutePath = diagramPath;
        const normalizePath = (target: string) => path.resolve(target);

        const isDiagramPath = (target: string) =>
          normalizePath(target) === diagramAbsolutePath;

        server.watcher.add(diagramAbsolutePath);
        server.watcher.on("add", (target) => {
          if (isDiagramPath(target)) {
            void sendSnapshot();
          }
        });
        server.watcher.on("change", (target) => {
          if (isDiagramPath(target)) {
            void sendSnapshot();
          }
        });
        server.watcher.on("unlink", (target) => {
          if (isDiagramPath(target)) {
            void sendSnapshot();
          }
        });

        server.ws.on("connection", () => {
          void sendSnapshot();
        });

        server.middlewares.use(((req, res, next) => {
          if (req.url !== "/__diagram-source") {
            next();
            return;
          }

          const current = snapshots.get();
          const send = (body: string) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(body);
          };

          if (current !== null) {
            send(JSON.stringify(current));
            return;
          }

          snapshots
            .refresh()
            .then((initial) => send(JSON.stringify(initial)))
            .catch((error) => {
              const fallback: DiagramSnapshot = {
                kind: "error",
                payload: {
                  path: "diagram.mermaid",
                  message: asMessage(error),
                  missing: false,
                  updatedAt: new Date().toISOString()
                }
              };
              send(JSON.stringify(fallback));
            });
        }) as Connect.NextHandleFunction);
      }
    }
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"]
  }
});
