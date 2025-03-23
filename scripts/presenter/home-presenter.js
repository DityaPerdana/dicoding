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

      const response = await this._storyRepository.getStories(
        token,
        1,
        10,
        withLocation,
      );

      if (response.error) {
        if (
          response.message &&
          (response.message.includes("auth") ||
            response.message.includes("token") ||
            response.message.includes("unauthorized"))
        ) {
          console.log("Authentication issue.");
          this._view.showNotification(
            "Authentication issue. harap login",
            "info",
          );

          if (token) {
            this._authManager.logout();
            // Trigger navigation update in the view
            this._view.updateNavigation();
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
