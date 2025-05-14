/**
 * User management page script
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Check if the user is admin
  if (!AuthUtils.isAdmin()) {
    window.location.href = "index.html";
    return;
  }

  // Initialize layout and UI components
  initLayout();
  initUserMenu();

  // Initialize user management
  initUserManagement();
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
 * Initialize user management functionality
 */
function initUserManagement() {
  // Cache DOM elements
  const usersTableBody = document.getElementById("users-table-body");
  const emptyState = document.getElementById("empty-state");
  const addUserBtn = document.getElementById("add-user-btn");
  const emptyAddBtn = document.getElementById("empty-add-btn");

  // Initialize modals
  const addUserModal = new Modal("add-user-modal");
  const deleteUserModal = new Modal("delete-user-modal");

  // Store users data
  let usersData = [];

  // Current user being deleted
  let currentUserId = null;

  // Load users data
  loadUsersData();

  // Add event listeners
  addUserBtn.addEventListener("click", openAddUserModal);
  emptyAddBtn.addEventListener("click", openAddUserModal);

  document
    .getElementById("cancel-add-user")
    .addEventListener("click", () => addUserModal.hide());
  document
    .getElementById("close-add-modal")
    .addEventListener("click", () => addUserModal.hide());
  document.getElementById("save-user").addEventListener("click", addUser);

  document
    .getElementById("cancel-delete")
    .addEventListener("click", () => deleteUserModal.hide());
  document
    .getElementById("close-delete-modal")
    .addEventListener("click", () => deleteUserModal.hide());
  document
    .getElementById("confirm-delete")
    .addEventListener("click", deleteUser);

  // Password strength meter
  const passwordInput = document.getElementById("user-password");
  const passwordStrength = document.getElementById("password-strength");
  const passwordStrengthMeter = document.querySelector(
    ".password-strength-value"
  );
  const passwordStrengthLabel = document.querySelector(
    ".password-strength-label"
  );

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;

      if (password.length === 0) {
        passwordStrength.classList.remove(
          "password-strength-weak",
          "password-strength-fair",
          "password-strength-good",
          "password-strength-strong"
        );
        passwordStrengthLabel.textContent = "";
        return;
      }

      const strength = ValidationUtils.checkPasswordStrength(password);

      // Reset classes
      passwordStrength.classList.remove(
        "password-strength-weak",
        "password-strength-fair",
        "password-strength-good",
        "password-strength-strong"
      );

      // Add appropriate class
      passwordStrength.classList.add(
        `password-strength-${strength.strengthLevel}`
      );

      // Update label
      passwordStrengthLabel.textContent = `${
        strength.strengthLevel.charAt(0).toUpperCase() +
        strength.strengthLevel.slice(1)
      } password`;
    });
  }

  /**
   * Load users data from API
   */
  async function loadUsersData() {
    try {
      // Show loading state
      usersTableBody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="spinner-container">
                <div class="spinner"></div>
              </div>
            </td>
          </tr>
        `;

      // Get users from API
      const response = await AuthAPI.getAllUsers();
      usersData = response.users || [];

      // Render users
      renderUsers();
    } catch (error) {
      console.error("Failed to load users data:", error);
      Toast.error("Failed to load users data. Please try again later.");

      // Show error state
      usersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              <div class="empty-state">
                <div class="empty-state-icon text-danger">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="empty-state-title">Error Loading Data</h3>
                <p class="empty-state-description">${
                  error.message || "Failed to load users data."
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
   * Render users in table
   */
  function renderUsers() {
    // Show empty state if no users
    if (usersData.length === 0) {
      emptyState.classList.remove("d-none");
      document.getElementById("users-table").classList.add("d-none");
      return;
    }

    // Hide empty state if users exist
    emptyState.classList.add("d-none");
    document.getElementById("users-table").classList.remove("d-none");

    // Get current user ID
    const currentUser = AuthUtils.getUser();

    // Build table rows
    let tableHtml = "";

    usersData.forEach((user) => {
      // Format dates
      const lastLogin = user.lastLogin
        ? new Date(user.lastLogin).toLocaleString()
        : "Never";
      const createdAt = new Date(user.createdAt).toLocaleDateString();

      // Determine if current user
      const isCurrentUser = user.id === currentUser.id;

      // Role badge
      const roleBadge =
        user.role === "admin"
          ? '<span class="badge badge-primary">Admin</span>'
          : '<span class="badge badge-secondary">User</span>';

      // Delete button (disabled for current user)
      const deleteBtn = !isCurrentUser
        ? `<button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}" data-name="${user.name}"><i class="fas fa-trash"></i></button>`
        : `<button class="btn btn-sm btn-danger" disabled title="Cannot delete your own account"><i class="fas fa-trash"></i></button>`;

      tableHtml += `
          <tr${isCurrentUser ? ' class="bg-light"' : ""}>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${roleBadge}</td>
            <td>${lastLogin}</td>
            <td>${createdAt}</td>
            <td>${deleteBtn}</td>
          </tr>
        `;
    });

    // Update table
    usersTableBody.innerHTML = tableHtml;

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const userId = btn.dataset.id;
        const userName = btn.dataset.name;
        openDeleteUserModal(userId, userName);
      });
    });
  }

  /**
   * Open add user modal
   */
  function openAddUserModal() {
    // Reset form
    document.getElementById("add-user-form").reset();
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Reset password strength meter
    passwordStrength.classList.remove(
      "password-strength-weak",
      "password-strength-fair",
      "password-strength-good",
      "password-strength-strong"
    );
    passwordStrengthLabel.textContent = "";

    // Show modal
    addUserModal.show();
  }

  /**
   * Add new user
   */
  async function addUser() {
    // Get form data
    const name = document.getElementById("user-name-input").value.trim();
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value;
    const role = document.getElementById("user-role").value;

    // Reset error messages
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Validate form fields
    const fields = { name, email, password };
    const rules = {
      name: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, email: true },
      password: {
        required: true,
        minLength: 8,
        validator: (value) => {
          const strength = ValidationUtils.checkPasswordStrength(value);
          return (
            strength.strength >= 3 ||
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          );
        },
      },
    };

    const validation = ValidationUtils.validateForm(fields, rules);

    if (!validation.isValid) {
      // Display errors
      ValidationUtils.displayErrors(validation.errors);
      return;
    }

    // Show loading state
    const saveBtn = document.getElementById("save-user");
    const btnText = saveBtn.querySelector(".btn-text");
    const spinner = document.getElementById("add-user-spinner");

    saveBtn.disabled = true;
    btnText.textContent = "Adding...";
    spinner.classList.remove("d-none");

    try {
      // Call API to register user
      const response = await AuthAPI.register(name, email, password, role);

      // Add new user to list
      usersData.push(response.user);

      // Re-render users
      renderUsers();

      // Show success message
      Toast.success("User added successfully");

      // Close modal
      addUserModal.hide();
    } catch (error) {
      console.error("Add user error:", error);

      // Show appropriate error message
      if (
        error.status === 400 &&
        error.message.includes("already registered")
      ) {
        document.getElementById("user-email-error").textContent =
          "This email is already registered";
      } else {
        Toast.error(error.message || "Failed to add user");
      }
    } finally {
      // Reset loading state
      saveBtn.disabled = false;
      btnText.textContent = "Add User";
      spinner.classList.add("d-none");
    }
  }

  /**
   * Open delete user confirmation modal
   * @param {string} userId - User ID
   * @param {string} userName - User name
   */
  function openDeleteUserModal(userId, userName) {
    // Set current user ID
    currentUserId = userId;

    // Set user name in confirmation message
    document.getElementById("delete-user-name").textContent = userName;

    // Show modal
    deleteUserModal.show();
  }

  /**
   * Delete user
   */
  async function deleteUser() {
    // Show loading state
    const deleteBtn = document.getElementById("confirm-delete");
    const btnText = deleteBtn.querySelector(".btn-text");
    const spinner = document.getElementById("delete-spinner");

    deleteBtn.disabled = true;
    btnText.textContent = "Deleting...";
    spinner.classList.remove("d-none");

    try {
      // Call API to delete user
      await AuthAPI.deleteUser(currentUserId);

      // Remove user from data
      usersData = usersData.filter((user) => user.id !== currentUserId);

      // Re-render users
      renderUsers();

      // Show success message
      Toast.success("User deleted successfully");

      // Close modal
      deleteUserModal.hide();
    } catch (error) {
      console.error("Delete user error:", error);
      Toast.error(error.message || "Failed to delete user");
    } finally {
      // Reset loading state
      deleteBtn.disabled = false;
      btnText.textContent = "Delete";
      spinner.classList.add("d-none");
    }
  }
}
