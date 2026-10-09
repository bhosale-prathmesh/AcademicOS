export function openInTop(relativePath) {
  window.open(relativePath, "_top");
}

export function groupPageUrl(groupId) {
  return `./main/group.html?groupId=${encodeURIComponent(groupId)}`;
}

export const routes = {
  home: "./dynamic/home.html",
  groups: "./dynamic/groups.html",
  progress: "./main/progress.html",
  settings: "./main/settings.html",
  account: "./main/account.html",
  profile: "./main/profile.html"
};
