const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders(session, isFormData = false) {
    const headers = {};
    if (session?.user?.id) {
      headers['X-User-Id'] = session.user.id;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(endpoint, options = {}, session = null, isFormData = false) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(session, isFormData),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  async createJob(jobData, session) {
    return this.request('/api/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }, session);
  }

  async getJobs(session) {
    return this.request('/api/v1/jobs', {
      method: 'GET',
    }, session);
  }

  async getJob(jobId) {
    return this.request(`/api/v1/jobs/${jobId}`, {
      method: 'GET',
    });
  }

  async applyToJob(formData, session) {
    const url = `${this.baseURL}/api/v1/candidates/apply`;
    const headers = {};
    if (session?.user?.id) {
      headers['X-User-Id'] = session.user.id;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  async getJobCandidates(jobId, session) {
    return this.request(`/api/v1/candidates/jobs/${jobId}/candidates`, {
      method: 'GET',
    }, session);
  }

  async processJob(jobId, session) {
    return this.request(`/api/v1/jobs/${jobId}/process`, {
      method: 'POST',
    }, session);
  }

  async submitFeedback(jobId, feedback, session) {
    return this.request(`/api/v1/jobs/${jobId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    }, session);
  }
}

export const api = new ApiService();