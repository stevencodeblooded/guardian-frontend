/**
 * Whitelist management page script
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize layout and UI components
  initLayout();
  initUserMenu();

  // Initialize whitelist management
  initWhitelistManagement();
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
  // This is a duplicate from dashboard.js
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
 * Initialize whitelist management functionality
 */
function initWhitelistManagement() {
  // Cache DOM elements
  const whitelistTableBody = document.getElementById("whitelist-table-body");
  const emptyState = document.getElementById("empty-state");
  const addExtensionBtn = document.getElementById("add-extension-btn");
  const emptyAddBtn = document.getElementById("empty-add-btn");
  const statusFilter = document.getElementById("status-filter");
  const searchInput = document.getElementById("search-input");

  // Initialize modals
  const addModal = new Modal("add-extension-modal");
  const editModal = new Modal("edit-extension-modal");
  const viewModal = new Modal("view-extension-modal");
  const deleteModal = new Modal("delete-confirm-modal");

  // Store whitelist data
  let whitelistData = [];
  let filteredData = [];

  // Current extension being edited/deleted
  let currentExtensionId = null;

  // Load whitelist data
  loadWhitelistData();

  // Add event listeners
  addExtensionBtn.addEventListener("click", openAddModal);
  emptyAddBtn.addEventListener("click", openAddModal);

  document
    .getElementById("cancel-add")
    .addEventListener("click", () => addModal.hide());
  document
    .getElementById("close-add-modal")
    .addEventListener("click", () => addModal.hide());
    document
      .getElementById("save-extension")
      .addEventListener("click", function (e) {
        e.preventDefault();
        addExtension();
      });

  document
    .getElementById("cancel-edit")
    .addEventListener("click", () => editModal.hide());
  document
    .getElementById("close-edit-modal")
    .addEventListener("click", () => editModal.hide());
  document
    .getElementById("update-extension")
    .addEventListener("click", updateExtension);

  document
    .getElementById("close-view")
    .addEventListener("click", () => viewModal.hide());
  document
    .getElementById("close-view-modal")
    .addEventListener("click", () => viewModal.hide());
  document.getElementById("view-edit-btn").addEventListener("click", () => {
    viewModal.hide();
    openEditModal(currentExtensionId);
  });

  document
    .getElementById("cancel-delete")
    .addEventListener("click", () => deleteModal.hide());
  document
    .getElementById("close-delete-modal")
    .addEventListener("click", () => deleteModal.hide());
  document
    .getElementById("confirm-delete")
    .addEventListener("click", deleteExtension);

  // Handle status toggle in edit modal
  const statusToggle = document.getElementById("extension-status");
  const statusLabel = document.getElementById("status-label");

  statusToggle.addEventListener("change", () => {
    statusLabel.textContent = statusToggle.checked ? "Active" : "Inactive";
  });

  // Handle filter changes
  statusFilter.addEventListener("change", filterWhitelist);
  searchInput.addEventListener("input", filterWhitelist);

  /**
   * Load whitelist data from API
   */
  async function loadWhitelistData() {
    try {
      const response = await WhitelistAPI.getAllExtensions();
      whitelistData = response.data || [];

      // Initial filter and render
      filterWhitelist();
    } catch (error) {
      console.error("Failed to load whitelist data:", error);
      Toast.error("Failed to load whitelist data. Please try again later.");

      // Show empty state
      whitelistTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              <div class="empty-state">
                <div class="empty-state-icon text-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Error Loading Data</h3>
                <p class="empty-state-description">${
                  error.message || "Failed to load whitelist data."
                }</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                  <i class="fas fa-sync-alt mr-2"></i> Retry
                </button>
              </div>
            </td>
          </tr>
        `;
    }
  }

  /**
   * Filter whitelist data based on status and search input
   */
  function filterWhitelist() {
    const statusValue = statusFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Apply filters
    filteredData = whitelistData.filter((extension) => {
      // Apply status filter
      if (statusValue !== "all") {
        const isActive = statusValue === "true";
        if (extension.isActive !== isActive) {
          return false;
        }
      }

      // Apply search filter
      if (searchTerm) {
        return (
          (extension.name &&
            extension.name.toLowerCase().includes(searchTerm)) ||
          (extension.extensionId &&
            extension.extensionId.toLowerCase().includes(searchTerm)) ||
          (extension.description &&
            extension.description.toLowerCase().includes(searchTerm))
        );
      }

      return true;
    });

    // Render filtered data
    renderWhitelist();
  }

  /**
   * Render whitelist data
   */
  function renderWhitelist() {
    // Show empty state if no data
    if (filteredData.length === 0) {
      whitelistTableBody.innerHTML = "";
      emptyState.classList.remove("d-none");
      document.getElementById("whitelist-table").classList.add("d-none");
      return;
    }

    // Hide empty state if data exists
    emptyState.classList.add("d-none");
    document.getElementById("whitelist-table").classList.remove("d-none");

    // Build table rows
    let tableHtml = "";

    filteredData.forEach((extension) => {
      // Format date
      const addedDate = new Date(extension.addedDate).toLocaleDateString();

      // Status badge
      const statusBadge = extension.isActive
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-danger">Inactive</span>';

      // Actions based on user role
      const viewBtn = `<button class="btn btn-sm btn-secondary mr-2 view-btn" data-id="${extension.extensionId}"><i class="fas fa-eye"></i></button>`;
      const editBtn = AuthUtils.isAdmin()
        ? `<button class="btn btn-sm btn-primary mr-2 edit-btn" data-id="${extension.extensionId}"><i class="fas fa-edit"></i></button>`
        : "";
      const deleteBtn = AuthUtils.isAdmin()
        ? `<button class="btn btn-sm btn-danger delete-btn" data-id="${extension.extensionId}"><i class="fas fa-trash"></i></button>`
        : "";

      tableHtml += `
          <tr>
            <td>${extension.name || "Unknown"}</td>
            <td><span class="text-monospace">${
              extension.extensionId
            }</span></td>
            <td>${extension.version || "N/A"}</td>
            <td>${extension.addedBy?.name || "Unknown"}</td>
            <td>${addedDate}</td>
            <td>${statusBadge}</td>
            <td>${viewBtn}${editBtn}${deleteBtn}</td>
          </tr>
        `;
    });

    // Update table
    whitelistTableBody.innerHTML = tableHtml;

    // Add event listeners to action buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => openViewModal(btn.dataset.id));
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
    });
  }

  /**
   * Open add extension modal
   */
  function openAddModal() {
    // Reset form
    document.getElementById("add-extension-form").reset();
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Show modal
    addModal.show();
  }

  /**
   * Add extension to whitelist
   */
  async function addExtension() {
    console.log("addExtension function is called");

    // Get form data
    const extensionId = document.getElementById("extension-id").value.trim();
    const name = document.getElementById("extension-name").value.trim();
    const description = document
      .getElementById("extension-description")
      .value.trim();
    const version = document.getElementById("extension-version").value.trim();

    console.log("Form data:", { extensionId, name, description, version });

    // Reset error messages
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Validate form fields
    const fields = { extensionId, name, description, version };
    const rules = {
      extensionId: {
        required: true,
        validator: (value) =>
          ValidationUtils.isValidExtensionId(value) ||
          "Extension ID must be 32 lowercase letters",
      },
      name: { required: true, maxLength: 100 },
      description: { maxLength: 500 },
    };

    const validation = ValidationUtils.validateForm(fields, rules);
    console.log("Validation result:", validation);

    if (!validation.isValid) {
      // Display errors
      console.log("Validation failed:", validation.errors);
      ValidationUtils.displayErrors(validation.errors);
      return;
    }

    // Show loading state
    const saveBtn = document.getElementById("save-extension");
    const btnText = saveBtn.querySelector(".btn-text");
    const spinner = document.getElementById("add-spinner");

    saveBtn.disabled = true;
    btnText.textContent = "Adding...";
    spinner.classList.remove("d-none");
    console.log("Loading state activated");

    try {
      console.log("Attempting API call to add extension");
      // Call API to add extension
      const response = await WhitelistAPI.addExtension({
        extensionId,
        name,
        description,
        version,
      });

      console.log("API response received:", response);

      // Update whitelist data
      whitelistData.unshift(response.data);

      // Re-render whitelist
      filterWhitelist();

      // Show success message
      Toast.success("Extension added to whitelist successfully");

      // Close modal
      addModal.hide();
    } catch (error) {
      console.error("Add extension error:", error);
      console.log("Error details:", {
        status: error.status,
        message: error.message,
        stack: error.stack,
      });

      // Show appropriate error message
      if (
        error.status === 400 &&
        error.message.includes("already in whitelist")
      ) {
        Toast.error("This extension is already in the whitelist");
      } else {
        Toast.error(error.message || "Failed to add extension");
      }
    } finally {
      // Reset loading state
      saveBtn.disabled = false;
      btnText.textContent = "Add to Whitelist";
      spinner.classList.add("d-none");
      console.log("Loading state reset");
    }
  }

  /**
   * Open view extension modal
   * @param {string} extensionId - Extension ID
   */
  async function openViewModal(extensionId) {
    try {
      // Find extension in whitelist data
      let extension = whitelistData.find(
        (ext) => ext.extensionId === extensionId
      );

      // If not found, fetch from API
      if (!extension) {
        const response = await WhitelistAPI.getExtensionDetails(extensionId);
        extension = response.data;
      }

      // Set current extension ID
      currentExtensionId = extensionId;

      // Populate modal with extension details
      document.getElementById("view-extension-id").textContent =
        extension.extensionId;
      document.getElementById("view-extension-name").textContent =
        extension.name || "Unknown";
      document.getElementById("view-extension-description").textContent =
        extension.description || "No description available";
      document.getElementById("view-extension-version").textContent =
        extension.version || "Not specified";

      // Format status
      const statusEl = document.getElementById("view-extension-status");
      statusEl.textContent = extension.isActive ? "Active" : "Inactive";
      statusEl.className = extension.isActive
        ? "text-success fw-bold"
        : "text-danger fw-bold";

      // Format added by
      document.getElementById("view-extension-added-by").textContent =
        extension.addedBy?.name || "Unknown";

      // Format date
      const addedDate = new Date(extension.addedDate).toLocaleString();
      document.getElementById("view-extension-date").textContent = addedDate;

      // Show modal
      viewModal.show();
    } catch (error) {
      console.error("Get extension details error:", error);
      Toast.error("Failed to load extension details");
    }
  }

  /**
   * Open edit extension modal
   * @param {string} extensionId - Extension ID
   */
  async function openEditModal(extensionId) {
    try {
      // Find extension in whitelist data
      let extension = whitelistData.find(
        (ext) => ext.extensionId === extensionId
      );

      // If not found, fetch from API
      if (!extension) {
        const response = await WhitelistAPI.getExtensionDetails(extensionId);
        extension = response.data;
      }

      // Set current extension ID
      currentExtensionId = extensionId;

      // Reset error messages
      document
        .querySelectorAll(".form-error")
        .forEach((el) => (el.textContent = ""));

      // Populate form with extension details
      document.getElementById("edit-extension-id").value =
        extension.extensionId;
      document.getElementById("edit-extension-name").value =
        extension.name || "";
      document.getElementById("edit-extension-description").value =
        extension.description || "";
      document.getElementById("edit-extension-version").value =
        extension.version || "";

      // Set status toggle
      const statusToggle = document.getElementById("extension-status");
      const statusLabel = document.getElementById("status-label");

      statusToggle.checked = extension.isActive === true;
      statusLabel.textContent =
        extension.isActive === true ? "Active" : "Inactive";

      // Show modal
      editModal.show();
    } catch (error) {
      console.error("Get extension details error:", error);
      Toast.error("Failed to load extension details");
    }
  }

  /**
   * Update extension in whitelist
   */
  async function updateExtension() {
    // Get form data
    const name = document.getElementById("edit-extension-name").value.trim();
    const description = document
      .getElementById("edit-extension-description")
      .value.trim();
    const version = document
      .getElementById("edit-extension-version")
      .value.trim();
    const isActive = document.getElementById("extension-status").checked;

    // Reset error messages
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Validate form fields
    const fields = { name, description, version };
    const rules = {
      name: { required: true, maxLength: 100 },
      description: { maxLength: 500 },
    };

    const validation = ValidationUtils.validateForm(fields, rules);

    if (!validation.isValid) {
      // Display errors
      ValidationUtils.displayErrors(validation.errors);
      return;
    }

    // Show loading state
    const updateBtn = document.getElementById("update-extension");
    const btnText = updateBtn.querySelector(".btn-text");
    const spinner = document.getElementById("edit-spinner");

    updateBtn.disabled = true;
    btnText.textContent = "Updating...";
    spinner.classList.remove("d-none");

    try {
      // Call API to update extension
      const response = await WhitelistAPI.updateExtension(currentExtensionId, {
        name,
        description,
        version,
        isActive,
      });

      // Update whitelist data
      const index = whitelistData.findIndex(
        (ext) => ext.extensionId === currentExtensionId
      );
      if (index !== -1) {
        whitelistData[index] = response.data;
      }

      // Re-render whitelist
      filterWhitelist();

      // Show success message
      Toast.success("Extension updated successfully");

      // Close modal
      editModal.hide();
    } catch (error) {
      console.error("Update extension error:", error);
      Toast.error(error.message || "Failed to update extension");
    } finally {
      // Reset loading state
      updateBtn.disabled = false;
      btnText.textContent = "Update Extension";
      spinner.classList.add("d-none");
    }
  }

  /**
   * Open delete confirmation modal
   * @param {string} extensionId - Extension ID
   */
  function openDeleteModal(extensionId) {
    // Find extension in whitelist data
    const extension = whitelistData.find(
      (ext) => ext.extensionId === extensionId
    );

    if (!extension) {
      Toast.error("Extension not found");
      return;
    }

    // Set current extension ID
    currentExtensionId = extensionId;

    // Set extension name in confirmation message
    document.getElementById("delete-extension-name").textContent =
      extension.name || extension.extensionId;

    // Show modal
    deleteModal.show();
  }

  /**
   * Delete extension from whitelist
   */
  async function deleteExtension() {
    // Show loading state
    const deleteBtn = document.getElementById("confirm-delete");
    const btnText = deleteBtn.querySelector(".btn-text");
    const spinner = document.getElementById("delete-spinner");

    deleteBtn.disabled = true;
    btnText.textContent = "Deleting...";
    spinner.classList.remove("d-none");

    try {
      // Call API to delete extension
      await WhitelistAPI.removeExtension(currentExtensionId);

      // Update whitelist data
      whitelistData = whitelistData.filter(
        (ext) => ext.extensionId !== currentExtensionId
      );

      // Re-render whitelist
      filterWhitelist();

      // Show success message
      Toast.success("Extension removed from whitelist successfully");

      // Close modal
      deleteModal.hide();
    } catch (error) {
      console.error("Delete extension error:", error);
      Toast.error(error.message || "Failed to delete extension");
    } finally {
      // Reset loading state
      deleteBtn.disabled = false;
      btnText.textContent = "Delete";
      spinner.classList.add("d-none");
    }
  }
}