import HomePresenter from "../../presenter/home-presenter.js";
import StoryItemTemplate from "../templates/story-item-template.js";

const HomePage = {
  async render() {
    return `
      <div class="home-page">
        <h2 class="page-title">Latest Stories</h2>
        <div id="storyList" class="story-list" tabindex="-1">
          <div class="loader"></div>
        </div>
        <div id="storyMap" class="map-container" style="display: none;">
          <h3>Story Locations</h3>
          <div id="map" style="height: 400px;"></div>
        </div>
      </div>
    `;
  },

  async afterRender(app) {
    this._app = app;
    this._storyListElement = document.getElementById("storyList");
    this._storyMapElement = document.getElementById("storyMap");

    this._presenter = new HomePresenter({
      view: this,
      storyRepository: app.storyRepository,
      authManager: app.authManager,
    });

    try {
      await this._presenter.showStories(0);
    } catch (error) {
      console.error("Error setting up homepage:", error);
      app.showAlert(
        "Failed to initialize homepage. Please try again.",
        "danger",
      );
    }
  },

  showLoading() {
    if (this._storyListElement) {
      this._storyListElement.innerHTML = '<div class="loader"></div>';
    }
  },

  hideLoading() {},

  updateNavigation() {
    this._app.updateNavigation();
  },

  showNotification(message, type) {
    this._app.showAlert(message, type);
  },

  renderStories(stories) {
    if (!this._storyListElement) {
      console.error("Container element is null, cannot render stories");
      return;
    }

    console.log("Rendering stories:", stories ? stories.length : 0);

    if (!stories || stories.length === 0) {
      this._storyListElement.innerHTML =
        '<p class="empty-state">No stories found. Be the first to share your story!</p>';
      return;
    }

    this._storyListElement.innerHTML = "";

    stories.forEach((story, index) => {
      if (!story || typeof story !== "object") {
        console.log("Invalid story object at index", index, story);
        return;
      }

      const storyHTML = StoryItemTemplate.createStoryItemTemplate(story);
      const storyContainer = document.createElement("div");
      storyContainer.innerHTML = storyHTML;
      const storyElement = storyContainer.firstElementChild;

      storyElement.style.opacity = "0";
      storyElement.style.transform = "translateY(20px)";
      storyElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      storyElement.style.transitionDelay = `${index * 0.05}s`;

      storyElement.addEventListener("click", () => {
        window.location.hash = `#/detail/${story.id}`;
      });

      this._storyListElement.appendChild(storyElement);

      storyElement.setAttribute("tabindex", "0");
      storyElement.setAttribute("role", "article");
      storyElement.setAttribute("aria-labelledby", `story-title-${index}`);

      const dateObject = new Date(story.createdAt);
      const formattedDate = dateObject.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      storyElement.innerHTML = `
            <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-item__image">
            <div class="story-item__content">
              <h3 id="story-title-${index}" class="story-item__title">${story.name}'s Story</h3>
              <p class="story-item__description">${story.description}</p>
              <p class="story-item__date">${formattedDate}</p>
              ${story.lat && story.lon ? `<p class="story-item__location">Location available</p>` : ""}
            </div>
          `;

      storyElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.location.hash = `#/detail/${story.id}`;
        }
      });

      setTimeout(() => {
        storyElement.style.opacity = "1";
        storyElement.style.transform = "translateY(0)";
      }, 10);
    });
  },

  showMap(stories) {
    if (this._storyMapElement) {
      this._storyMapElement.style.display = "block";

      setTimeout(() => {
        this.initializeMap(stories);
      }, 100);
    }
  },

  hideMap() {
    if (this._storyMapElement) {
      this._storyMapElement.style.display = "none";
    }
  },

  showError(message) {
    if (this._storyListElement) {
      this._storyListElement.innerHTML = `
        <div class="error-message">
          <p>Failed to load stories. ${message}</p>
          <button class="btn" id="retryButton">Retry</button>
        </div>
      `;

      const retryButton = document.getElementById("retryButton");
      if (retryButton) {
        retryButton.addEventListener("click", () => {
          this._presenter.showStories(0);
        });
      }
    }
  },

  initializeMap(stories) {
    try {
      const mapElement = document.getElementById("map");
      if (!mapElement) {
        console.error("Map element not found");
        return;
      }

      if (this._app.activeMap) {
        this._app.activeMap.remove();
        this._app.activeMap = null;
      }

      let totalLat = 0;
      let totalLon = 0;
      let validCount = 0;

      for (let i = 0; i < stories.length; i++) {
        if (stories[i] && stories[i].lat && stories[i].lon) {
          const lat = parseFloat(stories[i].lat);
          const lon = parseFloat(stories[i].lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            totalLat += lat;
            totalLon += lon;
            validCount++;
          }
        }
      }

      const centerLat = validCount > 0 ? totalLat / validCount : -6.2;
      const centerLon = validCount > 0 ? totalLon / validCount : 106.8;

      console.log("Initializing map with center:", centerLat, centerLon);

      const map = this._app.initMap(mapElement, centerLat, centerLon);
      if (!map) {
        throw new Error("Failed to initialize map");
      }

      stories.forEach((story) => {
        if (story && story.lat && story.lon) {
          const lat = parseFloat(story.lat);
          const lon = parseFloat(story.lon);

          if (!isNaN(lat) && !isNaN(lon)) {
            const marker = L.marker([lat, lon]).addTo(map);

            marker.bindPopup(`
                <div class="story-popup">
                  <h4>${story.name}'s Story</h4>
                  <p>${story.description.substring(0, 50)}${story.description.length > 50 ? "..." : ""}</p>
                  <a href="#/detail/${story.id}">View Story</a>
                </div>
              `);
          }
        }
      });

      if (stories.length > 1) {
        const validStories = stories.filter((s) => {
          if (!s || !s.lat || !s.lon) {
            return false;
          }
          const lat = parseFloat(s.lat);
          const lon = parseFloat(s.lon);
          return !isNaN(lat) && !isNaN(lon);
        });

        if (validStories.length > 1) {
          try {
            const bounds = L.latLngBounds(
              validStories.map((story) => [
                parseFloat(story.lat),
                parseFloat(story.lon),
              ]),
            );
            map.fitBounds(bounds);
          } catch (e) {
            console.error("Error fitting bounds:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      if (this._storyMapElement) {
        this._storyMapElement.innerHTML = `
            <h3>Story Locations</h3>
            <div class="error-message">
              <p>Failed to load map. ${error.message}</p>
            </div>
          `;
      }
    }
  },
};

export default HomePage;
