const AccessibilityHelper = {
  init() {
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();

        // Prioritaskan storyList sebagai target fokus utama
        const storyList = document.querySelector("#storyList");
        const mainContent = document.querySelector("#mainContent");

        // Pilih storyList jika ada, jika tidak gunakan mainContent
        const contentTarget = storyList || mainContent;

        if (contentTarget) {
          // Pastikan elemen bisa menerima fokus
          contentTarget.setAttribute("tabindex", "-1");
          contentTarget.focus();

          // Gulir ke konten
          contentTarget.scrollIntoView({ behavior: "smooth" });

          // Tambahkan event listener untuk menghapus outline saat user mengklik
          contentTarget.addEventListener("blur", function removeOutline() {
            contentTarget.style.outline = "none";
            contentTarget.removeEventListener("blur", removeOutline);
          });
        }
      });
    }
  },

  // Metode tambahan untuk digunakan setelah render halaman
  setupPageAccessibility() {
    // Pastikan storyList memiliki tabindex untuk menerima fokus
    const storyList = document.querySelector("#storyList");
    if (storyList) {
      storyList.setAttribute("tabindex", "-1");

      // Tambahkan role list dan labelledby untuk screen reader
      storyList.setAttribute("role", "region");
      storyList.setAttribute("aria-label", "Story List");
    }

    // Tambahkan aria-label untuk navigasi
    const nav = document.querySelector(".app-bar__navigation");
    if (nav) {
      nav.setAttribute("aria-label", "Main Navigation");
    }

    // Pastikan setiap story item memiliki atribut aksesibilitas yang tepat
    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item, index) => {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "article");

      // Tambahkan event listener untuk navigasi dengan keyboard
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click(); // Trigger click event untuk navigasi
        }
      });
    });
  },
};

export default AccessibilityHelper;
