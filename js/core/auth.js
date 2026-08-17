// js/core/auth.js
import { API_URL } from './api.js';

export const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('appView').style.display = 'block';
        return user;
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('appView').style.display = 'none';
        return null;
    }
};

window.handleLogin = async () => {
    const usernameInput = document.getElementById('loginUsername').value;
    const passwordInput = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ _id: data._id, username: data.username, role: data.role }));
            errorDiv.style.display = 'none';
            // Reload to initialize app
            window.location.reload();
        } else {
            errorDiv.innerText = data.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.innerText = 'Network error. Please try again later.';
        errorDiv.style.display = 'block';
    }
};

window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};
