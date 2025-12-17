import { apiCall, setAuthToken, removeAuthToken, getAuthToken, renderMessage } from './api.js';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const logoutBtn = document.getElementById('logout-btn');

// --- Check Auth State ---
const checkAuth = () => {
    const token = getAuthToken();
    if (token) {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        logoutBtn.style.display = 'block';
        loadVendorData();
    } else {
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
};

// --- 1. Vendor Login ---
document.getElementById('vendor-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('vendor-email').value;
    const password = document.getElementById('vendor-pass').value;

    try {
        const data = await apiCall('/vandor/login', 'POST', { email, password });
        if (data.token) {
            setAuthToken(data.token);
            renderMessage('success', 'Login Successful');
            checkAuth();
        } else {
            renderMessage('error', 'Invalid Credentials');
        }
    } catch (error) {
        renderMessage('error', error.message);
    }
});

// --- 2. Load Vendor Data (Foods, Orders, Profile) ---
async function loadVendorData() {
    await loadFoods();
    await loadOrders();
    await loadProfile();
}

// Load Foods
async function loadFoods() {
    try {
        const foods = await apiCall('/vandor/foods', 'GET', null, true);
        const container = document.getElementById('vendor-food-list');
        container.innerHTML = foods.map(food => `
            <div class="food-card">
                <img src="${food.images[0]}" alt="${food.name}" style="height: 150px; object-fit: cover;">
                <div class="food-card-content">
                    <h3>${food.name}</h3>
                    <p>₹${food.price} | ${food.category}</p>
                </div>
            </div>
        `).join('');
    } catch (error) { console.error(error); }
}

// Load Orders
async function loadOrders() {
    try {
        const orders = await apiCall('/vandor/orders', 'GET', null, true);
        const container = document.getElementById('vendor-orders-list');
        
        if(orders.length === 0) {
            container.innerHTML = '<p>No Active Orders.</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div>
                    <h4>Order #${order.orderId}</h4>
                    <p>Items: ${order.items.map(i => i.food.name + ' x' + i.unit).join(', ')}</p>
                    <p>Total: <strong>₹${order.totalAmount}</strong></p>
                </div>
                <div>
                    <span class="status-badge status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span>
                    ${order.orderStatus !== 'CONFIRMED' ? `
                        <button onclick="processOrder('${order._id}', 'CONFIRMED')" class="btn primary" style="font-size: 12px; padding: 5px 10px;">Accept</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Expose function to window for HTML onclick
        window.processOrder = processOrder;
    } catch (error) { console.error(error); }
}

// Process Order
async function processOrder(orderId, status) {
    try {
        await apiCall(`/vandor/order/${orderId}/process`, 'PUT', { status, remarks: 'Accepted by Vendor', time: 30 }, true);
        renderMessage('success', 'Order Accepted');
        loadOrders();
    } catch (error) {
        renderMessage('error', 'Failed to process order');
    }
}

// Load Profile
async function loadProfile() {
    try {
        const profile = await apiCall('/vandor/profile', 'GET', null, true);
        document.getElementById('p-name').textContent = profile.name;
        document.getElementById('p-phone').textContent = profile.phone;
        document.getElementById('p-service').textContent = profile.serviceAvailable ? 'Online' : 'Offline';
    } catch (error) { console.error(error); }
}

// --- 3. Add Food (Multipart Form) ---
document.getElementById('add-food-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Create FormData object for file upload
    const formData = new FormData(e.target);
    
    try {
        // Note: apiCall handles FormData automatically now
        await apiCall('/vandor/food', 'POST', formData, true);
        renderMessage('success', 'Food Item Added Successfully!');
        e.target.reset();
        loadFoods(); // Refresh list
    } catch (error) {
        renderMessage('error', 'Failed to add food. ' + error.message);
    }
});

// --- 4. Update Cover Image ---
document.getElementById('cover-image-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        await apiCall('/vandor/coverimage', 'PATCH', formData, true);
        renderMessage('success', 'Cover Image Updated!');
    } catch (error) {
        renderMessage('error', 'Failed to update cover.');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    removeAuthToken();
    window.location.reload();
});

// Init
checkAuth();