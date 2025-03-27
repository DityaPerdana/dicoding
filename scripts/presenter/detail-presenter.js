import IdbUtils from "../utils/idb-utils.js";

class DetailPresenter {
  constructor({ view, storyRepository, authManager }) {
    this._view = view;
    this._storyRepository = storyRepository;
    this._authManager = authManager;
  }

  async showStoryDetail(id) {
    try {
      this._view.showLoading();

      if (!id) {
        throw new Error("Invalid story ID");
      }

      if (!navigator.onLine) {
        console.log("Offline mode detected, trying to load from cache");
        const cachedStory = await IdbUtils.getStory(id);

        if (cachedStory) {
          this._view.displayStory(cachedStory, true);
          this._view.showNotification(
            "You're offline. Viewing cached story.",
            "info",
          );
          return;
        } else {
          throw new Error(
            "This story isn't available offline. Please connect to the internet or view other saved stories.",
          );
        }
      }

      const token = this._authManager.getToken();
      console.log("Fetching story details for ID:", id);

      let response;
      let fromCache = false;

      try {
        response = await this._storyRepository.getStoryDetail(id, token);

        if (!response.error && response.story) {
          await IdbUtils.saveStory(response.story);
        }
      } catch (networkError) {
        console.log("Network error, trying to load from cache", networkError);

        const cachedStory = await IdbUtils.getStory(id);
        if (cachedStory) {
          response = {
            error: false,
            message: "Story loaded from cache",
            story: cachedStory,
          };
          fromCache = true;
        } else {
          throw networkError;
        }
      }

      if (response.error) {
        if (response.alternativeAction === "redirect-home") {
          const cachedStory = await IdbUtils.getStory(id);
          if (cachedStory) {
            this._view.displayStory(cachedStory, true);
            this._view.showNotification("Viewing cached story", "info");
            return;
          }

          this._view.showNotFoundError();
          return;
        }

        if (response.message === "Story not found") {
          const cachedStory = await IdbUtils.getStory(id);
          if (cachedStory) {
            this._view.displayStory(cachedStory, true);
            this._view.showNotification(
              "This story is no longer available online but found in your saved stories.",
              "info",
            );
            return;
          }

          throw new Error(
            "This story no longer exists or is not accessible. It may have been deleted.",
          );
        } else {
          throw new Error(response.message || "Failed to fetch story details");
        }
      }

      if (!response.story) {
        const cachedStory = await IdbUtils.getStory(id);
        if (cachedStory) {
          this._view.displayStory(cachedStory, true);
          this._view.showNotification(
            "Error getting story from server. Viewing cached version.",
            "warning",
          );
          return;
        }

        throw new Error("Story data not found");
      }

      if (fromCache) {
        this._view.showNotification("Viewing cached story", "info");
      }

      this._view.displayStory(response.story, fromCache);
    } catch (error) {
      console.error("Error in detail presenter:", error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default DetailPresenter;
