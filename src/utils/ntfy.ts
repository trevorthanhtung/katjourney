/**
 * Simple ntfy.sh wrapper for KAT Journey
 * ntfy.sh is an open-source pub-sub notification service.
 */

const NTFY_BASE_URL = "https://ntfy.sh";

/**
 * Subscribe to a ntfy.sh topic using EventSource.
 * @param topic The unique topic name (e.g., 'kat_journey_xyz')
 * @param onMessage Callback when a message is received
 * @returns An EventSource instance that can be closed
 */
export function subscribeToNtfy(topic: string, onMessage: (msg: any) => void): EventSource {
  const url = `${NTFY_BASE_URL}/${topic}/sse`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.event === "message") {
        onMessage(data);
      }
    } catch (err) {
      console.error("[ntfy] Failed to parse message:", err);
    }
  };

  eventSource.onerror = (e) => {
    console.error("[ntfy] EventSource error:", e);
  };

  return eventSource;
}

/**
 * Publish a message to a ntfy.sh topic
 * @param topic The topic to publish to
 * @param title The notification title
 * @param message The notification body
 * @param options Additional ntfy options (tags, delay, priority)
 */
export async function publishToNtfy(
  topic: string,
  title: string,
  message: string,
  options?: { tags?: string[]; delay?: string; priority?: number }
) {
  const headers: Record<string, string> = {
    Title: title,
  };

  if (options?.tags && options.tags.length > 0) {
    headers["Tags"] = options.tags.join(",");
  }
  if (options?.delay) {
    headers["Delay"] = options.delay;
  }
  if (options?.priority) {
    headers["Priority"] = options.priority.toString();
  }

  try {
    const res = await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: "POST",
      body: message,
      headers,
    });

    if (!res.ok) {
      console.error("[ntfy] Failed to publish message:", await res.text());
    }
  } catch (err) {
    console.error("[ntfy] Network error while publishing:", err);
  }
}
