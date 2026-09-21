/** Pull a user-facing message out of an axios/Nest error without inventing copy. */
export function getApiErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) {
    return String(message[0]);
  }
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (error?.response?.status === 401) {
    return fallback;
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
