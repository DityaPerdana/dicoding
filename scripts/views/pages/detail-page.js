import UrlParser from "../../utils/url-parser.js";
import DetailPresenter from "../../presenter/detail-presenter.js";
import IdbUtils from "../../utils/idb-utils.js"; // tambahkan import ini

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

    try {
      await this._presenter.showStoryDetail(storyId);
    } catch (error) {
      console.error("Error in detail page:", error);
      this.showError(error.message || "An unexpected error occurred");
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

  displayStory(story) {
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

      storyDetailElement.innerHTML = `
        <a href="#/" class="btn btn-secondary">&larr; Back to Stories</a>
        <div class="story-detail__content">
          <h2 class="story-detail__title">${story.name}'s Story</h2>
          <div class="story-detail__meta">
            <span>${formattedDate}</span>
          </div>
          <img src="${story.photoUrl}" alt="Photo by ${story.name}" class="story-detail__image">
          <p class="story-detail__description">${story.description}</p>

          <div class="story-actions">
            <button id="saveStoryButton" class="btn btn-primary">
              <span class="icon">📥</span> Save for Offline
            </button>
          </div>
        </div>
        ${
          story.lat && story.lon
            ? `
          <div class="map-container">
            <h3>Story Location</h3>
            <div id="map" style="height: 300px;"></div>
          </div>
        `
            : ""
        }
      `;

      // Set up save story button
      const saveButton = document.getElementById("saveStoryButton");
      if (saveButton) {
        saveButton.addEventListener("click", async () => {
          try {
            await IdbUtils.saveStory(story);
            this._app.showAlert("Story saved for offline reading!", "success");
            saveButton.textContent = "Saved ✓";
            saveButton.disabled = true;
          } catch (error) {
            console.error("Error saving story:", error);
            this._app.showAlert("Failed to save story", "danger");
          }
        });

        // Check if story is already saved
        IdbUtils.getStory(story.id).then((savedStory) => {
          if (savedStory) {
            saveButton.textContent = "Saved ✓";
            saveButton.disabled = true;
          }
        });
      }

      const elements = storyDetailElement.querySelectorAll(
        ".story-detail__title, .story-detail__meta, .story-detail__image, .story-detail__description, .map-container, .story-actions",
      );
      elements.forEach((element, index) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        element.style.transitionDelay = `${0.1 + index * 0.1}s`;

        setTimeout(() => {
          element.style.opacity = "1";
          element.style.transform = "translateY(0)";
        }, 10);
      });

      if (story.lat && story.lon) {
        this.initializeMap(story);
      }
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

        const map = this._app.initMap(mapElement, lat, lon);
        if (!map) return;

        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup(
          `<b>${story.name}'s Story</b><br>${story.description.substring(0, 100)}...`,
        );

        map.setView([lat, lon], 13);
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
