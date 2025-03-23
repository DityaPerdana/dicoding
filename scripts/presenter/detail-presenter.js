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

      const response = await this._storyRepository.getStoryDetail(id, token);

      if (response.error) {
        if (response.alternativeAction === "redirect-home") {
          this._view.showNotFoundError();
          return;
        }

        if (response.message === "Story not found") {
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
