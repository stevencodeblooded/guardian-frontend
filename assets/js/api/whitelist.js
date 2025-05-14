/**
 * Whitelist API service
 */
class WhitelistAPI {
  /**
   * Get all whitelisted extensions
   * @param {Object} filters - Optional filters (isActive)
   * @returns {Promise<{data: Array}>} - List of whitelisted extensions
   */
  static async getAllExtensions(filters = {}) {
    let queryParams = "";

    if (filters.isActive !== undefined) {
      queryParams = `?isActive=${filters.isActive}`;
    }

    const response = await API.get(`/whitelist${queryParams}`);
    return response;
  }

  /**
   * Add extension to whitelist
   * @param {Object} extensionData - Extension data
   * @param {string} extensionData.extensionId - Extension ID
   * @param {string} extensionData.name - Extension name
   * @param {string} extensionData.description - Extension description
   * @param {string} extensionData.version - Extension version
   * @returns {Promise<{data: Object}>} - Added extension data
   */
  static async addExtension(extensionData) {
    const response = await API.post("/whitelist", extensionData);
    return response;
  }

  /**
   * Update whitelisted extension
   * @param {string} extensionId - Extension ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{data: Object}>} - Updated extension data
   */
  static async updateExtension(extensionId, updateData) {
    const response = await API.put(`/whitelist/${extensionId}`, updateData);
    return response;
  }

  /**
   * Remove extension from whitelist
   * @param {string} extensionId - Extension ID
   * @returns {Promise<{message: string}>} - Success message
   */
  static async removeExtension(extensionId) {
    const response = await API.delete(`/whitelist/${extensionId}`);
    return response;
  }

  /**
   * Get extension details
   * @param {string} extensionId - Extension ID
   * @returns {Promise<{data: Object}>} - Extension details
   */
  static async getExtensionDetails(extensionId) {
    const response = await API.get(`/whitelist/${extensionId}`);
    return response;
  }

  /**
   * Check if extension is whitelisted
   * @param {string} extensionId - Extension ID
   * @returns {Promise<{isWhitelisted: boolean}>} - Whether extension is whitelisted
   */
  static async checkIfWhitelisted(extensionId) {
    const response = await API.get(`/whitelist/check/${extensionId}`);
    return response;
  }
}
