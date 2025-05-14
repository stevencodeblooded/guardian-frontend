/**
 * Configuration API service
 */
class ConfigAPI {
  /**
   * Get extension configuration
   * @returns {Promise<{data: Object}>} - Configuration data
   */
  static async getConfig() {
    const response = await API.get("/config/all");
    return response;
  }

  /**
   * Update extension configuration
   * @param {Object} configData - Configuration data to update
   * @returns {Promise<{data: Object, updates: Array}>} - Updated configuration
   */
  static async updateConfig(configData) {
    const response = await API.put("/config", configData);
    return response;
  }

  /**
   * Reset configuration to defaults
   * @returns {Promise<{data: Object}>} - Default configuration
   */
  static async resetConfig() {
    const response = await API.post("/config/reset");
    return response;
  }

  /**
   * Get a specific configuration value
   * @param {string} key - Configuration key
   * @returns {Promise<{data: Object}>} - Configuration value
   */
  static async getConfigValue(key) {
    const response = await API.get(`/config/${key}`);
    return response;
  }

  /**
   * Delete a configuration value (reset to default)
   * @param {string} key - Configuration key
   * @returns {Promise<{data: Object}>} - Default configuration value
   */
  static async deleteConfigValue(key) {
    const response = await API.delete(`/config/${key}`);
    return response;
  }
}
