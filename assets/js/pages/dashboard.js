/**
 * Dashboard page script
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize layout and UI components
  initLayout();
  initUserMenu();

  // Load data for dashboard
  await loadDashboardData();
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
 * Load dashboard data from API
 */
async function loadDashboardData() {
  try {
    // Load data in parallel
    const [whitelist, stats, activities] = await Promise.all([
      WhitelistAPI.getAllExtensions(),
      ActivityAPI.getActivityStats(),
      ActivityAPI.getAllActivities({ limit: 10 }),
    ]);

    // Update dashboard stats
    updateDashboardStats(whitelist, stats);

    // Update charts
    createActivityChart(stats.data.dailyCounts);
    createActionTypesChart(stats.data.actionCounts);

    // Display recent activity
    displayRecentActivities(activities.data);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    Toast.error("Failed to load dashboard data. Please try again later.");
  }
}

/**
 * Update dashboard statistics
 * @param {Object} whitelist - Whitelist data
 * @param {Object} stats - Activity statistics
 */
function updateDashboardStats(whitelist, stats) {
  // Update whitelist count
  document.getElementById("whitelist-count").textContent = whitelist.count || 0;

  // Calculate blocked attempts (whitelist violations)
  const blockedCount =
    stats.data.actionCounts.find((item) => item._id === "WHITELIST_VIOLATION")
      ?.count || 0;
  document.getElementById("blocked-count").textContent = blockedCount;

  // Get active users count (unique user IDs)
  document.getElementById("active-users").textContent =
    stats.data.activeUsers.length || 0;

  // Sum all action counts for total logs
  const totalLogs = stats.data.actionCounts.reduce(
    (sum, item) => sum + item.count,
    0
  );
  document.getElementById("total-logs").textContent = totalLogs;
}

/**
 * Create activity over time chart
 * @param {Array} dailyCounts - Daily activity counts
 */
function createActivityChart(dailyCounts) {
  const ctx = document.getElementById("activity-chart").getContext("2d");

  // Prepare chart data
  const chartData = {
    labels: dailyCounts.map((item) => item._id),
    datasets: [
      {
        label: "Activity Count",
        data: dailyCounts.map((item) => item.count),
        backgroundColor: "rgba(52, 152, 219, 0.2)",
        borderColor: "rgba(52, 152, 219, 1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Create chart
  const activityChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });

  // Handle period change
  document.getElementById("chart-period").addEventListener("change", (e) => {
    const days = parseInt(e.target.value);

    // Filter data for selected period
    const filteredData = dailyCounts.slice(-days).map((item) => item.count);

    const filteredLabels = dailyCounts.slice(-days).map((item) => item._id);

    // Update chart
    activityChart.data.labels = filteredLabels;
    activityChart.data.datasets[0].data = filteredData;
    activityChart.update();
  });
}

/**
 * Create action types chart
 * @param {Array} actionCounts - Action type counts
 */
function createActionTypesChart(actionCounts) {
  const ctx = document.getElementById("action-types-chart").getContext("2d");

  // Prepare chart data
  const chartData = {
    labels: actionCounts.map((item) => formatActionType(item._id)),
    datasets: [
      {
        data: actionCounts.map((item) => item.count),
        backgroundColor: [
          "rgba(52, 152, 219, 0.7)", // Blue
          "rgba(46, 204, 113, 0.7)", // Green
          "rgba(231, 76, 60, 0.7)", // Red
          "rgba(230, 126, 34, 0.7)", // Orange
          "rgba(155, 89, 182, 0.7)", // Purple
          "rgba(52, 73, 94, 0.7)", // Dark
          "rgba(241, 196, 15, 0.7)", // Yellow
        ],
        borderWidth: 1,
      },
    ],
  };

  // Create chart
  const actionChart = new Chart(ctx, {
    type: "doughnut",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 15,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw;
              const percentage = Math.round(
                (value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100
              );
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Format action type for display
 * @param {string} action - Action type
 * @returns {string} - Formatted action type
 */
function formatActionType(action) {
  if (!action) return "Unknown";

  // Replace underscores with spaces
  const formattedAction = action.replace(/_/g, " ");

  // Convert to title case
  return formattedAction
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Display recent activities
 * @param {Array} activities - Recent activities
 */
function displayRecentActivities(activities) {
  const container = document.getElementById("recent-activity-container");

  // Clear loading spinner
  container.innerHTML = "";

  if (!activities || activities.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No recent activities found</div>';
    return;
  }

  // Create activity list
  const activityList = document.createElement("ul");
  activityList.className = "activity-list";

  // Add activity items
  activities.forEach((activity) => {
    const activityItem = document.createElement("li");
    activityItem.className = "activity-item";

    // Determine icon and color based on action type
    let iconClass = "fas fa-info-circle";
    let iconColor = "bg-secondary";

    switch (activity.action) {
      case "EXTENSION_INSTALLED":
        iconClass = "fas fa-download";
        iconColor = "bg-info";
        break;
      case "EXTENSION_UNINSTALLED":
        iconClass = "fas fa-trash-alt";
        iconColor = "bg-secondary";
        break;
      case "EXTENSION_ENABLED":
        iconClass = "fas fa-check-circle";
        iconColor = "bg-success";
        break;
      case "EXTENSION_DISABLED":
        iconClass = "fas fa-times-circle";
        iconColor = "bg-secondary";
        break;
      case "WHITELIST_VIOLATION":
        iconClass = "fas fa-exclamation-triangle";
        iconColor = "bg-danger";
        break;
      case "GUARDIAN_DISABLED":
        iconClass = "fas fa-shield-alt";
        iconColor = "bg-warning";
        break;
      case "WHITELIST_UPDATED":
        iconClass = "fas fa-list";
        iconColor = "bg-primary";
        break;
      case "LOGIN":
        iconClass = "fas fa-sign-in-alt";
        iconColor = "bg-info";
        break;
      case "LOGOUT":
        iconClass = "fas fa-sign-out-alt";
        iconColor = "bg-secondary";
        break;
    }

    // Format activity message
    const activityMessage = formatActivityMessage(activity);

    // Format timestamp
    const timestamp = new Date(activity.timestamp).toLocaleString();

    // Create activity content
    activityItem.innerHTML = `
        <div class="activity-icon ${iconColor} text-white">
          <i class="${iconClass}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${activityMessage}</div>
          <div class="activity-time">${timestamp}</div>
        </div>
      `;

    activityList.appendChild(activityItem);
  });

  // Add to container
  container.appendChild(activityList);
}

/**
 * Format activity message for display
 * @param {Object} activity - Activity data
 * @returns {string} - Formatted message
 */
function formatActivityMessage(activity) {
  switch (activity.action) {
    case "EXTENSION_INSTALLED":
      return `Extension ${
        activity.details?.name || activity.extensionId
      } was installed`;

    case "EXTENSION_UNINSTALLED":
      return `Extension ${
        activity.details?.extensionName || activity.extensionId
      } was uninstalled`;

    case "EXTENSION_ENABLED":
      return `Extension ${
        activity.details?.name || activity.extensionId
      } was enabled`;

    case "EXTENSION_DISABLED":
      return `Extension ${
        activity.details?.name || activity.extensionId
      } was disabled`;

    case "WHITELIST_VIOLATION":
      if (activity.details?.type === "unauthorized_installation") {
        return `Blocked unauthorized installation of ${
          activity.details?.name || activity.extensionId
        }`;
      } else if (activity.details?.type === "unauthorized_enable") {
        return `Blocked unauthorized enabling of ${
          activity.details?.name || activity.extensionId
        }`;
      } else {
        return `Whitelist violation detected: ${
          activity.details?.type || "unknown"
        }`;
      }

    case "GUARDIAN_DISABLED":
      return "Guardian extension was disabled";

    case "WHITELIST_UPDATED":
      if (activity.details?.operation === "add") {
        return `Extension ${
          activity.details?.extensionName || activity.extensionId
        } added to whitelist`;
      } else if (activity.details?.operation === "update") {
        return `Extension ${
          activity.details?.extensionName || activity.extensionId
        } updated in whitelist`;
      } else if (activity.details?.operation === "remove") {
        return `Extension ${
          activity.details?.extensionName || activity.extensionId
        } removed from whitelist`;
      } else {
        return "Whitelist was updated";
      }

    case "LOGIN":
      return "User logged in";

    case "LOGOUT":
      return "User logged out";

    default:
      return formatActionType(activity.action);
  }
}
