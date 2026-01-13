// API utility functions for authentication
const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function with timeout
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
    signal: controller.signal,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    console.error('API call error:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Sign up a new user
  signup: async (userData) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Verify email with 6-digit code
  verifyEmailCode: async ({ email, code }) => {
    return apiCall('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Resend verification code
  resendEmailCode: async ({ email }) => {
    return apiCall('/auth/resend-email-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Sign in existing user
  signin: async (credentials) => {
    return apiCall('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Logout user
  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiCall('/auth/me');
  },

  // Check authentication status
  checkAuth: async () => {
    return apiCall('/auth/check');
  },

  // Forgot password - send verification code
  forgotPassword: async ({ email }) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify reset code
  verifyResetCode: async ({ email, code }) => {
    return apiCall('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Reset password
  resetPassword: async ({ email, code, newPassword }) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },
};

// Alert management system with premium styling
let alertCounter = 0;
const activeAlerts = new Map();

// Theme colors for alerts
const themeColors = {
  success: {
    bg: '#FFFFFF',
    border: '#5A9690',
    iconBg: '#5A9690',
    iconColor: '#FFFFFF',
    text: '#432323',
    progress: '#5A9690'
  },
  error: {
    bg: '#FFFFFF',
    border: '#DC2626',
    iconBg: '#DC2626',
    iconColor: '#FFFFFF',
    text: '#432323',
    progress: '#DC2626'
  },
  warning: {
    bg: '#FFF8F5',
    border: '#E2B59A',
    iconBg: '#E2B59A',
    iconColor: '#432323',
    text: '#432323',
    progress: '#E2B59A'
  },
  info: {
    bg: '#F0F7F6',
    border: '#2F5755',
    iconBg: '#2F5755',
    iconColor: '#FFFFFF',
    text: '#432323',
    progress: '#2F5755'
  }
};

// Utility function to show alerts with proper stacking
export const showAlert = (message, type = 'error', duration = 5000) => {
  // Remove any existing alerts of the same type to prevent spam
  const existingAlert = document.querySelector(`[data-alert-type="${type}"]`);
  if (existingAlert) {
    existingAlert.remove();
  }

  // Create unique ID for this alert
  const alertId = `alert-${++alertCounter}`;
  const colors = themeColors[type] || themeColors.error;
  
  // Calculate top position based on existing alerts - start at 80px from top
  const existingAlerts = document.querySelectorAll('[data-alert-type]');
  const baseTopOffset = 80; // 80px from top (not fully at top)
  const topOffset = existingAlerts.length * 88 + baseTopOffset; // 88px spacing between alerts
  
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.id = alertId;
  alertContainer.setAttribute('data-alert-type', type);
  alertContainer.style.cssText = `
    position: fixed;
    top: ${topOffset}px;
    right: 20px;
    z-index: 9999;
    max-width: 420px;
    width: calc(100vw - 40px);
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
    pointer-events: auto;
  `;
  
  // Create alert element with premium design
  const alert = document.createElement('div');
  alert.style.cssText = `
    position: relative;
    background: ${colors.bg};
    border-left: 4px solid ${colors.border};
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(67, 35, 35, 0.15), 0 4px 12px rgba(67, 35, 35, 0.1);
    padding: 18px 20px;
    font-family: 'Inter', -apple-system, Roboto, Helvetica, sans-serif;
    min-height: 64px;
    display: flex;
    align-items: center;
    gap: 14px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Icon HTML
  const icon = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      min-width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${colors.iconBg};
      color: ${colors.iconColor};
      flex-shrink: 0;
      font-weight: bold;
      font-size: 16px;
    ">
      ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
    </div>
  `;
  
  // Progress bar HTML
  const progressBar = `
    <div style="
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: ${colors.progress};
      border-radius: 0 0 12px 12px;
      animation: alertProgress ${duration}ms linear forwards;
    "></div>
  `;
  
  // Close button HTML
  const closeButton = `
    <button onclick="removeAlert('${alertId}')" style="
      flex-shrink: 0;
      padding: 6px;
      margin-left: 8px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: ${colors.text};
      opacity: 0.5;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    " onmouseover="this.style.opacity='1'; this.style.background='rgba(67, 35, 35, 0.08)'" onmouseout="this.style.opacity='0.5'; this.style.background='transparent'">
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  `;
  
  alert.innerHTML = `
    ${icon}
    <div style="flex: 1; min-width: 0; word-wrap: break-word; color: ${colors.text}; font-size: 14px; font-weight: 500; line-height: 1.5;">
      ${message.replace(/[⚠️✅❌🎉📩📨]/g, '').trim()}
    </div>
    ${closeButton}
    ${progressBar}
  `;

  alertContainer.appendChild(alert);
  document.body.appendChild(alertContainer);

  // Store alert reference
  activeAlerts.set(alertId, alertContainer);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      alertContainer.style.transform = 'translateX(0)';
      alertContainer.style.opacity = '1';
    });
  });

  // Auto remove after specified duration
  setTimeout(() => {
    removeAlert(alertId);
  }, duration);

  // Add CSS animations if not already added
  if (!document.querySelector('#alert-styles')) {
    const style = document.createElement('style');
    style.id = 'alert-styles';
    style.textContent = `
      @keyframes alertProgress {
        from { width: 100%; }
        to { width: 0%; }
      }
      [data-alert-type]:hover {
        box-shadow: 0 12px 40px rgba(67, 35, 35, 0.2), 0 6px 16px rgba(67, 35, 35, 0.15) !important;
        transform: translateX(0) translateY(-2px) !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Function to remove specific alert
window.removeAlert = (alertId) => {
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    alertElement.style.transform = 'translateX(100%)';
    alertElement.style.opacity = '0';
    setTimeout(() => {
      if (alertElement.parentElement) {
        alertElement.remove();
        activeAlerts.delete(alertId);
        repositionAlerts();
      }
    }, 300);
  }
};

// Function to reposition remaining alerts
const repositionAlerts = () => {
  const existingAlerts = document.querySelectorAll('[data-alert-type]');
  const baseTopOffset = 80;
  existingAlerts.forEach((alert, index) => {
    const topOffset = index * 88 + baseTopOffset;
    alert.style.top = `${topOffset}px`;
  });
};

// Function to clear all alerts
export const clearAllAlerts = () => {
  const allAlerts = document.querySelectorAll('[data-alert-type]');
  allAlerts.forEach(alert => alert.remove());
  activeAlerts.clear();
};

// Utility function to validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to validate password strength
export const validatePassword = (password) => {
  const minLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    errors: {
      minLength: !minLength ? 'Password must be at least 6 characters' : null,
      hasUpperCase: !hasUpperCase ? 'Password must contain at least one uppercase letter' : null,
      hasLowerCase: !hasLowerCase ? 'Password must contain at least one lowercase letter' : null,
      hasNumber: !hasNumber ? 'Password must contain at least one number' : null,
    }
  };
};

// Utility function to format date for API
export const formatDateForAPI = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

// Utility function to get age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};