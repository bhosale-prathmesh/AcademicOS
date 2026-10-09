let toastTimer = null;

export function showToast(message, type = "", rootDocument = document) {
  let toast = rootDocument.getElementById("aosToast");

  if (!toast) {
    toast = rootDocument.createElement("div");
    toast.id = "aosToast";
    toast.className = "aos-toast";
    toast.setAttribute("role", "status");
    toast.hidden = true;
    rootDocument.body.appendChild(toast);

    if (!rootDocument.getElementById("aosToastStyles")) {
      const link = rootDocument.createElement("link");
      link.id = "aosToastStyles";
      link.rel = "stylesheet";
      link.href = "../css/common.css";
      rootDocument.head.appendChild(link);
    }
  }

  toast.textContent = message;
  toast.className = `aos-toast${type ? ` ${type}` : ""}`;
  toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}
