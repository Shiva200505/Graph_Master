const notifications: Array<{
  type: string;
  to: string;
  message: string;
  timestamp: string;
}> = [];

export function addDevNotification(notification: typeof notifications[0]) {
  notifications.push(notification);
  if (notifications.length > 50) notifications.shift();
}

export function getDevNotifications() {
  return [...notifications].reverse();
}
