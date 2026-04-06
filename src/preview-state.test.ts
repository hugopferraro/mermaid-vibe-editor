import { describe, expect, it } from "vitest";
import {
  errorState,
  formatErrorStatus,
  formatSuccessStatus,
  successState
} from "./preview-state";

describe("preview state helpers", () => {
  it("creates a success state", () => {
    const timestamp = "2026-04-06T13:30:00.000Z";
    const state = successState(timestamp);

    expect(state).toEqual({
      statusLine: formatSuccessStatus(timestamp),
      errorMessage: null
    });
  });

  it("creates an error state", () => {
    const timestamp = "2026-04-06T13:30:00.000Z";
    const state = errorState("Parse error", timestamp);

    expect(state).toEqual({
      statusLine: formatErrorStatus(timestamp),
      errorMessage: "Parse error"
    });
  });
});
