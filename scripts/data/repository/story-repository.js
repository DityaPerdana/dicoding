class StoryRepository {
  constructor(storyAPI) {
    this._storyAPI = storyAPI;
  }

  async getStories(token, page = 1, size = 10, withLocation = 0) {
    return this._storyAPI.getStories(token, page, size, withLocation);
  }

  async getStoryDetail(id, token) {
    return this._storyAPI.getStory(id, token);
  }

  async addStory(description, photo, lat, lon, token) {
    try {
      // Validasi input
      if (!description || !description.trim()) {
        return {
          error: true,
          message: "Description is required",
        };
      }

      if (!photo) {
        return {
          error: true,
          message: "Photo is required",
        };
      }

      // Pastikan lat dan lon adalah null atau number yang valid
      const validLat =
        lat !== undefined && lat !== null && !isNaN(parseFloat(lat))
          ? parseFloat(lat)
          : null;

      const validLon =
        lon !== undefined && lon !== null && !isNaN(parseFloat(lon))
          ? parseFloat(lon)
          : null;

      // Panggil API
      const response = await this._storyAPI.addStory(
        description,
        photo,
        validLat,
        validLon,
        token,
      );

      return response;
    } catch (error) {
      console.error("Repository error in addStory:", error);
      return {
        error: true,
        message: error.message || "Failed to add story",
      };
    }
  }
}

export default StoryRepository;
