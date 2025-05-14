/**
 * Toast notification component
 */
class Toast {
  /**
   * Create a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, danger, warning, info)
   * @param {string} title - Toast title
   * @param {number} duration - Duration in milliseconds
   */
  static show(message, type = "info", title = null, duration = 5000) {
    // Get or create toast container
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    // Generate default title if not provided
    if (!title) {
      switch (type) {
        case "success":
          title = "Success";
          break;
        case "danger":
          title = "Error";
          break;
        case "warning":
          title = "Warning";
          break;
        default:
          title = "Information";
      }
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Create toast content
    toast.innerHTML = `
        <div class="toast-header">
          <span class="toast-title">${title}</span>
          <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      `;

    // Add to container
    container.appendChild(toast);

    // Handle close button
    const closeButton = toast.querySelector(".toast-close");
    closeButton.addEventListener("click", () => {
      this.hide(toast);
    });

    // Auto hide after duration
    setTimeout(() => {
      this.hide(toast);
    }, duration);

    return toast;
  }

  /**
   * Hide a toast notification
   * @param {HTMLElement} toast - Toast element to hide
   */
  static hide(toast) {
    toast.classList.add("hiding");

    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }

  /**
   * Show a success toast
   * @param {string} message - Toast message
   * @param {string} title - Toast title
   * @param {number} duration - Duration in milliseconds
   */
  static success(message, title = "Success", duration = 5000) {
    return this.show(message, "success", title, duration);
  }

  /**
   * Show an error toast
   * @param {string} message - Toast message
   * @param {string} title - Toast title
   * @param {number} duration - Duration in milliseconds
   */
  static error(message, title = "Error", duration = 5000) {
    return this.show(message, "danger", title, duration);
  }

  /**
   * Show a warning toast
   * @param {string} message - Toast message
   * @param {string} title - Toast title
   * @param {number} duration - Duration in milliseconds
   */
  static warning(message, title = "Warning", duration = 5000) {
    return this.show(message, "warning", title, duration);
  }

  /**
   * Show an info toast
   * @param {string} message - Toast message
   * @param {string} title - Toast title
   * @param {number} duration - Duration in milliseconds
   */
  static info(message, title = "Information", duration = 5000) {
    return this.show(message, "info", title, duration);
  }
}
