/**
 * Resilient HTTP Fetch Utility with Exponential Backoff, Jitter, Timeout, and 429 Handling
 */
export async function resilientFetch(
  url: string,
  options: RequestInit & { maxRetries?: number; timeoutMs?: number } = {}
): Promise<Response | null> {
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 10000;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Return immediately on HTTP 2xx success or permanent non-retryable 4xx client errors (400, 401, 403, 404)
      if (response.ok || (response.status >= 400 && response.status < 429)) {
        return response;
      }

      // Handle Rate Limiting (429) or Server Errors (502, 503, 504) with backoff
      if (response.status === 429 || response.status >= 500) {
        const retryAfterHeader = response.headers.get("Retry-After");
        let backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 8000);
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed) && parsed > 0) {
            // If parsed > 1000, header was sent in milliseconds; otherwise in seconds
            const delayMs = parsed > 1000 ? parsed : parsed * 1000;
            backoffMs = Math.min(delayMs, 10000); // Cap at 10 seconds max
          }
        }

        console.warn(
          `[ResilientFetch] Attempt ${attempt}/${maxRetries} failed with status ${response.status} for ${url}. Retrying in ${Math.round(backoffMs)}ms...`
        );

        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, backoffMs));
          continue;
        }
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      console.warn(`[ResilientFetch] Network error/timeout on attempt ${attempt}/${maxRetries} for ${url}: ${err.message}`);

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 8000);
        await new Promise((res) => setTimeout(res, backoffMs));
      } else {
        return null;
      }
    }
  }

  return null;
}
