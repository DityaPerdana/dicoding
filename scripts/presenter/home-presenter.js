import IdbUtils from "../utils/idb-utils.js";

class HomePresenter {
  constructor({ view, storyRepository, authManager }) {
    this._view = view;
    this._storyRepository = storyRepository;
    this._authManager = authManager;
  }

  async showStories(withLocation = 0) {
    try {
      this._view.showLoading();

      const token = this._authManager.getToken();
      console.log(
        "Loading stories with token:",
        token ? "Token exists" : "No token",
      );

      let response;
      let fromCache = false;

      try {
        response = await this._storyRepository.getStories(
          token,
          1,
          10,
          withLocation,
        );

        if (!response.error && response.listStory) {
          IdbUtils.saveStories(response.listStory);
        }
      } catch (networkError) {
        console.log("Network error, trying to load from cache", networkError);

        const cachedStories = await IdbUtils.getStories();
        if (cachedStories && cachedStories.length > 0) {
          response = {
            error: false,
            message: "Stories loaded from cache",
            listStory: cachedStories,
          };
          fromCache = true;
        } else {
          throw networkError;
        }
      }

      if (response.error) {
        if (
          response.message &&
          (response.message.includes("auth") ||
            response.message.includes("token") ||
            response.message.includes("unauthorized"))
        ) {
          console.log("Authentication issue.");
          this._view.showNotification(
            "Authentication issue. please login",
            "info",
          );

          if (token) {
            this._authManager.logout();
            this._view.updateNavigation();
          }

          const cachedStories = await IdbUtils.getStories();
          if (cachedStories && cachedStories.length > 0) {
            this._view.renderStories(cachedStories);
            this._view.showNotification(
              "Showing stories from cache while offline",
              "info",
            );
            return;
          }

          const guestResponse = await this._storyRepository.getStories(
            "",
            1,
            10,
            withLocation,
          );

          if (guestResponse.error) {
            throw new Error(guestResponse.message || "Failed to fetch stories");
          }

          this._view.renderStories(guestResponse.listStory || []);
          return;
        }

        throw new Error(response.message || "Failed to fetch stories");
      }

      if (!response.listStory) {
        throw new Error("No story data found in response");
      }

      if (fromCache) {
        this._view.showNotification(
          "You're viewing stories from cache while offline",
          "info",
        );
      }

      this._view.renderStories(response.listStory);

      if (
        withLocation === 1 &&
        response.listStory &&
        response.listStory.length > 0
      ) {
        const storiesWithLocation = response.listStory.filter(
          (story) =>
            story &&
            typeof story === "object" &&
            story.lat &&
            story.lon &&
            !isNaN(parseFloat(story.lat)) &&
            !isNaN(parseFloat(story.lon)),
        );

        if (storiesWithLocation.length > 0) {
          this._view.showMap(storiesWithLocation);
        } else {
          this._view.hideMap();
        }
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default HomePresenter;
