// API utility functions for polls and petitions
const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function with timeout
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
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
      // Create error object with message and preserve errors array if present
      const error = new Error(data.message || `HTTP error! status: ${response.status}`);
      if (data.errors) {
        error.errors = data.errors;
      }
      throw error;
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

// Polls API
export const pollsAPI = {
  // Get all polls
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/polls${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },

  // Get single poll
  getById: async (id) => {
    return apiCall(`/polls/${id}`);
  },

  // Create poll
  create: async (pollData) => {
    return apiCall('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },

  // Vote on poll
  vote: async (pollId, optionId) => {
    return apiCall(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  },

  // Submit feedback for a poll (after voting)
  feedback: async (pollId, feedbackData) => {
    return apiCall(`/polls/${pollId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  // Get feedback for a poll (only allowed users will see it)
  getFeedback: async (pollId) => {
    return apiCall(`/polls/${pollId}/feedback`);
  },

  // Update poll
  update: async (pollId, pollData) => {
    return apiCall(`/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },

  // Delete poll
  delete: async (pollId) => {
    return apiCall(`/polls/${pollId}`, {
      method: 'DELETE',
    });
  },

  // Approve poll (officials only)
  approve: async (pollId) => {
    return apiCall(`/polls/${pollId}/approve`, {
      method: 'PUT',
    });
  },

  // Reject poll (officials only)
  reject: async (pollId, reason) => {
    return apiCall(`/polls/${pollId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },
};

// Petitions API
export const petitionsAPI = {
  // Get all petitions
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/petitions${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },

  // Get single petition
  getById: async (id) => {
    return apiCall(`/petitions/${id}`);
  },

  // Create petition
  create: async (petitionData) => {
    return apiCall('/petitions', {
      method: 'POST',
      body: JSON.stringify(petitionData),
    });
  },

  // Sign petition
  sign: async (petitionId) => {
    return apiCall(`/petitions/${petitionId}/sign`, {
      method: 'POST',
    });
  },

  // Update petition
  update: async (petitionId, petitionData) => {
    return apiCall(`/petitions/${petitionId}`, {
      method: 'PUT',
      body: JSON.stringify(petitionData),
    });
  },

  // Delete petition
  delete: async (petitionId) => {
    return apiCall(`/petitions/${petitionId}`, {
      method: 'DELETE',
    });
  },

  // Approve petition (officials only)
  approve: async (petitionId) => {
    return apiCall(`/petitions/${petitionId}/approve`, {
      method: 'PUT',
    });
  },

  // Reject petition (officials only)
  reject: async (petitionId, reason) => {
    return apiCall(`/petitions/${petitionId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },
};

// Reports API
export const reportsAPI = {
  // Get overview metrics and charts
  getOverview: async (scope = 'community', month) => {
    const params = new URLSearchParams({ scope });
    if (month) {
      params.append('month', month);
    }
    return apiCall(`/reports/overview?${params.toString()}`);
  },
};

