class CameraInitiator {
  constructor(videoElement, captureButton, photoElement) {
    this.videoElement = videoElement;
    this.captureButton = captureButton;
    this.photoElement = photoElement;
    this.stream = null;
  }

  async init() {
    try {
      // Validate elements
      if (!this.videoElement || !this.captureButton || !this.photoElement) {
        console.error("Camera elements not found");
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });

      this.videoElement.srcObject = this.stream;

      this.captureButton.addEventListener("click", () => {
        this.capturePhoto();
      });

      return true;
    } catch (error) {
      console.error("Error initializing camera:", error);
      return false;
    }
  }

  capturePhoto() {
    try {
      if (!this.videoElement || !this.photoElement) return;

      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      const photoDataUrl = canvas.toDataURL("image/jpeg");
      this.photoElement.src = photoDataUrl;
      this.photoElement.style.display = "block";
      this.videoElement.style.display = "none";

      canvas.toBlob(
        (blob) => {
          this.photoBlob = blob;
        },
        "image/jpeg",
        0.95,
      );
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  }

  getPhotoBlob() {
    return this.photoBlob;
  }

  retakePhoto() {
    if (!this.videoElement || !this.photoElement) return;

    this.photoElement.style.display = "none";
    this.videoElement.style.display = "block";
    this.photoBlob = null;
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
  }
}

export default CameraInitiator;
