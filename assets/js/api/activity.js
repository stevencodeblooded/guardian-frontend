/**
 * Activity Logs API service
 */
class ActivityAPI {
  /**
   * Get all activity logs (admin only)
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of logs per page
   * @param {string} options.action - Filter by action type
   * @param {string} options.startDate - Filter by start date
   * @param {string} options.endDate - Filter by end date
   * @returns {Promise<{data: Array, pagination: Object}>} - Activity logs with pagination
   */
  static async getAllActivities(options = {}) {
    const queryParams = new URLSearchParams();

    if (options.page) queryParams.append("page", options.page);
    if (options.limit) queryParams.append("limit", options.limit);
    if (options.action) queryParams.append("action", options.action);
    if (options.startDate) queryParams.append("startDate", options.startDate);
    if (options.endDate) queryParams.append("endDate", options.endDate);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/activity?${queryString}` : "/activity";

    const response = await API.get(endpoint);
    return response;
  }

  /**
   * Get activities by user
   * @param {string} userId - User ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<{data: Array}>} - Activity logs for user
   */
  static async getActivitiesByUser(userId, limit = 100) {
    const response = await API.get(`/activity/user/${userId}?limit=${limit}`);
    return response;
  }

  /**
   * Get activities by extension
   * @param {string} extensionId - Extension ID
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<{data: Array}>} - Activity logs for extension
   */
  static async getActivitiesByExtension(extensionId, limit = 100) {
    const response = await API.get(
      `/activity/extension/${extensionId}?limit=${limit}`
    );
    return response;
  }

  /**
   * Get activity statistics
   * @returns {Promise<{data: Object}>} - Activity statistics
   */
  static async getActivityStats() {
    const response = await API.get("/activity/stats");
    return response;
  }

  /**
   * Log activity (mainly used by extension)
   * @param {Object} activityData - Activity data
   * @returns {Promise<{data: Object}>} - Created activity log
   */
  static async logActivity(activityData) {
    const response = await API.post("/activity", activityData);
    return response;
  }
}
