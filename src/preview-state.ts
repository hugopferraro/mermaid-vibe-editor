export interface PreviewState {
  statusLine: string;
  errorMessage: string | null;
}

export function formatSuccessStatus(updatedAt: string): string {
  return `Rendered successfully at ${updatedAt}`;
}

export function formatErrorStatus(updatedAt: string): string {
  return `Waiting for valid diagram source (last update ${updatedAt})`;
}

export function successState(updatedAt: string): PreviewState {
  return {
    statusLine: formatSuccessStatus(updatedAt),
    errorMessage: null
  };
}

export function errorState(message: string, updatedAt: string): PreviewState {
  return {
    statusLine: formatErrorStatus(updatedAt),
    errorMessage: message
  };
}
