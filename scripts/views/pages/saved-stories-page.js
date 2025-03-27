import StoryItemTemplate from "../templates/story-item-template.js";
import IdbUtils from "../../utils/idb-utils.js";

const SavedStoriesPage = {
  async render() {
    const offlineMessage = !navigator.onLine
      ? `<div class="offline-indicator">
        <p>You are currently offline. Only saved stories are available.</p>
      </div>`
      : "";

    return `
      <div class="saved-stories-page">
        ${offlineMessage}
        <h2 class="page-title">Saved Stories</h2>
        <p class="page-description">View and manage stories you've saved for offline reading.</p>

        <div id="storyList" class="story-list" tabindex="-1">
          <div class="loader"></div>
        </div>

        <div class="saved-management">
          <button id="clearAllSaved" class="btn btn-danger" style="display: none;">Clear All Saved Stories</button>
        </div>
      </div>
    `;
  },

  async afterRender(app) {
    this._app = app;
    this._storyListElement = document.getElementById("storyList");
    this._clearAllButton = document.getElementById("clearAllSaved");

    if (!navigator.onLine) {
      document.body.classList.add("offline");
    } else {
      document.body.classList.remove("offline");
    }

    this.showLoading();

    try {
      const stories = await IdbUtils.getStories();
      this.renderStories(stories);

      if (this._clearAllButton) {
        this._clearAllButton.addEventListener("click", async () => {
          if (confirm("Are you sure you want to delete all saved stories?")) {
            this.showLoading();

            for (const story of stories) {
              await IdbUtils.deleteStory(story.id);
            }

            this.renderStories([]);
            app.showAlert("All saved stories have been deleted", "success");
          }
        });
      }
    } catch (error) {
      console.error("Error loading saved stories:", error);
      this.showError("Failed to load saved stories: " + error.message);
    }
  },

  showLoading() {
    if (this._storyListElement) {
      this._storyListElement.innerHTML = '<div class="loader"></div>';
    }
  },

  showError(message) {
    if (this._storyListElement) {
      this._storyListElement.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
          <button class="btn" id="retryButton">Retry</button>
        </div>
      `;

      const retryButton = document.getElementById("retryButton");
      if (retryButton) {
        retryButton.addEventListener("click", async () => {
          this.showLoading();
          const stories = await IdbUtils.getStories();
          this.renderStories(stories);
        });
      }
    }
  },

  renderStories(stories) {
    if (!this._storyListElement) {
      console.error("Container element is null, cannot render stories");
      return;
    }

    if (!stories || stories.length === 0) {
      const offlineMessage = !navigator.onLine
        ? `<p class="empty-state">
          You are offline and haven't saved any stories yet.
          Connect to the internet to view and save stories.
        </p>`
        : `<p class="empty-state">
          No saved stories found. Save stories to view them offline!
        </p>`;

      this._storyListElement.innerHTML = offlineMessage;

      if (this._clearAllButton) {
        this._clearAllButton.style.display = "none";
      }
      return;
    }

    if (this._clearAllButton) {
      this._clearAllButton.style.display = "block";
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

      if (!navigator.onLine) {
        storyElement.classList.add("offline-item");
      }

      storyElement.style.opacity = "0";
      storyElement.style.transform = "translateY(20px)";
      storyElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      storyElement.style.transitionDelay = `${index * 0.05}s`;

      storyElement.addEventListener("click", () => {
        window.location.hash = `#/detail/${story.id}`;
      });

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("btn", "btn-danger", "delete-saved-story");
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete story by ${story.name}`);

      deleteButton.addEventListener("click", async (event) => {
        event.stopPropagation();

        if (
          confirm(`Are you sure you want to delete "${story.name}'s Story"?`)
        ) {
          await IdbUtils.deleteStory(story.id);
          storyElement.style.opacity = "0";
          storyElement.style.transform = "translateY(-20px)";

          setTimeout(() => {
            storyElement.remove();

            if (this._storyListElement.children.length === 0) {
              const offlineMessage = !navigator.onLine
                ? `<p class="empty-state">
                  You are offline and haven't saved any stories yet.
                  Connect to the internet to view and save stories.
                </p>`
                : `<p class="empty-state">
                  No saved stories found. Save stories to view them offline!
                </p>`;

              this._storyListElement.innerHTML = offlineMessage;

              if (this._clearAllButton) {
                this._clearAllButton.style.display = "none";
              }
            }
          }, 300);

          this._app.showAlert("Story removed from saved stories", "success");
        }
      });

      const contentElement = storyElement.querySelector(".story-item__content");
      if (contentElement) {
        contentElement.appendChild(deleteButton);
      }
      this._storyListElement.appendChild(storyElement);

      setTimeout(() => {
        storyElement.style.opacity = "1";
        storyElement.style.transform = "translateY(0)";
      }, 10);
    });
  },

  beforeLeave(app) {
    document.body.classList.remove("offline");
  },
};

export default SavedStoriesPage;
