/**
 * Modal component
 */
class Modal {
  /**
   * Create a modal instance
   * @param {string} modalId - Modal element ID
   */
  constructor(modalId) {
    this.modal = document.getElementById(modalId);

    if (!this.modal) {
      throw new Error(`Modal with ID "${modalId}" not found`);
    }

    // Find close buttons
    const closeButtons = this.modal.querySelectorAll(".modal-close");

    // Set up event listeners
    closeButtons.forEach((button) => {
      button.addEventListener("click", () => this.hide());
    });

    // Close when clicking outside the modal
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });
  }

  /**
   * Show the modal
   */
  show() {
    this.modal.classList.add("active");

    // Prevent body scrolling
    document.body.style.overflow = "hidden";

    // Trigger show event
    const showEvent = new CustomEvent("modal:show", {
      bubbles: true,
      detail: { modal: this.modal },
    });

    this.modal.dispatchEvent(showEvent);

    return this;
  }

  /**
   * Hide the modal
   */
  hide() {
    this.modal.classList.remove("active");

    // Restore body scrolling
    document.body.style.overflow = "";

    // Trigger hide event
    const hideEvent = new CustomEvent("modal:hide", {
      bubbles: true,
      detail: { modal: this.modal },
    });

    this.modal.dispatchEvent(hideEvent);

    return this;
  }

  /**
   * Toggle the modal visibility
   */
  toggle() {
    if (this.modal.classList.contains("active")) {
      this.hide();
    } else {
      this.show();
    }

    return this;
  }

  /**
   * Static method to create and show a modal
   * @param {Object} options - Modal options
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal content
   * @param {Array} options.buttons - Modal buttons
   * @param {string} options.size - Modal size (sm, lg, xl)
   * @returns {HTMLElement} - Modal element
   */
  static create(options = {}) {
    const { title, content, buttons = [], size = "" } = options;

    // Create modal overlay
    const modalId = `dynamic-modal-${Date.now()}`;
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = modalId;

    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.className = `modal-container ${size ? `modal-${size}` : ""}`;

    // Create modal header
    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.innerHTML = `
        <h3 class="modal-title">${title || "Modal"}</h3>
        <button class="modal-close">&times;</button>
      `;

    // Create modal body
    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.innerHTML = content || "";

    // Create modal footer
    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";

    // Add buttons
    buttons.forEach((button) => {
      const btnElement = document.createElement("button");
      btnElement.className = `btn ${button.class || "btn-secondary"}`;
      btnElement.textContent = button.text || "Button";

      if (button.action) {
        btnElement.addEventListener("click", () => {
          button.action();

          if (button.closeOnClick !== false) {
            const modalInstance = new Modal(modalId);
            modalInstance.hide();
          }
        });
      } else if (button.closeOnClick !== false) {
        btnElement.addEventListener("click", () => {
          const modalInstance = new Modal(modalId);
          modalInstance.hide();
        });
      }

      modalFooter.appendChild(btnElement);
    });

    // Assemble modal
    modalContainer.appendChild(modalHeader);
    modalContainer.appendChild(modalBody);

    if (buttons.length > 0) {
      modalContainer.appendChild(modalFooter);
    }

    modal.appendChild(modalContainer);

    // Add to body
    document.body.appendChild(modal);

    // Create and show the modal
    const modalInstance = new Modal(modalId);
    modalInstance.show();

    // Clean up when hidden
    modal.addEventListener("modal:hide", () => {
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300); // Wait for animation to complete
    });

    return modal;
  }

  /**
   * Show a confirm dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback for confirm
   * @param {Function} onCancel - Callback for cancel
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Modal element
   */
  static confirm(message, onConfirm, onCancel = null, options = {}) {
    const buttons = [
      {
        text: options.confirmText || "Confirm",
        class: options.confirmClass || "btn-primary",
        action: onConfirm,
      },
      {
        text: options.cancelText || "Cancel",
        class: options.cancelClass || "btn-secondary",
        action: onCancel,
      },
    ];

    return this.create({
      title: options.title || "Confirmation",
      content: `<p>${message}</p>`,
      buttons,
      size: options.size || "sm",
    });
  }

  /**
   * Show an alert dialog
   * @param {string} message - Alert message
   * @param {Function} onClose - Callback for close
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Modal element
   */
  static alert(message, onClose = null, options = {}) {
    const buttons = [
      {
        text: options.closeText || "OK",
        class: options.closeClass || "btn-primary",
        action: onClose,
      },
    ];

    return this.create({
      title: options.title || "Alert",
      content: `<p>${message}</p>`,
      buttons,
      size: options.size || "sm",
    });
  }
}
