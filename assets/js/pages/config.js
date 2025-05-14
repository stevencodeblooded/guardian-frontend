/**
 * Configuration page script
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize layout and UI components
  initLayout();
  initUserMenu();

  // Initialize configuration management
  initConfigManagement();
});

/**
 * Initialize the layout (sidebar toggle, responsive adjustments)
 */
function initLayout() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  // Show/hide sidebar on mobile
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });

  // Hide sidebar on mobile
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  // Hide admin-only items for non-admin users
  if (!AuthUtils.isAdmin()) {
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = "none";
    });
  }
}

/**
 * Initialize user menu functionality
 */
function initUserMenu() {
  const userMenuButton = document.getElementById("user-menu-button");
  const userMenuDropdown = document.getElementById("user-menu-dropdown");
  const userName = document.getElementById("user-name");
  const logoutLink = document.getElementById("logout-link");
  const profileLink = document.getElementById("profile-link");

  // Get and display user name
  const user = AuthUtils.getUser();
  if (user) {
    userName.textContent = user.name;
  }

  // Toggle dropdown
  userMenuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenuDropdown.classList.toggle("show");
  });

  // Close dropdown when clicking elsewhere
  document.addEventListener("click", () => {
    userMenuDropdown.classList.remove("show");
  });

  // Handle logout
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Remove auth data regardless of API call success
    AuthUtils.logout();

    // Redirect to login page
    window.location.href = "login.html";
  });

  // Handle profile modal
  profileLink.addEventListener("click", (e) => {
    e.preventDefault();
    openProfileModal();
  });
}

/**
 * Open profile modal with user data
 */
function openProfileModal() {
  // This is a duplicate from other pages
  // In a real app, this would be a shared module
  const profileModal = new Modal("profile-modal");
  const profileForm = document.getElementById("profile-form");
  const profileNameInput = document.getElementById("profile-name");
  const profileEmailInput = document.getElementById("profile-email");
  const profileRoleInput = document.getElementById("profile-role");
  const saveProfileBtn = document.getElementById("save-profile");
  const cancelProfileBtn = document.getElementById("cancel-profile");

  // Load user data
  const user = AuthUtils.getUser();
  if (user) {
    profileNameInput.value = user.name || "";
    profileEmailInput.value = user.email || "";
    profileRoleInput.value = user.role || "";
  }

  // Show modal
  profileModal.show();

  // Handle save button
  saveProfileBtn.addEventListener("click", async () => {
    // Basic validation
    if (!profileNameInput.value.trim()) {
      document.getElementById("profile-name-error").textContent =
        "Name is required";
      return;
    }

    // Reset error
    document.getElementById("profile-name-error").textContent = "";

    try {
      // Update user details
      const response = await AuthAPI.updateUserDetails({
        name: profileNameInput.value.trim(),
      });

      // Update stored user data
      AuthUtils.setUser(response.user);

      // Update displayed name
      document.getElementById("user-name").textContent = response.user.name;

      // Show success message
      Toast.success("Profile updated successfully");

      // Close modal
      profileModal.hide();
    } catch (error) {
      console.error("Profile update error:", error);
      Toast.error(error.message || "Failed to update profile");
    }
  });

  // Handle cancel button
  cancelProfileBtn.addEventListener("click", () => {
    profileModal.hide();
  });
}

/**
 * Initialize configuration management
 */
function initConfigManagement() {
  // Cache DOM elements
  const configForm = document.getElementById("config-form");
  const saveConfigBtn = document.getElementById("save-config-btn");
  const resetBtn = document.getElementById("reset-btn");
  const alertsContainer = document.getElementById("alerts-container");

  // Initialize reset confirmation modal
  const resetModal = new Modal("reset-confirm-modal");

  // Store original config data
  let originalConfig = null;
  let hasChanges = false;

  // Load configuration data
  loadConfigData();

  // Add event listeners
  saveConfigBtn.addEventListener("click", saveConfiguration);
  resetBtn.addEventListener("click", () => resetModal.show());

  document
    .getElementById("cancel-reset")
    .addEventListener("click", () => resetModal.hide());
  document
    .getElementById("close-reset-modal")
    .addEventListener("click", () => resetModal.hide());
  document
    .getElementById("confirm-reset")
    .addEventListener("click", resetConfiguration);

  // Detect form changes
  configForm.addEventListener("change", () => {
    hasChanges = true;
    saveConfigBtn.disabled = false;
  });

  // Handle checkbox inputs specifically since their values aren't just strings
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      hasChanges = true;
      saveConfigBtn.disabled = false;
    });
  });

  // Show alert message function
  function showAlert(message, type = "danger") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    alertsContainer.innerHTML = "";
    alertsContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }

  /**
   * Load configuration data from API
   */
  async function loadConfigData() {
    try {
      const response = await ConfigAPI.getConfig();
      originalConfig = response.data;

      // Populate form with config values
      populateConfigForm(originalConfig);

      // Disable save button initially
      saveConfigBtn.disabled = true;
      hasChanges = false;
    } catch (error) {
      console.error("Failed to load configuration:", error);
      showAlert("Failed to load configuration. Please try again later.");
    }
  }

  /**
   * Populate form with configuration values
   * @param {Object} config - Configuration data
   */
  function populateConfigForm(config) {
    // General settings
    document.getElementById("enableNotifications").checked =
      config.find((c) => c.key === "enableNotifications")?.value || false;
    document.getElementById("debugMode").checked =
      config.find((c) => c.key === "debugMode")?.value || false;
    document.getElementById("guardianExtensionId").value =
      config.find((c) => c.key === "guardianExtensionId")?.value || "";

    // Data clearing settings
    document.getElementById("clearOnDisable").checked =
      config.find((c) => c.key === "clearOnDisable")?.value || false;
    document.getElementById("clearOnClose").checked =
      config.find((c) => c.key === "clearOnClose")?.value || false;

    // Get clearItems object
    const clearItems = config.find((c) => c.key === "clearItems")?.value || {};

    // Clear items checkboxes
    document.getElementById("clearCookies").checked =
      clearItems.cookies || false;
    document.getElementById("clearLocalStorage").checked =
      clearItems.localStorage || false;
    document.getElementById("clearSessionStorage").checked =
      clearItems.sessionStorage || false;
    document.getElementById("clearIndexedDB").checked =
      clearItems.indexedDB || false;
    document.getElementById("clearCache").checked = clearItems.cache || false;
    document.getElementById("clearHistory").checked =
      clearItems.history || false;

    // Advanced settings
    document.getElementById("requestTimeoutMs").value =
      config.find((c) => c.key === "requestTimeoutMs")?.value || 10000;
    document.getElementById("heartbeatIntervalMs").value =
      config.find((c) => c.key === "heartbeatIntervalMs")?.value || 5000;
    document.getElementById("checkIntervalMs").value =
      config.find((c) => c.key === "checkIntervalMs")?.value || 3000;
    document.getElementById("apiRetryAttempts").value =
      config.find((c) => c.key === "apiRetryAttempts")?.value || 3;
    document.getElementById("apiRetryDelayMs").value =
      config.find((c) => c.key === "apiRetryDelayMs")?.value || 1000;
  }

  /**
   * Save configuration to API
   */
  async function saveConfiguration() {
    // If no changes, do nothing
    if (!hasChanges) {
      return;
    }

    // Collect form data
    const formData = {
      // General settings
      enableNotifications: document.getElementById("enableNotifications")
        .checked,
      debugMode: document.getElementById("debugMode").checked,

      // Data clearing settings
      clearOnDisable: document.getElementById("clearOnDisable").checked,
      clearOnClose: document.getElementById("clearOnClose").checked,

      // Clear items
      clearItems: {
        cookies: document.getElementById("clearCookies").checked,
        localStorage: document.getElementById("clearLocalStorage").checked,
        sessionStorage: document.getElementById("clearSessionStorage").checked,
        indexedDB: document.getElementById("clearIndexedDB").checked,
        cache: document.getElementById("clearCache").checked,
        history: document.getElementById("clearHistory").checked,
      },

      // Advanced settings
      requestTimeoutMs: parseInt(
        document.getElementById("requestTimeoutMs").value
      ),
      heartbeatIntervalMs: parseInt(
        document.getElementById("heartbeatIntervalMs").value
      ),
      checkIntervalMs: parseInt(
        document.getElementById("checkIntervalMs").value
      ),
      apiRetryAttempts: parseInt(
        document.getElementById("apiRetryAttempts").value
      ),
      apiRetryDelayMs: parseInt(
        document.getElementById("apiRetryDelayMs").value
      ),
    };

    // Show loading state
    saveConfigBtn.disabled = true;
    saveConfigBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    try {
      // Call API to update config
      const response = await ConfigAPI.updateConfig(formData);

      // Update original config
      originalConfig = response.data;

      // Reset form state
      hasChanges = false;

      // Show success message
      showAlert("Configuration saved successfully", "success");

      // Reset button state
      saveConfigBtn.disabled = true;
      saveConfigBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
    } catch (error) {
      console.error("Save configuration error:", error);
      showAlert(error.message || "Failed to save configuration");

      // Reset button state
      saveConfigBtn.disabled = false;
      saveConfigBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
    }
  }

  /**
   * Reset configuration to defaults
   */
  async function resetConfiguration() {
    // Show loading state
    const resetConfirmBtn = document.getElementById("confirm-reset");
    const btnText = resetConfirmBtn.querySelector(".btn-text");
    const spinner = document.getElementById("reset-spinner");

    resetConfirmBtn.disabled = true;
    btnText.textContent = "Resetting...";
    spinner.classList.remove("d-none");

    try {
      // Call API to reset config
      const response = await ConfigAPI.resetConfig();

      // Update original config
      originalConfig = response.data;

      // Populate form with new config
      populateConfigForm(originalConfig);

      // Reset form state
      hasChanges = false;
      saveConfigBtn.disabled = true;

      // Show success message
      showAlert("Configuration reset to defaults successfully", "success");

      // Close modal
      resetModal.hide();
    } catch (error) {
      console.error("Reset configuration error:", error);
      showAlert(error.message || "Failed to reset configuration");
    } finally {
      // Reset button state
      resetConfirmBtn.disabled = false;
      btnText.textContent = "Reset";
      spinner.classList.add("d-none");
    }
  }
}
