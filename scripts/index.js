import Routes from "./routes.js";
import UrlParser from "./utils/url-parser.js";
import DrawerInitiator from "./utils/drawer-initiator.js";
import StoryAPI from "./data/api/story-api.js";
import StoryRepository from "./data/repository/story-repository.js";
import AuthManager from "./utils/auth-manager.js";
import CameraInitiator from "./utils/camera-initiator.js";
import MapInitiator from "./utils/map-initiator.js";
import NotificationHelper from "./utils/notification-helper.js";
import AccessibilityHelper from "./utils/accessibility-helper.js";

const App = {
  async testAPIConnection() {
    try {
      console.log("Testing API connection...");

      const token = this.authManager.getToken();

      let headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/stories?page=1&size=1",
        {
          headers: headers,
        },
      );

      const data = await response.json();

      console.log("API test response:", data);

      if (data.error) {
        if (data.message === "Missing authentication" && !token) {
          console.log("API requires authentication, but connection is working");
          return true;
        }

        console.error("API test failed:", data.message);
        return false;
      }

      console.log("API connection successful!");
      return true;
    } catch (error) {
      console.error("API connection test error:", error);
      return false;
    }
  },

  async init() {
    this.api = new StoryAPI("https://story-api.dicoding.dev/v1");
    this.storyRepository = new StoryRepository(this.api);

    this.authManager = new AuthManager();
    this.notificationHelper = new NotificationHelper();
    this.activeCamera = null;
    this.activeMap = null;

    this.notificationHelper.setupNotificationButton(this);

    AccessibilityHelper.init();

    const apiConnected = await this.testAPIConnection();
    if (!apiConnected) {
      console.error("Unable to connect to API. Check network and API status.");
      this.showAlert(
        "Unable to connect to Dicoding Story API. Please check your internet connection.",
        "danger",
      );
    }

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        } catch (error) {
          console.log("ServiceWorker registration failed: ", error);
        }
      });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;

      this.showInstallButton();
    });

    window.addEventListener("online", () => {
      console.log("App is online");
      document.body.classList.remove("offline");
      this.showAlert("You're back online.", "success");
      if (window.location.hash === "#/saved") {
        setTimeout(() => this.renderPage(), 1000);
      }
    });

    window.addEventListener("offline", () => {
      console.log("App is offline");
      document.body.classList.add("offline");
      this.showAlert(
        "You're offline. Available stories are limited to those you've saved.",
        "warning",
      );
      window.location.hash = "#/saved";
    });

    this.initializeDrawer();
    this.updateNavigation();
    this.renderPage();

    window.addEventListener("hashchange", () => {
      this.renderPage();
    });

    document
      .getElementById("logoutButton")
      .addEventListener("click", (event) => {
        event.preventDefault();
        this.authManager.logout();
        this.updateNavigation();
        window.location.hash = "#/";
      });
  },

  showInstallButton() {
    const installButton = document.createElement("button");
    installButton.textContent = "Install App";
    installButton.className = "btn install-btn";
    installButton.style.position = "fixed";
    installButton.style.bottom = "80px";
    installButton.style.right = "20px";
    installButton.style.zIndex = "100";

    document.body.appendChild(installButton);

    installButton.addEventListener("click", async () => {
      if (!this.deferredPrompt) return;

      this.deferredPrompt.prompt();

      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        installButton.remove();
      } else {
        console.log("User dismissed the install prompt");
      }

      this.deferredPrompt = null;
    });
  },

  initializeDrawer() {
    DrawerInitiator.init({
      button: document.querySelector("#hamburgerButton"),
      drawer: document.querySelector("#navigationDrawer"),
      content: document.querySelector("#mainContent"),
    });
  },

  updateNavigation() {
    const isLoggedIn = this.authManager.isLoggedIn();
    document.querySelector("#loginNav").style.display = isLoggedIn
      ? "none"
      : "block";
    document.querySelector("#registerNav").style.display = isLoggedIn
      ? "none"
      : "block";
    document.querySelector("#logoutNav").style.display = isLoggedIn
      ? "block"
      : "none";
    document.querySelector("#savedStoriesNav").style.display = "block";

    const currentUrl = UrlParser.parseActiveUrlWithCombiner();
    document.querySelectorAll(".app-bar__navigation li").forEach((item) => {
      item.classList.remove("active");
    });

    if (currentUrl === "/") {
      document.querySelector("#homeNav").classList.add("active");
    } else if (currentUrl === "/add") {
      document.querySelector("#addStoryNav").classList.add("active");
    } else if (currentUrl === "/login") {
      document.querySelector("#loginNav").classList.add("active");
    } else if (currentUrl === "/register") {
      document.querySelector("#registerNav").classList.add("active");
    } else if (currentUrl === "/saved") {
      document.querySelector("#savedStoriesNav").classList.add("active");
    }
  },

  async renderPage() {
    try {
      this.cleanupResources();

      const url = UrlParser.parseActiveUrlWithCombiner();
      const page = Routes[url];

      if (!page) {
        window.location.hash = "#/not-found";
        return;
      }

      if (page.needsAuth && !this.authManager.isLoggedIn()) {
        window.location.hash = "#/login";
        return;
      }

      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          await this.renderContent(page);
        }).ready;
      } else {
        const previousUrl = this.currentUrl || "";
        this.currentUrl = url;

        const fromPage = this.getPageType(previousUrl);
        const toPage = this.getPageType(url);

        if (previousUrl) {
          this.customPageTransition(fromPage, toPage);
        }

        await this.renderContent(page);
      }

      this.updateNavigation();
    } catch (error) {
      console.error("Error rendering page:", error);
      this.showErrorPage(error);
    }
  },

  async renderContent(page) {
    const mainContent = document.querySelector("#mainContent");
    mainContent.innerHTML = await page.render(this);
    await page.afterRender(this);

    AccessibilityHelper.setupPageAccessibility();
    this.currentPageBeforeLeave = page.beforeLeave;
  },

  cleanupResources() {
    if (this.currentPageBeforeLeave) {
      this.currentPageBeforeLeave(this);
      this.currentPageBeforeLeave = null;
    }

    if (this.activeCamera) {
      this.activeCamera.stopCamera();
      this.activeCamera = null;
    }

    if (this.activeMap) {
      this.activeMap.remove();
      this.activeMap = null;
    }
  },

  showErrorPage(error) {
    const mainContent = document.querySelector("#mainContent");
    mainContent.innerHTML = `
      <div class="error-container">
        <h2>Something went wrong</h2>
        <p>${error.message || "An unexpected error occurred"}</p>
        <button class="btn" id="tryAgainButton">Try Again</button>
      </div>
    `;

    document.getElementById("tryAgainButton").addEventListener("click", () => {
      window.location.reload();
    });
  },

  showLoading() {
    const mainContent = document.querySelector("#mainContent");
    mainContent.innerHTML = '<div class="loader"></div>';
  },

  showAlert(message, type = "info") {
    const alertElement = document.createElement("div");
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;

    const mainContent = document.querySelector("#mainContent");
    mainContent.insertAdjacentElement("afterbegin", alertElement);

    setTimeout(() => {
      alertElement.remove();
    }, 5000);
  },

  initCamera(videoElement, captureButton, photoElement) {
    if (!videoElement || !captureButton || !photoElement) {
      console.error("Camera elements not provided");
      return Promise.resolve(false);
    }

    this.activeCamera = new CameraInitiator(
      videoElement,
      captureButton,
      photoElement,
    );
    return this.activeCamera.init();
  },

  initMap(mapElement, latitude = -6.2, longitude = 106.8) {
    if (!mapElement) {
      console.error("Map element is null");
      return null;
    }

    if (this.activeMap) {
      this.activeMap.remove();
      this.activeMap = null;
    }

    this.activeMap = new MapInitiator(mapElement);
    return this.activeMap.init(latitude, longitude);
  },

  customPageTransition(fromPage, toPage) {
    const transitions = {
      "home-to-detail": () => {
        document.documentElement.classList.add("transition-zoom");
        setTimeout(() => {
          document.documentElement.classList.remove("transition-zoom");
        }, 500);
      },
      "detail-to-home": () => {
        document.documentElement.classList.add("transition-slide");
        setTimeout(() => {
          document.documentElement.classList.remove("transition-slide");
        }, 500);
      },
      default: () => {
        document.documentElement.classList.add("transition-fade");
        setTimeout(() => {
          document.documentElement.classList.remove("transition-fade");
        }, 500);
      },
    };

    const transitionKey = `${fromPage}-to-${toPage}`;
    const transitionFn = transitions[transitionKey] || transitions.default;

    transitionFn();
  },

  getPageType(url) {
    if (url === "/") return "home";
    if (url.includes("/detail")) return "detail";
    if (url.includes("/add")) return "add";
    if (url.includes("/login")) return "login";
    if (url.includes("/register")) return "register";
    if (url.includes("/saved")) return "saved";
    if (url.includes("/not-found")) return "not-found";
    return "unknown";
  },
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

export default App;
