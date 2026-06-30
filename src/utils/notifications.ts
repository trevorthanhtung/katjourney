import i18n from "../i18n";
import { db, EventItem } from "../db";

// Store notified event IDs to prevent duplicate alerts
const NOTIFIED_KEY = "kat_journey_notified_events";

function getNotifiedEvents(): number[] {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function addNotifiedEvent(id: number) {
  const list = getNotifiedEvents();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(list));
  }
}

export function startNotificationService() {
  console.log("[NotificationService] Started polling...");

  setInterval(async () => {
    // 1. Check if notifications are enabled
    const settingsStr = localStorage.getItem("kat_settings");
    if (!settingsStr) return;

    try {
      const settings = JSON.parse(settingsStr);
      if (!settings.notifications) return;
    } catch {
      return;
    }

    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    // 2. Fetch today's events
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();

    try {
      const todayEvents = await db.events.where("date").equals(todayStr).toArray();

      const validEvents = todayEvents.filter(
        (e: EventItem) => !e.isDeleted && !e.completed && e.time
      );
      const notifiedList = getNotifiedEvents();

      validEvents.forEach((event: EventItem) => {
        if (!event.id || !event.time) return;
        if (notifiedList.includes(event.id)) return;

        // Parse event time
        const [hh, mm] = event.time.split(":").map(Number);
        const eventTime = new Date();
        eventTime.setHours(hh, mm, 0, 0);

        const diffMinutes = (eventTime.getTime() - now.getTime()) / (1000 * 60);

        // If event is coming up in the next 30 minutes, or just passed (within 10 mins)
        if (diffMinutes <= 30 && diffMinutes >= -10) {
          const notif = new Notification(
            i18n.t("notifications.upcomingTitle", { title: event.title }),
            {
              body: i18n.t("notifications.upcomingBody", {
                time: event.time,
                location: event.location || i18n.t("notifications.unknownLocation"),
              }),
              icon: "/asset/icon-192.png",
            }
          );

          notif.onclick = () => {
            window.focus();
            notif.close();
          };

          addNotifiedEvent(event.id);
        }
      });
    } catch (err) {
      console.error("[NotificationService] Error checking events:", err);
    }
  }, 60 * 1000); // Check every minute
}
