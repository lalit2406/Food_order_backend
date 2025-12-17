import { 
    navbarComponent, renderAboutPage, renderOrderTypesPage, renderDiscountsPage, 
    renderContactPage, renderOrderReviewPage, renderCartPage, 
    categoryFilterDropdownComponent, renderLoginPage, renderSignupPage, 
    renderCheckoutPage, renderVerifyPage, renderPincodeSearch, 
    renderRestaurantList, renderRestaurantMenuPage, renderProfilePage, 
    renderOrdersPage, renderOrderDetailPage, renderFoodSearchResults 
} from './components.js';

import { foodCategories, discounts } from './data.js'; 
import { apiCall, getAuthToken, setAuthToken, removeAuthToken, renderMessage } from './api.js';

// --- Global State ---
let state = {
    // Authentication
    isLoggedIn: !!getAuthToken(),
    redirectAfterAuth: null,

    // Shopping/Home
    currentView: 'home',
    searchTerm: '',
    activeCategory: 'All',
    currentPincode: localStorage.getItem('user_pincode') || '',
    restaurantCache: [], // Use this for home view management
    
    // Data caches
    cart: [], 
    profile: null,
    orders: [],
    appliedCouponDetails: null, 
};

// --- DOM Elements ---
const appContent = document.getElementById('app-content');
const navbarContainer = document.getElementById('navbar-container');
const foodGridContainer = document.getElementById('food-grid-container');
const categoryFiltersContainer = document.getElementById('category-filters');
const backToTopBtn = document.getElementById('back-to-top-btn');
const fixedCartBtn = document.getElementById('fixed-cart-btn');
const fixedCartCountSpan = document.getElementById('fixed-cart-count');


// --- UI/State Update Functions ---

const updateCartCountUI = () => {
    const totalItemsInCart = state.cart.reduce((sum, item) => sum + item.unit, 0);
    fixedCartCountSpan.textContent = totalItemsInCart;
    fixedCartBtn.classList.toggle('has-items', totalItemsInCart > 0);
    
    // Force hide if logged out
    if (!state.isLoggedIn) {
        fixedCartBtn.classList.remove('has-items');
        fixedCartBtn.style.display = 'none'; 
    } else {
        fixedCartBtn.style.display = totalItemsInCart > 0 ? 'flex' : 'none';
    }
};

const updateCartHeaderCount = () => {
    const cartItemCount = document.querySelector('.cart-item-count');
    if (cartItemCount) {
        const uniqueItems = state.cart.length;
        cartItemCount.textContent = `${uniqueItems} item${uniqueItems !== 1 ? 's' : ''}`;
    }
};

const updateNavUI = () => {
    const token = getAuthToken();
    state.isLoggedIn = !!token; 
    
    navbarContainer.innerHTML = '';
    navbarContainer.appendChild(navbarComponent(state.isLoggedIn));
};

const handleAuthSuccess = async (signature, verified, redirectPage) => {
    setAuthToken(signature);
    state.isLoggedIn = true;
    updateNavUI();
    
    if (!verified) {
        renderView('verify');
        renderMessage('warning', 'Signup successful. Please verify your account with the OTP sent to your phone.');
        return;
    }

    await fetchProfile(); 
    await fetchCart(); 

    if (redirectPage) {
        window.location.hash = `#${redirectPage}`;
        state.redirectAfterAuth = null;
    } else {
        window.location.hash = '#home';
    }
    renderMessage('success', 'Authentication successful!');
};

const fetchProfile = async () => {
    if (state.isLoggedIn) {
        try {
            const profile = await apiCall('/profile', 'GET', null, true);
            state.profile = profile;
        } catch (error) {
            console.error('Failed to fetch profile:', error.message);
            state.profile = {}; 
        }
    } else {
        state.profile = null;
    }
}

const fetchCart = async () => {
    if (state.isLoggedIn) {
        try {
            const cart = await apiCall('/cart', 'GET', null, true);
            state.cart = cart || []; 
            updateCartCountUI();
        } catch (error) {
            console.error('Failed to fetch cart:', error.message);
            state.cart = [];
            updateCartCountUI();
        }
    } else {
        state.cart = [];
        updateCartCountUI();
    }
}


// --- AUTHENTICATION HANDLERS ---

const handleLogin = async (email, password) => {
    try {
        const response = await apiCall('/login', 'POST', { email, password }, false);
        await handleAuthSuccess(response.signature, response.verified, state.redirectAfterAuth);
    } catch (error) {
        renderMessage('error', error.message || 'Login failed. Check credentials or verify account.');
    }
};

const handleSignup = async (email, phone, password) => {
    try {
        const response = await apiCall('/signup', 'POST', { email, phone, password }, false);
        await handleAuthSuccess(response.signature, response.verified, null); 
    } catch (error) {
        renderMessage('error', error.message || 'Signup failed. Email or phone may already be registered.');
    }
};

const handleVerify = async (otp) => {
    try {
        const response = await apiCall('/verify', 'PATCH', { otp }, true);
        await handleAuthSuccess(response.signature, response.verified, state.redirectAfterAuth);
        renderMessage('success', 'Account verified! Welcome to FoodieDelight.');
    } catch (error) {
        renderMessage('error', error.message || 'Verification failed. Invalid or expired OTP.');
    }
};

const handleUpdateProfile = async (firstName, lastName, address) => {
    try {
        const updatedProfile = await apiCall('/profile', 'PATCH', { firstName, lastName, address }, true);
        state.profile = updatedProfile;
        renderMessage('success', 'Profile updated successfully!');
        renderView('profile');
    } catch (error) {
        renderMessage('error', error.message || 'Failed to update profile.');
    }
};

const handleLogout = () => {
    removeAuthToken();
    state.isLoggedIn = false;
    state.cart = [];
    state.profile = null;
    state.orders = [];

    updateNavUI(); 
    updateCartCountUI(); 

    window.location.replace('#login'); 

    setTimeout(() => {
        window.location.reload();
    }, 50);
};


// --- Main Rendering Logic ---

const renderView = async (view) => {
    // Authentication Guard
    if (!state.isLoggedIn && ['cart', 'review', 'checkout', 'profile', 'orders'].includes(view)) {
        state.redirectAfterAuth = view;
        window.location.hash = '#login';
        renderMessage('error', 'Please log in to access this page.');
        return;
    }

    // Pre-fetch data only if logged in
    if (state.isLoggedIn) {
        if (view === 'cart' || view === 'review' || view === 'checkout' || view === 'home') {
            await fetchCart();
        }
        if (view === 'profile' || view === 'review' || view === 'checkout') {
            await fetchProfile();
        }
        if (view === 'orders') {
            try {
                state.orders = await apiCall('/orders', 'GET', null, true);
            } catch (error) {
                renderMessage('error', 'Failed to load orders.');
                state.orders = [];
            }
        }
    } else {
        state.cart = [];
        updateCartCountUI();
    }

    appContent.innerHTML = '';
    state.currentView = view;
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${view}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    const navbarLinks = document.getElementById('navbar-links');
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarLinks && navbarToggler && navbarLinks.classList.contains('show')) {
        navbarLinks.classList.remove('show');
        navbarToggler.classList.remove('active');
    }
    
    foodGridContainer.innerHTML = '';
    categoryFiltersContainer.innerHTML = '';

    switch (view) {
        case 'home':
            await renderHomeView();
            break;
        case 'cart':
            appContent.appendChild(renderCartPage(state.cart));
            break;
        case 'review':
            const subtotalReview = state.cart.reduce((sum, item) => sum + (item.food.price * item.unit), 0);
            appContent.appendChild(renderOrderReviewPage(state.cart, subtotalReview, state.appliedCouponDetails, state.profile));
            break;
        case 'checkout':
            const subtotal = state.cart.reduce((sum, item) => sum + (item.food.price * item.unit), 0);
            const deliveryFee = 80.00;
            const discountAmount = state.appliedCouponDetails?.offer?.offerAmount || 0.00;
            const discountDescription = state.appliedCouponDetails?.offer?.promocode ? 
                `-₹${discountAmount.toFixed(2)} (${state.appliedCouponDetails.offer.promocode})` : '₹0.00';
            const estimatedTotal = subtotal + deliveryFee - discountAmount;
            
            const cartForServer = state.cart.map(item => ({ _id: item.food._id, unit: item.unit }));

            const orderData = {
                subtotal, estimatedTotal, deliveryFee, discountAmount, discountDescription, 
                offerId: state.appliedCouponDetails?.offer?._id, cartForServer, profile: state.profile
            }

            appContent.appendChild(renderCheckoutPage(orderData));
            break;
        case 'login':
            appContent.appendChild(renderLoginPage());
            break;
        case 'signup':
            appContent.appendChild(renderSignupPage());
            break;
        case 'verify':
            appContent.appendChild(renderVerifyPage());
            break;
        case 'profile':
            appContent.appendChild(renderProfilePage(state.profile || {}));
            break;
        case 'orders':
            appContent.appendChild(renderOrdersPage(state.orders));
            break;
        case 'order-detail':
            break;
        case 'about':
            appContent.appendChild(renderAboutPage());
            break;
        case 'ordertypes':
            appContent.appendChild(renderOrderTypesPage());
            break;
        case 'discounts':
            appContent.appendChild(renderDiscountsPage());
            break;
        case 'contact':
            appContent.appendChild(renderContactPage());
            break;
        case 'logout':
            handleLogout();
            break;
        default:
            renderHomeView();
            break;
    }
};

const renderHomeView = async () => {
    appContent.innerHTML = ''; 
    appContent.appendChild(renderPincodeSearch(state.currentPincode));
    appContent.appendChild(categoryFiltersContainer);
    
    foodGridContainer.innerHTML = ''; 
    appContent.appendChild(foodGridContainer);
    
    if (state.currentPincode) {
        await fetchRestaurants(state.currentPincode);
    }
}

const fetchRestaurants = async (pincode) => {
    localStorage.setItem('user_pincode', pincode);
    state.currentPincode = pincode;
    
    foodGridContainer.innerHTML = '';
    categoryFiltersContainer.innerHTML = '';

    try {
        const restaurants = await apiCall(`/${pincode}`, 'GET', null, false);
        
        if (restaurants.length > 0) {
             const restaurantListElement = renderRestaurantList(restaurants, pincode);
             foodGridContainer.appendChild(restaurantListElement);
             renderCategoryFilters();

             // Enable Search Input
             const searchInput = document.getElementById('food-search-input');
             if(searchInput) {
                 searchInput.disabled = false;
                 searchInput.placeholder = "Search food items (e.g., Biryani)...";
             }

        } else {
            renderMessage('info', `No restaurants are available in pincode ${pincode}.`);
        }
    } catch (error) {
        renderMessage('error', error.message || 'Failed to fetch restaurant availability.');
    }
}

const handleViewMenuClick = async (vendorId) => {
    state.currentView = 'menu';
    appContent.innerHTML = '';

    try {
        const vendor = await apiCall(`/restaurant/${vendorId}`, 'GET', null, false);
        state.restaurantCache = vendor;
        appContent.appendChild(renderRestaurantMenuPage(vendor, vendor.foods, state.cart));

    } catch (error) {
        renderMessage('error', error.message || 'Failed to load restaurant menu.');
        window.location.hash = '#home'; 
    }
}

const handleBackToRestaurants = async () => {
    window.location.hash = '#home';
    renderMessage('info', 'Back to restaurants');
}

// ... (updateCartItemDisplay, updateCartSummary, renderCategoryFilters) ...
// (Assuming these helper functions haven't changed, you can keep them)
const updateCartItemDisplay = (foodId, newUnit) => {
    const cartItemsList = document.getElementById('cart-page-items');
    if (!cartItemsList) return;
    
    const cartItem = cartItemsList.querySelector(`.cart-item-full[data-id="${foodId}"]`);
    
    if (newUnit === 0) {
        if (cartItem) {
            cartItem.style.animation = 'slideOut 0.25s ease-out forwards';
            setTimeout(() => {
                cartItem.remove();
                const remainingItems = cartItemsList.querySelectorAll('.cart-item-full');
                if (remainingItems.length === 0) {
                    cartItemsList.innerHTML = '<p class="empty-cart-message">Your cart is empty. Start adding some delicious food!</p>';
                }
                updateCartHeaderCount();
            }, 250);
        }
    } else if (cartItem) {
        const quantitySpan = cartItem.querySelector('.item-quantity');
        if (quantitySpan) {
            quantitySpan.textContent = `Qty: ${newUnit}`;
            quantitySpan.classList.add('pulse-fast');
            quantitySpan.offsetHeight; 
            quantitySpan.classList.remove('pulse-fast');
        }
    }
}

const updateCartSummary = () => {
    let subtotal = 0;
    state.cart.forEach(item => {
        if (item.food && item.food.price && item.unit) {
            subtotal += item.food.price * item.unit;
        }
    });

    const deliveryFee = 80.00;
    const total = subtotal + deliveryFee;

    const summaryContainer = document.querySelector('.cart-page-summary');
    if(summaryContainer) {
        const paragraphs = summaryContainer.querySelectorAll('p');
        if(paragraphs[0]) paragraphs[0].innerHTML = `Subtotal: <span>₹${subtotal.toFixed(2)}</span>`;
    }
    
    const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = state.cart.length === 0;

    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) clearCartBtn.disabled = state.cart.length === 0;
}

const renderCategoryFilters = () => {
    categoryFiltersContainer.innerHTML = '';
    const dropdown = categoryFilterDropdownComponent(state.activeCategory, foodCategories);
    categoryFiltersContainer.appendChild(dropdown);
};

// ============================================================
// UPDATED QUANTITY LOGIC
// ============================================================

const processQtyAdd = async (foodId) => {
    if (!state.isLoggedIn) {
        renderMessage('error', 'Please login first');
        state.redirectAfterAuth = state.currentView;
        window.location.hash = '#login';
        return;
    }

    try {
        const cart = await apiCall('/cart', 'POST', { _id: foodId, unit: 1 }, true);
        state.cart = cart || [];
        state.appliedCouponDetails = null;

        updateCartCountUI();
        if (state.currentView === 'cart') {
            appContent.innerHTML = '';
            appContent.appendChild(renderCartPage(state.cart));
        } else if (state.currentView === 'menu') {
            const updatedItem = state.cart.find(x => x.food._id === foodId);
            if (updatedItem) updateMenuQuantityDisplay(foodId, updatedItem.unit);
        }
        renderMessage('success', `Added`);
    } catch (error) {
        renderMessage('error', 'Failed to add');
    }
};

const processQtyRemove = async (foodId) => {
    if (!state.isLoggedIn) {
        renderMessage('error', 'Please login first');
        state.redirectAfterAuth = state.currentView;
        window.location.hash = '#login';
        return;
    }

    try {
        const item = state.cart.find(x => x.food._id === foodId);
        const currentQty = item ? item.unit : 0;
        const newQty = currentQty - 1;

        const cart = await apiCall('/cart', 'POST', { _id: foodId, unit: -1 }, true);
        state.cart = cart || [];
        state.appliedCouponDetails = null;

        updateCartCountUI();
        if (state.currentView === 'cart') {
             appContent.innerHTML = '';
             appContent.appendChild(renderCartPage(state.cart));
        } else if (state.currentView === 'menu') {
            updateMenuQuantityDisplay(foodId, newQty);
        }
        renderMessage('success', `Removed`);
    } catch (error) {
        renderMessage('error', 'Failed to remove');
    }
};

const updateMenuQuantityDisplay = (foodId, newQuantity) => {
    const qtyDisplay = document.querySelector(`.qty-display[data-food-id="${foodId}"]`);
    if (qtyDisplay) {
        qtyDisplay.textContent = newQuantity;
        qtyDisplay.classList.add('pulse');
        setTimeout(() => qtyDisplay.classList.remove('pulse'), 600);
    }
    
    const minusBtn = document.querySelector(`.qty-btn-minus[data-id="${foodId}"]`);
    if (minusBtn) {
        if (newQuantity <= 1) {
            minusBtn.disabled = true;
            minusBtn.style.opacity = '0.5';
            minusBtn.style.cursor = 'not-allowed';
        } else {
            minusBtn.disabled = false;
            minusBtn.style.opacity = '1';
            minusBtn.style.cursor = 'pointer';
        }
    }
    
    const plusBtn = document.querySelector(`.qty-btn-plus[data-id="${foodId}"]`);
    if (plusBtn) {
        if (newQuantity >= 99) {
            plusBtn.disabled = true;
            plusBtn.style.opacity = '0.5';
            plusBtn.style.cursor = 'not-allowed';
        } else {
            plusBtn.disabled = false;
            plusBtn.style.opacity = '1';
            plusBtn.style.cursor = 'pointer';
        }
    }
};

const handleConfirmOrder = async (e) => {
    e.preventDefault();
    
    const totalAmount = parseFloat(e.target.dataset.total);
    const offerId = e.target.dataset.offerid !== 'NA' ? e.target.dataset.offerid : null;
    const cartItems = JSON.parse(e.target.dataset.cartitems);
    const paymentMode = document.querySelector('input[name="payment-method"]:checked').value;

    try {
        const transaction = await apiCall('/create-payment', 'POST', { 
            amount: totalAmount, 
            paymentMode: paymentMode, 
            offerId: offerId 
        }, true);
        
        const txnId = transaction._id;
        
        await apiCall('/create-order', 'POST', { 
            txnId: txnId, 
            amount: totalAmount, 
            items: cartItems 
        }, true);

        state.cart = [];
        state.appliedCouponDetails = null;
        updateCartCountUI();
        renderMessage('success', 'Order Placed Successfully! Thank you.');
        window.location.hash = '#orders'; 

    } catch (error) {
        renderMessage('error', error.message || 'Failed to place order.');
    }
}

const handleApplyCoupon = async (couponCode) => {
    if (!couponCode) {
        renderMessage('error', 'Please enter a coupon code.');
        return;
    }
    
    try {
        const verificationResult = await apiCall(`/offer/verify/${couponCode}`, 'GET', null, true);

        if (verificationResult.offer) {
            const subtotal = state.cart.reduce((sum, item) => sum + (item.food.price * item.unit), 0);
            if (subtotal < verificationResult.offer.minvalue) {
                renderMessage('error', `Coupon valid, but minimum order value of ${verificationResult.offer.minvalue} not met.`);
                state.appliedCouponDetails = null;
            } else {
                state.appliedCouponDetails = verificationResult;
                renderMessage('success', `Coupon '${couponCode}' applied! You saved ${verificationResult.offer.offerAmount}.`);
                renderView('review'); 
            }
        } else {
            throw new Error(verificationResult.message || 'Invalid coupon code.');
        }

    } catch (error) {
        state.appliedCouponDetails = null;
        renderMessage('error', error.message || 'Invalid coupon code or server error.');
        renderView('review');
    }
}


const handleViewOrderDetails = async (orderId) => {
    try {
        const order = await apiCall(`/order/${orderId}`, 'GET', null, true);
        appContent.innerHTML = '';
        appContent.appendChild(renderOrderDetailPage(order));
    } catch (error) {
        renderMessage('error', error.message || 'Failed to load order details.');
    }
}

// --- Event Delegation and Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State Load
    const token = getAuthToken();
    if(!token) {
        state.isLoggedIn = false;
        state.cart = [];
    }
    
    updateNavUI(); 
    updateCartCountUI(); 

    if (state.isLoggedIn) {
        await fetchProfile();
        await fetchCart(); 
    }
    
    // 2. Initial View Render
    const hash = window.location.hash.substring(1);
    
    if (!state.isLoggedIn && ['orders', 'profile', 'cart', 'checkout'].includes(hash)) {
        window.location.hash = '#login';
    } else {
        renderView(hash || 'home');
    }

    // 3. Navbar Listeners
    if (navbarContainer) {
        navbarContainer.addEventListener('click', (event) => {
            const navLink = event.target.closest('.nav-link');
            if (navLink && navLink.dataset.page === 'logout') {
                event.preventDefault();
                handleLogout();
            } else if (navLink && navLink.dataset.page === 'home') {
                state.searchTerm = '';
            }
        });

        // --- NEW: Search Logic ---
        let searchTimeout; 
        navbarContainer.addEventListener('input', (event) => {
            if (event.target.id === 'food-search-input') {
                const searchTerm = event.target.value.toLowerCase().trim();
                
                clearTimeout(searchTimeout);

                if (searchTerm.length === 0) {
                    renderHomeView(); 
                    return;
                }

                searchTimeout = setTimeout(async () => {
                    if (!state.currentPincode) {
                        renderMessage('error', 'Please enter a pincode first.');
                        return;
                    }

                    try {
                        const allFoods = await apiCall(`/search/${state.currentPincode}`, 'GET', null, false);

                        const matchingFoods = allFoods.filter(food => 
                            food.name.toLowerCase().includes(searchTerm) || 
                            (food.description && food.description.toLowerCase().includes(searchTerm)) ||
                            (food.category && food.category.toLowerCase().includes(searchTerm))
                        );

                        foodGridContainer.innerHTML = '';
                        categoryFiltersContainer.innerHTML = ''; 
                        
                        const searchResultsElement = renderFoodSearchResults(matchingFoods);
                        foodGridContainer.appendChild(searchResultsElement);

                    } catch (error) {
                        console.error("Search failed", error);
                    }
                }, 500);
            }
        });
    }

    // 4. Global Event Delegation
    appContent.addEventListener('click', async (event) => {
        if (event.target.closest('.btn-add-to-cart')) {
            const btn = event.target.closest('.btn-add-to-cart');
            const foodId = btn.dataset.id;
            await processQtyAdd(foodId);
            
            setTimeout(() => {
                if (state.currentView === 'menu') {
                    const vendor = state.restaurantCache;
                    if (vendor) {
                        appContent.innerHTML = '';
                        appContent.appendChild(renderRestaurantMenuPage(vendor, vendor.foods, state.cart));
                    }
                }
            }, 80);
            return;
        }

        if (event.target.closest('.qty-btn-plus')) {
            event.preventDefault();
            event.stopPropagation();
            const foodId = event.target.closest('.qty-btn-plus').dataset.id;
            await processQtyAdd(foodId);
            return;
        }

        if (event.target.closest('.qty-btn-minus')) {
            event.preventDefault();
            event.stopPropagation();
            const foodId = event.target.closest('.qty-btn-minus').dataset.id;
            await processQtyRemove(foodId);
            return;
        }

        if (event.target.closest('.quantity-btn')) {
            event.preventDefault();
            event.stopPropagation();
            const btn = event.target.closest('.quantity-btn');
            const action = btn.dataset.action;
            const foodId = btn.dataset.id;

            if (action === 'increment') {
                await processQtyAdd(foodId);
            } else if (action === 'decrement') {
                await processQtyRemove(foodId);
            }
            return;
        }
        
        if (event.target.closest('.remove-from-cart-btn')) {
            event.preventDefault();
            event.stopPropagation();
            const removeBtn = event.target.closest('.remove-from-cart-btn');
            const foodId = removeBtn.dataset.id;
            const cartItem = state.cart.find(item => item.food._id === foodId);
            if (cartItem) {
                let qty = cartItem.unit;
                while(qty > 0) {
                    await apiCall('/cart', 'POST', { _id: foodId, unit: -1 }, true);
                    qty--;
                }
                await fetchCart();
                renderView('cart');
            }
            return;
        }

        if (event.target.id === 'clear-cart-btn' && !event.target.disabled) {
            try {
                await apiCall('/cart', 'DELETE', null, true);
                state.cart = [];
                state.appliedCouponDetails = null;
                updateCartCountUI();
                renderView('cart');
                renderMessage('success', 'Cart cleared successfully!');
            } catch (error) {
                renderMessage('error', error.message || 'Failed to clear cart.');
            }
            return;
        }
        
        if (event.target.id === 'apply-coupon-btn') {
            const couponInput = document.getElementById('coupon-code-input');
            const couponCode = couponInput ? couponInput.value.trim() : '';
            await handleApplyCoupon(couponCode);
            return;
        }
        
        if (event.target.matches('.view-menu-btn')) {
            const vendorId = event.target.dataset.id;
            handleViewMenuClick(vendorId);
            return;
        }
        
        if (event.target.closest('.order-card')) {
             const orderId = event.target.closest('.order-card').dataset.id;
             handleViewOrderDetails(orderId);
             return;
        }
        
        const navLink = event.target.closest('.nav-link');
        if (navLink && navLink !== fixedCartBtn) { 
            event.preventDefault(); 
            const page = navLink.dataset.page;
            if (page && page !== 'logout') {
                window.location.hash = `#${page}`;
            }
        }
    });

    // 5. Form Submission Listeners
    appContent.addEventListener('submit', async (event) => {
        if (event.target.id === 'login-form') {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await handleLogin(email, password);
        } else if (event.target.id === 'signup-form') {
            event.preventDefault();
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone').value;
            const password = document.getElementById('signup-password').value;
            await handleSignup(email, phone, password);
        } else if (event.target.id === 'verify-form') {
            event.preventDefault();
            const otp = document.getElementById('otp-input').value;
            await handleVerify(otp);
        } else if (event.target.id === 'checkout-form') {
            await handleConfirmOrder(event);
        } else if (event.target.id === 'profile-form') {
            event.preventDefault();
            const firstName = document.getElementById('profile-firstName').value;
            const lastName = document.getElementById('profile-lastName').value;
            const address = document.getElementById('profile-address').value;
            await handleUpdateProfile(firstName, lastName, address);
        }
    });
    
    // 6. Form Button Listeners
    appContent.addEventListener('click', async (event) => {
        if (event.target.id === 'pincode-search-btn' || event.target.closest('#pincode-search-btn')) {
            const pincodeInput = document.getElementById('pincode-input');
            const pincode = pincodeInput ? pincodeInput.value.trim() : '';
            if (pincode.length !== 6 || isNaN(pincode)) {
                renderMessage('error', 'Please enter a valid 6-digit pincode.');
                return;
            }
            await fetchRestaurants(pincode);
        } else if (event.target.id === 'resend-otp-btn') {
            try {
                await apiCall('/otp', 'POST', null, true); 
                renderMessage('success', 'New OTP sent to your phone.');
            } catch (error) {
                renderMessage('error', error.message || 'Failed to resend OTP.');
            }
        } else if (event.target.id === 'back-to-restaurants-btn' || event.target.closest('#back-to-restaurants-btn')) {
            handleBackToRestaurants();
        } else if (event.target.matches('.navbar-toggler') || event.target.closest('.navbar-toggler')) {
             const nav = document.getElementById('navbar-links');
             if (nav) nav.classList.toggle('show');
        }
    });

    fixedCartBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const page = fixedCartBtn.dataset.page;
        if (page) {
            window.location.hash = `#${page}`;
        }
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            renderView(hash);
        } else {
            renderView('home');
        }
    });

    window.onscroll = function() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };
    backToTopBtn.onclick = function() {
        document.body.scrollTop = 0; 
        document.documentElement.scrollTop = 0; 
    };
});