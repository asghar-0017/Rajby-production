import cron from "node-cron";

export const subscriptionState = {
  isSuspended: false,
  showWarning: false,
  daysLeft: 0,
  endDateFormatted: "",
  suspendMessage: "System Suspended. Please contact support or renew your subscription."
};

export function checkSubscription() {
  try {
    const endDateStr = process.env.SUBSCRIPTION_END_DATE || "2026-12-31";
    const isActive = process.env.IS_ACTIVE !== "false";
    const suspendMessage = process.env.LOGIN_SUSPEND_MESSAGE || "System Suspended. Please contact support or renew your subscription.";

    const parts = endDateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const day = parseInt(parts[2], 10);

      // Expiry is at 11:59:59.999 PM of the end date
      const expiryDate = new Date(year, month, day, 23, 59, 59, 999);
      const today = new Date();

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = months[month] || "Dec";
      const dayFormatted = day < 10 ? `0${day}` : day;
      const endDateFormatted = `${monthName} ${dayFormatted}, ${year} at 11:59 PM`;

      // Calculate daysLeft based on start of dates
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfExpiry = new Date(year, month, day);
      const diffTime = startOfExpiry.getTime() - startOfToday.getTime();
      const daysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

      const isSuspended = !isActive || (today.getTime() > expiryDate.getTime());
      const showWarning = !isSuspended && (daysLeft <= 15);

      subscriptionState.isSuspended = isSuspended;
      subscriptionState.showWarning = showWarning;
      subscriptionState.daysLeft = daysLeft;
      subscriptionState.endDateFormatted = endDateFormatted;
      subscriptionState.suspendMessage = suspendMessage;
    } else {
      console.warn("Invalid SUBSCRIPTION_END_DATE format. Expected YYYY-MM-DD.");
    }
  } catch (error) {
    console.error("Error in checkSubscription:", error);
  }
}

export function initSubscriptionCron() {
  // Run immediately on startup
  checkSubscription();

  // Run daily at midnight
  cron.schedule("0 0 * * *", () => {
    console.log("Running daily subscription check...");
    checkSubscription();
  });
}
