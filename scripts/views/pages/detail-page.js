import UrlParser from "../../utils/url-parser.js";
import DetailPresenter from "../../presenter/detail-presenter.js";
import IdbUtils from "../../utils/idb-utils.js";

const DetailPage = {
  async render() {
    return `
      <div class="story-detail">
        <div class="loader"></div>
      </div>
    `;
  },

  async afterRender(app) {
    this._app = app;
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    const storyId = url.id;

    if (!storyId) {
      this.showError("Invalid story ID");
      return;
    }

    this._presenter = new DetailPresenter({
      view: this,
      storyRepository: app.storyRepository,
      authManager: app.authManager,
    });

    if (!navigator.onLine) {
      try {
        this.showLoading();
        const cachedStory = await IdbUtils.getStory(storyId);

        if (cachedStory) {
          this.displayStory(cachedStory, true);
          app.showAlert("You're offline. Viewing saved story.", "info");
        } else {
          this.showError(
            "Story not available offline. Please save it first or go online.",
          );
        }
      } catch (error) {
        console.error("Error loading story from cache:", error);
        this.showError(
          "Failed to load story from cache. Please try again when online.",
        );
      }
    } else {
      try {
        await this._presenter.showStoryDetail(storyId);
      } catch (error) {
        console.error("Error in detail page:", error);
        try {
          const cachedStory = await IdbUtils.getStory(storyId);
          if (cachedStory) {
            this.displayStory(cachedStory, true);
            app.showAlert(
              "Unable to connect to server. Viewing cached version.",
              "warning",
            );
          } else {
            this.showError(error.message || "An unexpected error occurred");
          }
        } catch (cacheError) {
          this.showError(error.message || "An unexpected error occurred");
        }
      }
    }
  },

  showLoading() {
    document.querySelector(".story-detail").innerHTML =
      '<div class="loader"></div>';
  },

  hideLoading() {},

  showError(message) {
    document.querySelector(".story-detail").innerHTML = `
      <div class="error-message">
        <h3>Error Loading Story</h3>
        <p>${message}</p>
        <a href="#/" class="btn">Back to Stories</a>
      </div>
    `;
  },

  showNotFoundError() {
    this.showError(
      "This story no longer exists or is not accessible. Redirecting to homepage...",
    );
    setTimeout(() => {
      window.location.hash = "#/";
    }, 3000);
  },

  showNotification(message, type) {
    this._app.showAlert(message, type);
  },

  displayStory(story, fromCache = false) {
    try {
      const storyDetailElement = document.querySelector(".story-detail");

      const dateObject = new Date(story.createdAt);
      const formattedDate = dateObject.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const offlineIndicator = !navigator.onLine
        ? '<div class="offline-indicator">You are viewing this story offline</div>'
        : "";

      const cachedIndicator = fromCache
        ? '<span class="cached-indicator">Cached Version</span>'
        : "";

      const backButtonTarget =
        !navigator.onLine || fromCache ? "#/saved" : "#/";
      const backButtonText =
        !navigator.onLine || fromCache
          ? "Back to Saved Stories"
          : "Back to Stories";

      storyDetailElement.innerHTML = `
        ${offlineIndicator}
        <a href="${backButtonTarget}" class="btn btn-secondary">&larr; ${backButtonText}</a>
        <div class="story-detail__content">
          <h2 class="story-detail__title">${story.name}'s Story</h2>
          <div class="story-detail__meta">
            <span>${formattedDate}</span>
            ${cachedIndicator}
          </div>
          <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-detail__image ${!navigator.onLine ? "offline-img" : ""}"
               onerror="this.onerror=null; this.src='/offline-placeholder.jpg';">
          <p class="story-detail__description">${story.description}</p>

          <div class="story-actions">
            ${
              !fromCache
                ? `
              <button id="saveStoryButton" class="btn btn-primary">
                <span class="icon">📥</span> Save for Offline
              </button>
            `
                : `
              <button disabled class="btn btn-success">
                <span class="icon">✓</span> Saved for Offline
              </button>
            `
            }
          </div>
        </div>
        ${
          story.lat && story.lon && navigator.onLine
            ? `
          <div class="map-container">
            <h3>Story Location</h3>
            <div id="map" style="height: 300px;"></div>
          </div>
        `
            : story.lat && story.lon
              ? `
          <div class="map-container">
            <h3>Story Location</h3>
            <p class="offline-map-info">Map not available offline. Location coordinates: ${story.lat}, ${story.lon}</p>
          </div>
        `
              : ""
        }
      `;
    } catch (error) {
      console.error("Error displaying story details:", error);
      this.showError("Failed to display story content");
    }
  },

  initializeMap(story) {
    try {
      const mapElement = document.getElementById("map");
      if (!mapElement) return;

      setTimeout(() => {
        const lat = parseFloat(story.lat);
        const lon = parseFloat(story.lon);

        if (isNaN(lat) || isNaN(lon)) {
          console.error("Invalid coordinates:", story.lat, story.lon);
          return;
        }

        if (navigator.onLine) {
          const map = this._app.initMap(mapElement, lat, lon);
          if (!map) return;

          const marker = L.marker([lat, lon]).addTo(map);
          marker.bindPopup(
            `<b>${story.name}'s Story</b><br>${story.description.substring(0, 100)}...`,
          );

          map.setView([lat, lon], 13);
        }
      }, 300);
    } catch (error) {
      console.error("Error initializing map:", error);
      const mapContainer = document.querySelector(".map-container");
      if (mapContainer) {
        mapContainer.innerHTML = `
          <h3>Story Location</h3>
          <div class="error-message">
            <p>Failed to load map. ${error.message}</p>
          </div>
        `;
      }
    }
  },

  beforeLeave(app) {
    if (app.activeMap) {
      app.activeMap.remove();
    }
  },
};

export default DetailPage;
