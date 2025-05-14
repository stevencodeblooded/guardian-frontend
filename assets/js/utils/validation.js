/**
 * Form validation utility functions
 */
class ValidationUtils {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  static isValidEmail(email) {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Password strength info
   */
  static checkPasswordStrength(password) {
    // Initialize strength score
    let strength = 0;
    const feedback = [];

    // Check password length
    if (password.length < 8) {
      feedback.push("Password should be at least 8 characters long");
    } else {
      strength += 1;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      feedback.push("Password should contain at least one uppercase letter");
    } else {
      strength += 1;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      feedback.push("Password should contain at least one lowercase letter");
    } else {
      strength += 1;
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
      feedback.push("Password should contain at least one number");
    } else {
      strength += 1;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push("Password should contain at least one special character");
    } else {
      strength += 1;
    }

    // Calculate strength level
    let strengthLevel = "weak";
    if (strength >= 4) {
      strengthLevel = "strong";
    } else if (strength >= 3) {
      strengthLevel = "good";
    } else if (strength >= 2) {
      strengthLevel = "fair";
    }

    return {
      strength,
      strengthLevel,
      feedback,
    };
  }

  /**
   * Validate form fields
   * @param {Object} fields - Object containing field names and values
   * @param {Object} rules - Validation rules for each field
   * @returns {Object} - Validation results
   */
  static validateForm(fields, rules) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, value] of Object.entries(fields)) {
      // Skip fields without rules
      if (!rules[fieldName]) continue;

      const fieldRules = rules[fieldName];
      const fieldErrors = [];

      // Check required rule
      if (fieldRules.required && (!value || value.trim() === "")) {
        fieldErrors.push(
          fieldRules.required === true
            ? `${this.formatFieldName(fieldName)} is required`
            : fieldRules.required
        );
      }

      // Check min length rule
      if (
        fieldRules.minLength &&
        value &&
        value.length < fieldRules.minLength
      ) {
        fieldErrors.push(
          `${this.formatFieldName(fieldName)} must be at least ${
            fieldRules.minLength
          } characters`
        );
      }

      // Check max length rule
      if (
        fieldRules.maxLength &&
        value &&
        value.length > fieldRules.maxLength
      ) {
        fieldErrors.push(
          `${this.formatFieldName(fieldName)} cannot be more than ${
            fieldRules.maxLength
          } characters`
        );
      }

      // Check email rule
      if (fieldRules.email && value && !this.isValidEmail(value)) {
        fieldErrors.push(`Please enter a valid email address`);
      }

      // Check pattern rule
      if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
        fieldErrors.push(
          fieldRules.patternMessage ||
            `${this.formatFieldName(fieldName)} format is invalid`
        );
      }

      // Check match rule
      if (fieldRules.match && value !== fields[fieldRules.match]) {
        fieldErrors.push(
          fieldRules.matchMessage ||
            `${this.formatFieldName(
              fieldName
            )} does not match ${this.formatFieldName(fieldRules.match)}`
        );
      }

      // Check custom validator
      if (fieldRules.validator && typeof fieldRules.validator === "function") {
        const customValidation = fieldRules.validator(value, fields);
        if (customValidation !== true) {
          fieldErrors.push(customValidation);
        }
      }

      // Add errors for this field
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return {
      isValid,
      errors,
    };
  }

  /**
   * Format field name for error messages
   * @param {string} fieldName - Field name
   * @returns {string} - Formatted field name
   */
  static formatFieldName(fieldName) {
    return fieldName
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Display form validation errors in the DOM
   * @param {Object} errors - Validation errors
   */
  static displayErrors(errors) {
    // Clear existing errors
    document
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));

    // Display new errors
    for (const [fieldName, fieldErrors] of Object.entries(errors)) {
      const errorElement = document.getElementById(`${fieldName}-error`);
      if (errorElement) {
        errorElement.textContent = fieldErrors[0]; // Display first error
      }
    }
  }

  /**
   * Validate Chrome extension ID
   * @param {string} extensionId - Extension ID to validate
   * @returns {boolean} - Whether extension ID is valid
   */
  static isValidExtensionId(extensionId) {
    const extensionIdRegex = /^[a-z]{32}$/;
    return extensionIdRegex.test(extensionId);
  }
}
