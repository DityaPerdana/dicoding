const NotFoundPage = {
  async render() {
    return `
      <div class="not-found-page">
        <div class="not-found-container">
          <h2>404 - Page Not Found</h2>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div class="not-found-actions">
            <a href="#/" class="btn">Go to Homepage</a>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    // Nothing to do after render
  },
};

export default NotFoundPage;
