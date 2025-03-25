import HomePage from "./views/pages/home-page.js";
import DetailPage from "./views/pages/detail-page.js";
import AddStoryPage from "./views/pages/add-story-page.js";
import LoginPage from "./views/pages/login-page.js";
import RegisterPage from "./views/pages/register-page.js";
import SavedStoriesPage from "./views/pages/saved-stories-page.js";
import NotFoundPage from "./views/pages/not-found-page.js";

const Routes = {
  "/": HomePage,
  "/detail/:id": DetailPage,
  "/add": AddStoryPage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/saved": SavedStoriesPage,
  "/not-found": NotFoundPage,
};

export default Routes;
