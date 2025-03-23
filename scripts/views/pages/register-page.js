const RegisterPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Create a New Account</h2>
        <form id="registerForm">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" class="form-control" placeholder="Enter your full name" required>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" class="form-control" placeholder="Enter your email" required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" placeholder="Enter your password (min. 8 characters)" minlength="8" required>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm your password" minlength="8" required>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-full">Register</button>
          </div>

          <p class="text-center">
            Already have an account? <a href="#/login">Login here</a>
          </p>
        </form>
      </div>
    `;
  },

  async afterRender(app) {
    if (app.authManager.isLoggedIn()) {
      window.location.hash = "#/";
      return;
    }

    const form = document.getElementById("registerForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = nameInput.value;
      const email = emailInput.value;
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (password !== confirmPassword) {
        app.showAlert("Passwords do not match", "danger");
        return;
      }

      try {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

        const response = await app.api.register(name, email, password);

        if (response.error) {
          throw new Error(response.message);
        }

        app.showAlert(
          "Registration successful! Please login to continue.",
          "success",
        );

        setTimeout(() => {
          window.location.hash = "#/login";
        }, 1500);
      } catch (error) {
        console.error("Registration failed:", error);

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = "Register";

        app.showAlert(`Registration failed: ${error.message}`, "danger");
      }
    });
  },
};

export default RegisterPage;
