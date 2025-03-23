const AccessibilityHelper = {
  init() {
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();

        const storyList = document.querySelector("#storyList");
        const mainContent = document.querySelector("#mainContent");

        const contentTarget = storyList || mainContent;

        if (contentTarget) {
          contentTarget.setAttribute("tabindex", "-1");
          contentTarget.focus();

          contentTarget.scrollIntoView({ behavior: "smooth" });

          contentTarget.addEventListener("blur", function removeOutline() {
            contentTarget.style.outline = "none";
            contentTarget.removeEventListener("blur", removeOutline);
          });
        }
      });
    }
  },

  setupPageAccessibility() {
    const storyList = document.querySelector("#storyList");
    if (storyList) {
      storyList.setAttribute("tabindex", "-1");

      storyList.setAttribute("role", "region");
      storyList.setAttribute("aria-label", "Story List");
    }

    const nav = document.querySelector(".app-bar__navigation");
    if (nav) {
      nav.setAttribute("aria-label", "Main Navigation");
    }

    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item, index) => {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "article");

      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      });
    });
  },
};

export default AccessibilityHelper;
