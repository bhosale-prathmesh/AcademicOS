
const pageRoutes = {
  home: "./dynamic/home.html",
  groups: "./main/groups.html",
  progress: "./main/progress.html",
  settings: "./main/settings.html"
};

export function initPageLoader() {
  const frame = document.getElementById("pageFrame");
  const navItems = document.querySelectorAll(".nav-item");

  if (!frame) {
    console.error("AcademicOS: #pageFrame was not found.");
    return;
  }

  function loadPage(page) {
    const route = pageRoutes[page];

    if (!route) {
      console.error("AcademicOS: Unknown page:", page);
      return;
    }

    frame.src = route;

    navItems.forEach((item) => {
      const active = item.dataset.page === page;
      item.classList.toggle("active", active);

      if (active) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      loadPage(item.dataset.page);
    });
  });

  // Set Home as the initial page.
  loadPage("home");

  return { loadPage };
}
