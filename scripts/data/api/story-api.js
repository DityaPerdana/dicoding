class StoryAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async register(name, email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in register:", error);
      return {
        error: true,
        message: error.message || "Registration failed",
      };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in login:", error);
      return {
        error: true,
        message: error.message || "Login failed",
      };
    }
  }

  async getStories(token, page = 1, size = 10, withLocation = 0) {
    try {
      const url = new URL(`${this.baseUrl}/stories`);
      url.searchParams.append("page", page);
      url.searchParams.append("size", size);
      url.searchParams.append("location", withLocation);

      console.log("Fetching stories with URL:", url.toString());
      console.log("Using token:", token ? "Token exists" : "No token");

      let headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers: headers,
      });

      console.log("Stories API response status:", response.status);

      const data = await response.json();
      console.log("Stories data:", data);

      return data;
    } catch (error) {
      console.error("API Error in getStories:", error);
      return {
        error: true,
        message: error.message || "Failed to fetch stories",
        listStory: [],
      };
    }
  }

  async getStory(id, token) {
    try {
      if (!id) {
        return { error: true, message: "Story ID is required" };
      }

      console.log(`Fetching story with ID: ${id}`);
      console.log(
        `Using token: ${token ? token.substring(0, 10) + "..." : "No token"}`,
      );

      const url = `${this.baseUrl}/stories/${id}`;
      console.log(`Request URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log("Story API response:", data);

      if (data.error && data.message === "Story not found" && token) {
        console.log("Story not found, suggesting to redirect to home");

        return {
          error: true,
          message: "Story not found",
          alternativeAction: "redirect-home",
        };
      }

      return data;
    } catch (error) {
      console.error("API Error in getStory:", error);
      return {
        error: true,
        message: error.message || "Failed to fetch story details",
      };
    }
  }

  async addStory(description, photo, lat, lon, token) {
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      const response = await fetch(`${this.baseUrl}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in addStory:", error);
      return {
        error: true,
        message: error.message || "Failed to add story",
      };
    }
  }

  async addGuestStory(description, photo, lat, lon) {
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      const response = await fetch(`${this.baseUrl}/stories/guest`, {
        method: "POST",
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in addGuestStory:", error);
      return {
        error: true,
        message: error.message || "Failed to add guest story",
      };
    }
  }

  async subscribeNotification(subscription, token) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey("p256dh")),
              ),
            ),
            auth: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey("auth")),
              ),
            ),
          },
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in subscribeNotification:", error);
      return {
        error: true,
        message: error.message || "Failed to subscribe to notifications",
      };
    }
  }

  async unsubscribeNotification(endpoint, token) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("API Error in unsubscribeNotification:", error);
      return {
        error: true,
        message: error.message || "Failed to unsubscribe from notifications",
      };
    }
  }
}

export default StoryAPI;
