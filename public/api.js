// api.js

// --- Configuration ---
const LIVE_BASE_URL = 'https://food-order-backend-10l0.onrender.com'; 
const AUTH_TOKEN_KEY = 'food_app_signature';

// --- Utility Functions ---
export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

// --- Loading UI ---
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loading-overlay';
loadingOverlay.className = 'loading-overlay hidden';
loadingOverlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('loading-overlay-in-dom')) {
        loadingOverlay.id = 'loading-overlay-in-dom'; 
        document.body.appendChild(loadingOverlay);
    }
});

export function showLoading() {
    const overlay = document.getElementById('loading-overlay-in-dom');
    if (overlay) overlay.classList.remove('hidden');
}

export function hideLoading() {
    const overlay = document.getElementById('loading-overlay-in-dom');
    if (overlay) overlay.classList.add('hidden');
}

export function renderMessage(type, message) {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#004085';
    const background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#cce5ff';
    const border = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#b8daff';
    
    container.innerHTML = `<div class="message" style="padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: 600; text-align: center; color: ${color}; background-color: ${background}; border: 1px solid ${border};">${message}</div>`;
    
    setTimeout(() => container.innerHTML = '', 5000);
}

// --- API Call Core Function ---
export async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = false) {
    const token = getAuthToken();
    
    // --- NEW: Auth Check (Stops bad requests before they happen) ---
    if (requiresAuth && !token) {
        // Redirect logic is handled by app.js, but we throw here to stop execution
        throw new Error('Unauthorized: No token found');
    }

    // --- Dynamic Base URL Logic (FIXED) ---
    let finalUrl;

    // 1. Explicit Admin or Vendor routes
    if (endpoint.startsWith('/vandor') || endpoint.startsWith('/admin')) {
        finalUrl = `${LIVE_BASE_URL}${endpoint}`;
    } 
    // 2. Shopping Routes (Public info like restaurants, foods, search)
    else if (
        endpoint.startsWith('/top-restaurants') || 
        endpoint.startsWith('/foods-in-30-min') || 
        endpoint.startsWith('/search') || 
        endpoint.startsWith('/restaurant') || 
        endpoint.startsWith('/offers') || 
        /^\/\d{6}$/.test(endpoint) // Matches pincode like /121004
    ) {
        finalUrl = `${LIVE_BASE_URL}${endpoint}`;
    }
    // 3. Customer Routes (Everything else: Login, Signup, Cart, Orders, Profile)
    else {
        // If endpoint already has /customer, don't add it again
        if (endpoint.startsWith('/customer')) {
            finalUrl = `${LIVE_BASE_URL}${endpoint}`;
        } else {
            // Ensure it starts with slash
            const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            finalUrl = `${LIVE_BASE_URL}/customer${path}`;
        }
    }

    // --- Headers Logic ---
    const headers = {};
    
    // Only set JSON header if NOT sending FormData (Images/Files)
    if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method: method, headers: headers };

    if (body) {
        config.body = (body instanceof FormData) ? body : JSON.stringify(body);
    }

    try {
        showLoading();
        const response = await fetch(finalUrl, config);
        hideLoading();

        // Handle 401 Unauthorized explicitly
        if (response.status === 401) {
             removeAuthToken(); 
             // Don't throw immediately if we want to read the error message, 
             // but usually 401 means we should logout.
        }

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.message || 'API request failed';
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        hideLoading();
        console.error("API Call Error:", error);
        // Fallback error message if parsing fails (e.g. unexpected token)
        if (error.message.includes('Unexpected token')) {
            throw new Error('Server Error: Please check your internet or try again later.');
        }
        throw error;
    }
}