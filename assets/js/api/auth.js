/**
 * Authentication API service
 */
class AuthAPI {
  /**
   * User login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{token: string, user: Object}>} - Authentication token and user data
   */
  static async login(email, password) {
    const response = await API.post("/auth/login", { email, password }, false);
    return response;
  }

  /**
   * User registration
   * @param {string} name - User name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{token: string, user: Object}>} - Authentication token and user data
   */
  static async register(name, email, password) {
    const response = await API.post(
      "/auth/register",
      { name, email, password },
      false
    );
    return response;
  }

  /**
   * Get current user information
   * @returns {Promise<{user: Object}>} - User data
   */
  static async getCurrentUser() {
    const response = await API.get("/auth/me");
    return response;
  }

  /**
   * Update user details
   * @param {Object} userData - User data to update
   * @returns {Promise<{user: Object}>} - Updated user data
   */
  static async updateUserDetails(userData) {
    const response = await API.put("/auth/update-details", userData);
    return response;
  }

  /**
   * Update user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{token: string}>} - New authentication token
   */
  static async updatePassword(currentPassword, newPassword) {
    const response = await API.put("/auth/update-password", {
      currentPassword,
      newPassword,
    });
    return response;
  }

  /**
   * Logout user
   * @returns {Promise<{message: string}>} - Logout message
   */
  static async logout() {
    const response = await API.post("/auth/logout", {});
    return response;
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<{users: Array}>} - List of users
   */
  static async getAllUsers() {
    const response = await API.get("/auth/users");
    return response;
  }

  /**
   * Delete a user (admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<{message: string}>} - Deletion message
   */
  static async deleteUser(userId) {
    const response = await API.delete(`/auth/users/${userId}`);
    return response;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<{message: string}>} - Reset message
   */
  static async requestPasswordReset(email) {
    // This would typically call a backend endpoint to send a reset email
    // For now, this is a placeholder since the backend implementation wasn't shown
    const response = await API.post("/auth/forgot-password", { email }, false);
    return response;
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>} - Reset message
   */
  static async resetPassword(token, newPassword) {
    // This would typically verify a reset token and update the password
    // For now, this is a placeholder since the backend implementation wasn't shown
    const response = await API.post(
      "/auth/reset-password",
      {
        token,
        password: newPassword,
      },
      false
    );
    return response;
  }
}
