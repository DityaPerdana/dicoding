class AddStoryPresenter {
  constructor({ view, storyRepository, authManager }) {
    this._view = view;
    this._storyRepository = storyRepository;
    this._authManager = authManager;
  }

  async addStory(description, photoInput, position) {
    try {
      if (!description) {
        this._view.showNotification(
          "Please enter a description for your story",
          "danger",
        );
        return;
      }

      if (!photoInput) {
        this._view.showNotification(
          "Please provide a photo for your story",
          "danger",
        );
        return;
      }

      this._view.showLoading();

      let photoFile;
      if (photoInput instanceof File) {
        photoFile = photoInput;
      } else if (photoInput instanceof Blob) {
        photoFile = new File([photoInput], "photo.jpg", {
          type: "image/jpeg",
        });
      } else {
        throw new Error("Invalid photo format");
      }

      const token = this._authManager.getToken();

      const lat = position && position.lat ? position.lat : null;
      const lon = position && position.lon ? position.lon : null;

      const response = await this._storyRepository.addStory(
        description,
        photoFile,
        lat,
        lon,
        token,
      );

      if (response.error) {
        throw new Error(response.message);
      }

      this._view.showNotification(
        "Your story has been shared successfully!",
        "success",
      );

      this._view.redirectToHome();
    } catch (error) {
      console.error("Error in add story presenter:", error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }
}

export default AddStoryPresenter;
