var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { DIAGRAM_ERROR_EVENT, DIAGRAM_UPDATE_EVENT } from "./shared/diagram-events";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var diagramPath = path.resolve(__dirname, "diagram.mermaid");
function readSnapshot() {
    return __awaiter(this, void 0, void 0, function () {
        var updatedAt, source, payload, error_1, missing, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updatedAt = new Date().toISOString();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.readFile(diagramPath, "utf8")];
                case 2:
                    source = _a.sent();
                    payload = {
                        path: "diagram.mermaid",
                        source: source,
                        updatedAt: updatedAt
                    };
                    return [2 /*return*/, { kind: "update", payload: payload }];
                case 3:
                    error_1 = _a.sent();
                    missing = isMissingFileError(error_1);
                    payload = {
                        path: "diagram.mermaid",
                        message: missing
                            ? "diagram.mermaid is missing. Create it at the project root to start rendering."
                            : asMessage(error_1),
                        missing: missing,
                        updatedAt: updatedAt
                    };
                    return [2 /*return*/, { kind: "error", payload: payload }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function asMessage(error) {
    if (error instanceof Error && error.message.length > 0) {
        return error.message;
    }
    return "Unable to read diagram.mermaid";
}
function isMissingFileError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
function createSnapshotHandler() {
    var _this = this;
    var snapshot = null;
    return {
        get: function () { return snapshot; },
        refresh: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, readSnapshot()];
                    case 1:
                        snapshot = _a.sent();
                        return [2 /*return*/, snapshot];
                }
            });
        }); }
    };
}
export default defineConfig({
    plugins: [
        {
            name: "diagram-watch",
            configureServer: function (server) {
                var _this = this;
                var snapshots = createSnapshotHandler();
                var sendSnapshot = function () { return __awaiter(_this, void 0, void 0, function () {
                    var next;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, snapshots.refresh()];
                            case 1:
                                next = _a.sent();
                                if (next.kind === "update") {
                                    server.ws.send({
                                        type: "custom",
                                        event: DIAGRAM_UPDATE_EVENT,
                                        data: next.payload
                                    });
                                    return [2 /*return*/];
                                }
                                server.ws.send({
                                    type: "custom",
                                    event: DIAGRAM_ERROR_EVENT,
                                    data: next.payload
                                });
                                return [2 /*return*/];
                        }
                    });
                }); };
                var diagramAbsolutePath = diagramPath;
                var normalizePath = function (target) { return path.resolve(target); };
                var isDiagramPath = function (target) {
                    return normalizePath(target) === diagramAbsolutePath;
                };
                server.watcher.add(diagramAbsolutePath);
                server.watcher.on("add", function (target) {
                    if (isDiagramPath(target)) {
                        void sendSnapshot();
                    }
                });
                server.watcher.on("change", function (target) {
                    if (isDiagramPath(target)) {
                        void sendSnapshot();
                    }
                });
                server.watcher.on("unlink", function (target) {
                    if (isDiagramPath(target)) {
                        void sendSnapshot();
                    }
                });
                server.ws.on("connection", function () {
                    void sendSnapshot();
                });
                server.middlewares.use((function (req, res, next) {
                    if (req.url !== "/__diagram-source") {
                        next();
                        return;
                    }
                    var current = snapshots.get();
                    var send = function (body) {
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
                        .then(function (initial) { return send(JSON.stringify(initial)); })
                        .catch(function (error) {
                        var fallback = {
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
                }));
            }
        }
    ],
    test: {
        environment: "jsdom",
        include: ["src/**/*.test.ts"]
    }
});
