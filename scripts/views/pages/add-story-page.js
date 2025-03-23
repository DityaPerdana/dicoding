import AddStoryPresenter from "../../presenter/add-story-presenter.js";

const AddStoryPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Share Your Story</h2>
        <form id="addStoryForm">
          <div class="form-group">
            <label for="description">Story Description</label>
            <textarea id="description" class="form-control" rows="4" required></textarea>
          </div>

          <div class="photo-input-container">
            <label>Add Photo</label>

            <div class="photo-source-selector">
              <button type="button" id="useCameraBtn" class="btn source-select active">Use Camera</button>
              <button type="button" id="uploadPhotoBtn" class="btn source-select">Upload Photo</button>
            </div>

            <div id="cameraContainer" class="camera-container">
              <div class="camera-preview">
                <video id="cameraFeed" autoplay playsinline style="display: block;"></video>
                <img id="capturedPhoto" style="display: none;">
              </div>
              <div class="camera-controls">
                <button type="button" id="captureButton" class="btn">Capture Photo</button>
                <button type="button" id="retakeButton" class="btn btn-secondary" style="display: none;">Retake</button>
              </div>
            </div>

            <div id="uploadContainer" class="upload-container" style="display: none;">
              <div class="upload-preview">
                <img id="uploadPreview" style="display: none; max-width: 100%; max-height: 300px;">
                <div id="uploadPlaceholder" class="upload-placeholder">
                  <span>No photo selected</span>
                </div>
              </div>
              <div class="upload-controls">
                <input type="file" id="photoUploadInput" accept="image/*" class="file-input">
                <label for="photoUploadInput" class="btn">Select Photo</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Location (Optional - Click on map to select)</label>
            <div id="map" style="height: 300px;"></div>
            <div class="map-info">
              <p id="locationInfo">No location selected</p>
              <button type="button" id="clearLocationButton" class="btn btn-secondary" style="display: none;">Clear Location</button>
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-full">Share Story</button>
          </div>
        </form>
      </div>
    `;
  },

  async afterRender(app) {
    this._app = app;

    if (!app.authManager.isLoggedIn()) {
      app.showAlert("Please login to share your story", "danger");
      window.location.hash = "#/login";
      return;
    }

    this._presenter = new AddStoryPresenter({
      view: this,
      storyRepository: app.storyRepository,
      authManager: app.authManager,
    });

    this._form = document.getElementById("addStoryForm");

    this._useCameraBtn = document.getElementById("useCameraBtn");
    this._uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
    this._cameraContainer = document.getElementById("cameraContainer");
    this._uploadContainer = document.getElementById("uploadContainer");

    this._cameraFeed = document.getElementById("cameraFeed");
    this._captureButton = document.getElementById("captureButton");
    this._capturedPhoto = document.getElementById("capturedPhoto");
    this._retakeButton = document.getElementById("retakeButton");

    this._photoUploadInput = document.getElementById("photoUploadInput");
    this._uploadPreview = document.getElementById("uploadPreview");
    this._uploadPlaceholder = document.getElementById("uploadPlaceholder");

    this._locationInfo = document.getElementById("locationInfo");
    this._clearLocationButton = document.getElementById("clearLocationButton");
    this._mapElement = document.getElementById("map");

    if (
      !this._form ||
      !this._useCameraBtn ||
      !this._uploadPhotoBtn ||
      !this._mapElement
    ) {
      console.error("One or more essential UI elements not found");
      app.showAlert(
        "There was a problem loading the page. Please try again.",
        "danger",
      );
      return;
    }

    this._useCameraBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this._useCameraBtn.classList.add("active");
      this._uploadPhotoBtn.classList.remove("active");
      this._cameraContainer.style.display = "block";
      this._uploadContainer.style.display = "none";
      this._photoSource = "camera";
      this.initCamera();
    });

    this._uploadPhotoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this._uploadPhotoBtn.classList.add("active");
      this._useCameraBtn.classList.remove("active");
      this._uploadContainer.style.display = "block";
      this._cameraContainer.style.display = "none";
      this._photoSource = "upload";

      if (app.activeCamera) {
        app.activeCamera.stopCamera();
      }
    });

    this._photoSource = "camera";
    await this.initCamera();

    if (this._photoUploadInput) {
      this._photoUploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this._uploadPreview.src = event.target.result;
            this._uploadPreview.style.display = "block";
            this._uploadPlaceholder.style.display = "none";
            this._uploadedFile = file;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    try {
      const map = app.initMap(this._mapElement);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (app.activeMap) {
            app.activeMap.remove();
            app.initMap(
              this._mapElement,
              position.coords.latitude,
              position.coords.longitude,
            );
            app.activeMap.setMarker(
              position.coords.latitude,
              position.coords.longitude,
            );
            this._locationInfo.textContent = `Selected location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            this._clearLocationButton.style.display = "block";
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { timeout: 5000 },
      );

      this._mapElement.addEventListener("click", () => {
        if (app.activeMap) {
          const position = app.activeMap.getPosition();
          if (position.lat && position.lon) {
            this._locationInfo.textContent = `Selected location: ${position.lat.toFixed(6)}, ${position.lon.toFixed(6)}`;
            this._clearLocationButton.style.display = "block";
          }
        }
      });

      this._clearLocationButton.addEventListener("click", () => {
        if (app.activeMap) {
          app.activeMap.remove();
          app.initMap(this._mapElement);
          this._locationInfo.textContent = "No location selected";
          this._clearLocationButton.style.display = "none";
        }
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    this._form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const description = document.getElementById("description").value;
      let photoBlob = null;

      if (this._photoSource === "camera") {
        photoBlob = app.activeCamera ? app.activeCamera.getPhotoBlob() : null;
      } else if (this._photoSource === "upload") {
        photoBlob = this._uploadedFile || null;
      }

      const position = app.activeMap
        ? app.activeMap.getPosition()
        : { lat: null, lon: null };

      await this._presenter.addStory(description, photoBlob, position);
    });
  },

  async initCamera() {
    try {
      if (
        !this._cameraFeed ||
        !this._captureButton ||
        !this._capturedPhoto ||
        !this._retakeButton
      ) {
        console.error("Camera elements not found");
        this._useCameraBtn.disabled = true;
        this._uploadPhotoBtn.click();
        return false;
      }

      const cameraResult = await this._app.initCamera(
        this._cameraFeed,
        this._captureButton,
        this._capturedPhoto,
      );

      if (!cameraResult) {
        console.error("Failed to initialize camera");
        this._cameraContainer.innerHTML = `
          <div class="error-message">
            <p>Failed to access camera. Please use the upload option instead.</p>
          </div>
        `;
        this._uploadPhotoBtn.click();
        return false;
      }

      this._retakeButton.addEventListener("click", () => {
        this._capturedPhoto.style.display = "none";
        this._cameraFeed.style.display = "block";
        this._retakeButton.style.display = "none";
        this._captureButton.style.display = "block";
        this._app.activeCamera.retakePhoto();
      });

      this._captureButton.addEventListener("click", () => {
        this._captureButton.style.display = "none";
        this._retakeButton.style.display = "block";
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize camera:", error);
      this._cameraContainer.innerHTML = `
        <div class="error-message">
          <p>Failed to access camera. Please use the upload option instead.</p>
        </div>
      `;
      this._uploadPhotoBtn.click();
      return false;
    }
  },

  showLoading() {
    if (this._form) {
      this._form.innerHTML = '<div class="loader"></div>';
    }
  },

  hideLoading() {},

  showError(message) {
    this._app.showAlert(`Failed to share story: ${message}`, "danger");

    this.afterRender(this._app);
  },

  showNotification(message, type) {
    this._app.showAlert(message, type);
  },

  redirectToHome() {
    setTimeout(() => {
      window.location.hash = "#/";
    }, 1500);
  },

  beforeLeave(app) {
    if (app.activeCamera) {
      app.activeCamera.stopCamera();
    }
  },
};

export default AddStoryPage;
