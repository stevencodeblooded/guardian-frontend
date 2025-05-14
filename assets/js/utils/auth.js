/**
 * Authentication utility functions
 */
class AuthUtils {
  /**
   * Local storage key for auth token
   */
  static TOKEN_KEY = "guardian_auth_token";

  /**
   * Local storage key for user data
   */
  static USER_KEY = "guardian_user";

  /**
   * Get authentication token from storage
   * @returns {string|null} - Authentication token or null if not found
   */
  static getToken() {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  /**
   * Set authentication token in storage
   * @param {string} token - Authentication token
   * @param {boolean} rememberMe - Whether to store in localStorage (persists between sessions)
   */
  static setToken(token, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Remove authentication token from storage
   */
  static removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Get user data from storage
   * @returns {Object|null} - User data or null if not found
   */
  static getUser() {
    const userData =
      localStorage.getItem(this.USER_KEY) ||
      sessionStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set user data in storage
   * @param {Object} user - User data
   */
  static setUser(user) {
    const storage = localStorage.getItem(this.TOKEN_KEY)
      ? localStorage
      : sessionStorage;
    storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Remove user data from storage
   */
  static removeUser() {
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Whether user is authenticated
   */
  static isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Check if user has admin role
   * @returns {boolean} - Whether user is an admin
   */
  static isAdmin() {
    const user = this.getUser();
    return user && user.role === "admin";
  }

  /**
   * Logout user by removing token and user data
   */
  static logout() {
    this.removeToken();
    this.removeUser();
  }

  /**
   * Initialize authentication - check token validity
   * Called on application startup
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  static async initAuth() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Try to get current user to verify token validity
      const response = await AuthAPI.getCurrentUser();
      this.setUser(response.user);
      return true;
    } catch (error) {
      // If token is invalid, remove it
      if (error.status === 401) {
        this.logout();
      }
      return false;
    }
  }

  /**
   * Check if current page requires authentication
   * Redirects to login page if not authenticated
   */
  static checkAuth() {
    if (!this.isAuthenticated()) {
      const currentPage = window.location.pathname.split("/").pop();

      // Skip check for auth pages
      const authPages = ["login.html", "register.html", "reset-password.html"];
      if (!authPages.includes(currentPage)) {
        window.location.href = "login.html";
      }
    }
  }

  /**
   * Check if user has permission to access current page
   * Redirects to dashboard if not authorized
   */
  static checkPermission() {
    // Pages that require admin role
    const adminPages = ["users.html"];

    const currentPage = window.location.pathname.split("/").pop();

    if (adminPages.includes(currentPage) && !this.isAdmin()) {
      window.location.href = "index.html";
    }
  }
}

// Initialize authentication check on every page load
document.addEventListener("DOMContentLoaded", () => {
  // Skip auth check for login/register pages
  const currentPage = window.location.pathname.split("/").pop();
  const authPages = ["login.html", "register.html", "reset-password.html"];

  if (!authPages.includes(currentPage)) {
    AuthUtils.checkAuth();
    AuthUtils.checkPermission();
  }
});
