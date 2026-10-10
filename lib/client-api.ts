export async function readApiResponse<T>(response: Response): Promise<T> {
  let body: string;

  try {
    body = await response.text();
  } catch {
    throw new Error("Could not read the server response. Check your connection and try again.");
  }

  if (!body.trim()) {
    throw new Error(
      response.ok
        ? "The server returned an empty response. Please try again."
        : `The server returned no details (HTTP ${response.status}). Please try again.`
    );
  }

  let data: T;

  try {
    data = JSON.parse(body) as T;
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}). Please refresh and try again.`
    );
  }

  if (!response.ok) {
    const error =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed (HTTP ${response.status}). Please try again.`;

    throw new Error(error);
  }

  return data;
}
