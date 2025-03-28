class NotificationHelper {
  constructor() {
    this.vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
    this.subscriptionKey = "notification-subscription";
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js");
        console.log(
          "Service Worker registered with scope:",
          registration.scope,
        );
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        return null;
      }
    }
    return null;
  }

  async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async setupNotificationButton(app) {
    const notificationButton = document.getElementById("notificationButton");
    if (!notificationButton) return;

    if (!("Notification" in window)) {
      notificationButton.disabled = true;
      notificationButton.textContent = "Notifications Not Supported";
      return;
    }

    const swRegistration = await this.registerServiceWorker();
    if (!swRegistration) {
      notificationButton.disabled = true;
      notificationButton.textContent = "Push Not Supported";
      return;
    }

    const savedSubscription = this.getSavedSubscription();
    if (savedSubscription) {
      notificationButton.textContent = "Unsubscribe Notifications";
      notificationButton.classList.add("subscribed");
    }

    notificationButton.addEventListener("click", async () => {
      try {
        const isSubscribed = !!this.getSavedSubscription();

        if (isSubscribed) {
          await this.unsubscribeFromPushNotifications(app);
          notificationButton.textContent = "Subscribe Notifications";
          notificationButton.classList.remove("subscribed");
          app.showAlert("Unsubscribed from notifications", "info");
        } else {
          const success = await this.subscribeForPushNotifications(app);
          if (success) {
            notificationButton.textContent = "Unsubscribe Notifications";
            notificationButton.classList.add("subscribed");
            app.showAlert(
              "Subscribed to notifications successfully!",
              "success",
            );
          }
        }
      } catch (error) {
        console.error("Notification subscription error:", error);
        app.showAlert(`Notification error: ${error.message}`, "danger");
      }
    });
  }

  async subscribeForPushNotifications(app) {
    try {
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        app.showAlert("Notification permission denied", "danger");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log("Push notification subscription:", subscription);

      this.saveSubscription(subscription);

      if (app.authManager.isLoggedIn()) {
        const token = app.authManager.getToken();
        const response = await app.api.subscribeNotification(
          subscription,
          token,
        );

        if (response.error) {
          throw new Error(
            response.message || "Failed to register subscription on server",
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  async unsubscribeFromPushNotifications(app) {
    try {
      const savedSubscription = this.getSavedSubscription();
      if (!savedSubscription) return true;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      this.removeSubscription();

      if (app.authManager.isLoggedIn()) {
        const token = app.authManager.getToken();
        const endpoint = savedSubscription.endpoint;

        const response = await app.api.unsubscribeNotification(endpoint, token);

        if (response.error) {
          console.error("Error unsubscribing on server:", response.message);
        }
      }

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  saveSubscription(subscription) {
    localStorage.setItem(this.subscriptionKey, JSON.stringify(subscription));
  }

  getSavedSubscription() {
    const saved = localStorage.getItem(this.subscriptionKey);
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved subscription:", e);
      return null;
    }
  }

  removeSubscription() {
    localStorage.removeItem(this.subscriptionKey);
  }
}

export default NotificationHelper;
