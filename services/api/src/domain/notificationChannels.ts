/** Notification channels. in_app is first-class (the notifications table is
 * the in-app surface); email is the production external seam (adapter-only). */
export const NOTIFICATION_CHANNELS = ["in_app", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export function isNotificationChannel(v: unknown): v is NotificationChannel {
  return typeof v === "string" && (NOTIFICATION_CHANNELS as readonly string[]).includes(v);
}
