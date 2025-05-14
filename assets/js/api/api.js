/**
 * Base API service for handling HTTP requests
 */
class API {
  /**
   * Base URL for API requests
   */
  static baseUrl = "http://localhost:5000/api";

  /**
   * Set the base URL for API requests
   * @param {string} url - The base URL
   */
  static setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Make an HTTP request
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {Object} data - Request data
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - Response data
   */
  static async request(
    endpoint,
    method = "GET",
    data = null,
    requiresAuth = true
  ) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = AuthUtils.getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    // Add request body for POST, PUT methods
    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      // Parse response body as JSON
      const responseData = await response.json();

      // Handle API error responses
      if (!response.ok) {
        const error = new Error(responseData.message || "API request failed");
        error.status = response.status;
        error.errors = responseData.errors;
        throw error;
      }

      return responseData;
    } catch (error) {
      // Handle network errors or JSON parsing errors
      if (!error.status) {
        error.message = "Network error. Please check your connection.";
      }
      throw error;
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - Response data
   */
  static async get(endpoint, requiresAuth = true) {
    return this.request(endpoint, "GET", null, requiresAuth);
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - Response data
   */
  static async post(endpoint, data, requiresAuth = true) {
    return this.request(endpoint, "POST", data, requiresAuth);
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - Response data
   */
  static async put(endpoint, data, requiresAuth = true) {
    return this.request(endpoint, "PUT", data, requiresAuth);
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<any>} - Response data
   */
  static async delete(endpoint, requiresAuth = true) {
    return this.request(endpoint, "DELETE", null, requiresAuth);
  }
}
