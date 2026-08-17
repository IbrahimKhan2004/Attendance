// js/core/api.js
export const API_URL = '/api';

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Unauthorized, clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }

    return response;
};
