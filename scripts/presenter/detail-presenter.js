import IdbUtils from "../utils/idb-utils.js"; // tambahkan import ini

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

      const token = this._authManager.getToken();
      console.log("Fetching story details for ID:", id);

      let response;
      let fromCache = false;

      try {
        // Try to get from API first
        response = await this._storyRepository.getStoryDetail(id, token);

        // If successful, save to IndexedDB
        if (!response.error && response.story) {
          await IdbUtils.saveStory(response.story);
        }
      } catch (networkError) {
        console.log("Network error, trying to load from cache", networkError);

        // Try to get from IndexedDB if offline
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
          // Try from IndexedDB before giving up
          const cachedStory = await IdbUtils.getStory(id);
          if (cachedStory) {
            this._view.displayStory(cachedStory);
            this._view.showNotification(
              "Viewing cached story while offline",
              "info",
            );
            return;
          }

          this._view.showNotFoundError();
          return;
        }

        if (response.message === "Story not found") {
          // Try from IndexedDB before giving up
          const cachedStory = await IdbUtils.getStory(id);
          if (cachedStory) {
            this._view.displayStory(cachedStory);
            this._view.showNotification(
              "Viewing cached story while offline",
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
        throw new Error("Story data not found in response");
      }

      if (fromCache) {
        this._view.showNotification(
          "Viewing cached story while offline",
          "info",
        );
      }

      this._view.displayStory(response.story);
    } catch (error) {
      console.error("Error in detail presenter:", error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default DetailPresenter;
