const LoginPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Login to Your Account</h2>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" class="form-control" placeholder="Enter your email" required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" class="form-control" placeholder="Enter your password" required>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-full">Login</button>
          </div>

          <p class="text-center">
            Don't have an account? <a href="#/register">Register here</a>
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

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = emailInput.value;
      const password = passwordInput.value;

      try {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

        const response = await app.api.login(email, password);

        if (response.error) {
          throw new Error(response.message);
        }

        const { userId, name, token } = response.loginResult;
        app.authManager.setAuth({ userId, name }, token);

        app.updateNavigation();

        app.showAlert("Login successful!", "success");

        setTimeout(() => {
          window.location.hash = "#/";
        }, 1000);
      } catch (error) {
        console.error("Login failed:", error);

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = "Login";

        app.showAlert(`Login failed: ${error.message}`, "danger");
      }
    });
  },
};

export default LoginPage;
