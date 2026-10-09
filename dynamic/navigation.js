export function openInTop(relativePath) {
  window.open(relativePath, "_top");
}

// Builds an absolute URL for main/group.html from this module's own location,
// and collapses any "//" in the path so the result is always /main/group.html
// (never //main/group.html), whatever server or folder the app runs from.
export function groupPageUrl(groupId) {
  const url = new URL("../main/group.html", import.meta.url);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  url.searchParams.set("groupId", groupId);
  return url.href;
}

export const routes = {
  home: "./dynamic/home.html",
  groups: "./dynamic/groups.html",
  progress: "./main/progress.html",
  settings: "./main/settings.html",
  account: "./main/account.html",
  profile: "./main/profile.html"
};