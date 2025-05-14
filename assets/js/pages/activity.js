/**
 * Activity logs page script
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize layout and UI components
  initLayout();
  initUserMenu();

  // Initialize activity logs management
  initActivityLogsManagement();
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
 * Initialize activity logs management
 */
function initActivityLogsManagement() {
  // Cache DOM elements
  const logsTableBody = document.getElementById("logs-table-body");
  const emptyState = document.getElementById("empty-state");
  const actionFilter = document.getElementById("action-filter");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const paginationContainer = document.getElementById("pagination-container");
  const pagination = document.getElementById("pagination");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const showingStart = document.getElementById("showing-start");
  const showingEnd = document.getElementById("showing-end");
  const totalLogs = document.getElementById("total-logs");

  // Initialize details modal
  const logDetailsModal = new Modal("log-details-modal");

  // Set default date filters (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  startDateInput.valueAsDate = thirtyDaysAgo;
  endDateInput.valueAsDate = today;

  // Pagination state
  let currentPage = 1;
  let totalPages = 1;
  let pageSize = 20;
  let totalItems = 0;

  // Current filters
  let currentFilters = {
    page: currentPage,
    limit: pageSize,
    action: "",
    startDate: startDateInput.value,
    endDate: endDateInput.value,
  };

  // Load initial data
  loadActivityLogs(currentFilters);

  // Add event listeners
  applyFiltersBtn.addEventListener("click", () => {
    // Update filters
    currentFilters = {
      page: 1, // Reset to first page
      limit: pageSize,
      action: actionFilter.value,
      startDate: startDateInput.value,
      endDate: endDateInput.value,
    };

    // Load logs with new filters
    loadActivityLogs(currentFilters);
  });

  clearFiltersBtn.addEventListener("click", () => {
    // Reset filters
    actionFilter.value = "";
    startDateInput.valueAsDate = thirtyDaysAgo;
    endDateInput.valueAsDate = today;

    currentFilters = {
      page: 1,
      limit: pageSize,
      action: "",
      startDate: startDateInput.value,
      endDate: endDateInput.value,
    };

    // Load logs with reset filters
    loadActivityLogs(currentFilters);
  });

  // Pagination event listeners
  prevPageBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (currentPage > 1) {
      currentPage--;
      currentFilters.page = currentPage;
      loadActivityLogs(currentFilters);
    }
  });

  nextPageBtn.addEventListener("click", (e) => {
    e.preventDefault();

    if (currentPage < totalPages) {
      currentPage++;
      currentFilters.page = currentPage;
      loadActivityLogs(currentFilters);
    }
  });

  // Add event listener to close details modal
  document.getElementById("close-details").addEventListener("click", () => {
    logDetailsModal.hide();
  });

  document.getElementById("close-log-modal").addEventListener("click", () => {
    logDetailsModal.hide();
  });

  /**
   * Load activity logs from API
   * @param {Object} filters - Query filters
   */
  async function loadActivityLogs(filters) {
    console.log("Loading activity logs with filters:", filters);
    console.log("API base URL:", API.baseUrl);

    try {
      // Show loading state
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="spinner-container">
              <div class="spinner"></div>
            </div>
          </td>
        </tr>
      `;

      // Hide empty state
      emptyState.classList.add("d-none");

      // Call API to get logs
      console.log("Calling ActivityAPI.getAllActivities with:", filters);
      const response = await ActivityAPI.getAllActivities(filters);
      console.log("Activity logs API response:", response);

      // Check if response structure is as expected
      if (!response || !response.data) {
        console.error("Unexpected response structure:", response);
        throw new Error("Invalid response format from API");
      }

      // Handle case where there are no logs
      if (!response.data.length) {
        console.log("No activity logs found");
        // Show empty state
        emptyState.classList.remove("d-none");
        document.getElementById("logs-table").classList.add("d-none");
        paginationContainer.classList.add("d-none");

        // Update pagination info
        showingStart.textContent = 0;
        showingEnd.textContent = 0;
        totalLogs.textContent = 0;
        return;
      }

      // If we have data, ensure pagination info exists
      if (!response.pagination) {
        console.warn("No pagination info found in response:", response);
        // Set default pagination values
        totalItems = response.data.length;
        totalPages = 1;
        currentPage = 1;
      } else {
        // Update pagination state
        totalItems = response.pagination.total;
        totalPages = response.pagination.pages;
        currentPage = response.pagination.page;
      }

      // Update pagination display
      updatePagination();

      // Update showing info
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalItems);
      showingStart.textContent = totalItems > 0 ? start : 0;
      showingEnd.textContent = end;
      totalLogs.textContent = totalItems;

      // Render logs
      console.log("Rendering logs:", response.data);
      renderLogs(response.data);
    } catch (error) {
      console.error("Failed to load activity logs:", error);

      if (error.status) {
        console.error("API error status:", error.status);
        console.error("API error message:", error.message);
      }

      Toast.error("Failed to load activity logs. Please try again later.");

      // Show error state
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <div class="empty-state-icon text-danger">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <h3 class="empty-state-title">Error Loading Data</h3>
              <p class="empty-state-description">${
                error.message || "Failed to load activity logs."
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
   * Render logs in table
   * @param {Array} logs - Activity logs
   */
  function renderLogs(logs) {
    // Show empty state if no logs
    if (!logs || logs.length === 0) {
      emptyState.classList.remove("d-none");
      document.getElementById("logs-table").classList.add("d-none");
      paginationContainer.classList.add("d-none");
      return;
    }

    // Hide empty state if logs exist
    emptyState.classList.add("d-none");
    document.getElementById("logs-table").classList.remove("d-none");
    paginationContainer.classList.remove("d-none");

    // Build table rows
    let tableHtml = "";

    logs.forEach((log) => {
      // Format timestamp
      const timestamp = new Date(log.timestamp).toLocaleString();

      // Format action
      const actionBadgeClass = getActionBadgeClass(log.action);
      const actionBadge = `<span class="badge ${actionBadgeClass}">${formatActionName(
        log.action
      )}</span>`;

      // User ID (shortened)
      const userId = log.userId ? log.userId.substring(0, 8) + "..." : "N/A";

      // Extension ID (shortened if exists)
      const extensionId = log.extensionId
        ? log.extensionId.substring(0, 8) + "..."
        : "N/A";

      // IP Address
      const ipAddress = log.ipAddress || "N/A";

      // Details button
      const detailsBtn = `<button class="btn btn-sm btn-secondary view-log-btn" data-log-id="${logs.indexOf(
        log
      )}"><i class="fas fa-eye"></i></button>`;

      tableHtml += `
          <tr>
            <td>${timestamp}</td>
            <td>${actionBadge}</td>
            <td>${userId}</td>
            <td>${extensionId}</td>
            <td>${ipAddress}</td>
            <td>${detailsBtn}</td>
          </tr>
        `;
    });

    // Update table
    logsTableBody.innerHTML = tableHtml;

    // Add event listeners to detail buttons
    document.querySelectorAll(".view-log-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const logIndex = parseInt(btn.dataset.logId);
        openLogDetailsModal(logs[logIndex]);
      });
    });
  }

  /**
   * Get CSS class for action badge
   * @param {string} action - Action type
   * @returns {string} - CSS class name
   */
  function getActionBadgeClass(action) {
    switch (action) {
      case "EXTENSION_INSTALLED":
      case "EXTENSION_ENABLED":
        return "badge-success";

      case "EXTENSION_UNINSTALLED":
      case "EXTENSION_DISABLED":
      case "LOGOUT":
        return "badge-secondary";

      case "WHITELIST_VIOLATION":
      case "GUARDIAN_UNINSTALL_ATTEMPT":
        return "badge-danger";

      case "GUARDIAN_DISABLED":
      case "BROWSER_CLOSED":
      case "COOKIES_CLEARED":
        return "badge-warning";

      case "LOGIN":
      case "WHITELIST_UPDATED":
        return "badge-primary";

      default:
        return "badge-info";
    }
  }

  /**
   * Format action name for display
   * @param {string} action - Action type
   * @returns {string} - Formatted action name
   */
  function formatActionName(action) {
    if (!action) return "Unknown";

    // Replace underscores with spaces
    const formattedAction = action.replace(/_/g, " ");

    // Title case
    return formattedAction
      .split(" ")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Update pagination display
   */
  function updatePagination() {
    // Update previous/next buttons
    prevPageBtn.parentElement.classList.toggle("disabled", currentPage <= 1);
    nextPageBtn.parentElement.classList.toggle(
      "disabled",
      currentPage >= totalPages
    );

    // Build pagination links
    let paginationHtml = `
        <li class="page-item ${currentPage <= 1 ? "disabled" : ""}">
          <a class="page-link" href="#" id="prev-page">
            <i class="fas fa-chevron-left"></i>
          </a>
        </li>
      `;

    // Determine range of page links to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if less than 5 pages
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // Add first page if not in range
    if (startPage > 1) {
      paginationHtml += `
          <li class="page-item">
            <a class="page-link" href="#" data-page="1">1</a>
          </li>
        `;

      // Add ellipsis if there's a gap
      if (startPage > 2) {
        paginationHtml += `
            <li class="page-item disabled">
              <span class="page-link">...</span>
            </li>
          `;
      }
    }

    // Add page links
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
          <li class="page-item ${i === currentPage ? "active" : ""}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
    }

    // Add last page if not in range
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        paginationHtml += `
            <li class="page-item disabled">
              <span class="page-link">...</span>
            </li>
          `;
      }

      paginationHtml += `
          <li class="page-item">
            <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
          </li>
        `;
    }

    paginationHtml += `
        <li class="page-item ${currentPage >= totalPages ? "disabled" : ""}">
          <a class="page-link" href="#" id="next-page">
            <i class="fas fa-chevron-right"></i>
          </a>
        </li>
      `;

    // Update pagination
    pagination.innerHTML = paginationHtml;

    // Add event listeners to page links
    pagination.querySelectorAll(".page-link").forEach((link) => {
      if (link.id === "prev-page") {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (currentPage > 1) {
            currentPage--;
            currentFilters.page = currentPage;
            loadActivityLogs(currentFilters);
          }
        });
      } else if (link.id === "next-page") {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          if (currentPage < totalPages) {
            currentPage++;
            currentFilters.page = currentPage;
            loadActivityLogs(currentFilters);
          }
        });
      } else if (link.dataset.page) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          currentPage = parseInt(link.dataset.page);
          currentFilters.page = currentPage;
          loadActivityLogs(currentFilters);
        });
      }
    });
  }

  /**
   * Open log details modal
   * @param {Object} log - Activity log
   */
  function openLogDetailsModal(log) {
    // Set log details in modal
    document.getElementById("log-action").textContent = formatActionName(
      log.action
    );
    document.getElementById("log-timestamp").textContent = new Date(
      log.timestamp
    ).toLocaleString();
    document.getElementById("log-user-id").textContent = log.userId || "N/A";
    document.getElementById("log-extension-id").textContent =
      log.extensionId || "N/A";
    document.getElementById("log-ip-address").textContent =
      log.ipAddress || "N/A";

    // Format browser info
    const browserInfoEl = document.getElementById("log-browser-info");
    if (log.browserInfo && Object.keys(log.browserInfo).length > 0) {
      browserInfoEl.textContent = JSON.stringify(log.browserInfo, null, 2);
      browserInfoEl.style.display = "block";
    } else {
      browserInfoEl.textContent = "No browser information available";
      browserInfoEl.style.display = "block";
    }

    // Format details
    const detailsEl = document.getElementById("log-details");
    if (log.details && Object.keys(log.details).length > 0) {
      detailsEl.textContent = JSON.stringify(log.details, null, 2);
      detailsEl.style.display = "block";
    } else {
      detailsEl.textContent = "No additional details available";
      detailsEl.style.display = "block";
    }

    // Show modal
    logDetailsModal.show();
  }
}
