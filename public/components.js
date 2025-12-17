import { foodCategories } from './data.js';
import { apiCall } from './api.js'; // Ensure apiCall is imported for the profile update handler

// --- Utility Functions for UI consistency ---
const formatPrice = (price) => `₹${(typeof price === 'number' ? price.toFixed(2) : '0.00')}`;

// --- Navigation Component (Includes Login/Logout state) ---
export const navbarComponent = (isLoggedIn) => {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    // Dynamically adjust nav links based on login status
    const authLinks = isLoggedIn
        ? `
            <a href="#orders" class="nav-link" data-page="orders">Orders</a>
            <a href="#profile" class="nav-link" data-page="profile">Profile</a>
            <a href="#logout" class="nav-link" data-page="logout">Logout</a>
          `
        : `
            <a href="#login" class="nav-link" data-page="login">Login</a>
            <a href="#signup" class="nav-link" data-page="signup">Sign Up</a>
          `;

    nav.innerHTML = `
        <a href="#home" class="navbar-brand">
            <img src="images/foodiedelight_logo.png" alt="FoodieDelight Logo" class="navbar-logo" onerror="this.onerror=null; this.src='images/default_logo.png'">
            FoodieDelight
        </a>
        <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" id="food-search-input" placeholder="Search menu (after pincode)..." disabled>
        </div>
        <div class="navbar-links" id="navbar-links">
            <a href="#home" class="nav-link" data-page="home">Home</a>
            ${isLoggedIn ? '<a href="#cart" class="nav-link" data-page="cart">Cart</a>' : ''}
            <a href="#about" class="nav-link" data-page="about">About</a>
            <a href="#discounts" class="nav-link" data-page="discounts">Offers</a>
            <a href="#contact" class="nav-link" data-page="contact">Contact</a>
            ${authLinks}
        </div>
        <button class="navbar-toggler" aria-label="Toggle navigation">
            <i class="fas fa-bars"></i>
        </button>
    `;
    return nav;
};

// --- Home/Shopping Components ---
export const renderPincodeSearch = (currentPincode) => {
    const container = document.createElement('div');
    container.className = 'pincode-search-container';
    container.innerHTML = `
        <div class="pincode-hero">
            <div class="pincode-hero-content">
                <h1><i class="fas fa-map-marker-alt"></i> Find Your Food</h1>
                <p>Enter your 6-digit Pincode to discover delicious restaurants in your area</p>
                <div class="pincode-search-form">
                    <div class="search-input-wrapper">
                        <i class="fas fa-map-pin"></i>
                        <input type="text" id="pincode-input" placeholder="Enter Pincode (e.g., 400012)" maxlength="6" value="${currentPincode || ''}">
                    </div>
                    <button id="pincode-search-btn" class="btn primary search-btn"><i class="fas fa-search"></i> Search</button>
                </div>
            </div>
        </div>
    `;
    return container;
}
export const renderRestaurantList = (restaurants = [], pincode = '') => {
    const container = document.createElement('div');
    container.className = 'page-content restaurant-list-container';
    container.innerHTML = `
        <h2>Restaurants available in ${pincode}</h2>
    `;

    const grid = document.createElement('div');
    grid.className = 'food-grid';

    restaurants.forEach(vendor => {
        const card = document.createElement('div');
        card.className = 'food-card restaurant-card';
        const image = (vendor.coverImages && vendor.coverImages.length > 0) 
            ? vendor.coverImages[0] 
            : 'images/default_restaurant.png';
        // -------------------

        const foodTypeText = (vendor.foodType && vendor.foodType.length) ? vendor.foodType.join(', ') : 'Various';

        card.innerHTML = `
            <img src="${image}" alt="${vendor.name}" onerror="this.onerror=null; this.src='images/default_restaurant.png'">
            <div class="food-card-content">
                <h3>${vendor.name}</h3>
                <p>Cuisines: ${foodTypeText}</p>
                <p>Address: ${vendor.address || 'N/A'}</p>
                <div class="food-card-price">Rating: ${vendor.rating ?? 'N/A'}</div>
                <button class="btn primary view-menu-btn" data-id="${vendor._id}">View Menu</button>
            </div>
        `;
        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
}


export const renderRestaurantMenuPage = (vendor = {}, foods = [], cartItems = []) => {
    const content = document.createElement('div');
    content.className = 'restaurant-menu-page';
    const safeFoods = Array.isArray(foods) ? foods : [];
    
    // --- FIX: Added this missing definition ---
    const vendorFoodType = (vendor.foodType && vendor.foodType.length) ? vendor.foodType.join(', ') : 'Various';
    // ------------------------------------------

   const restaurantImage = (vendor.coverImages && vendor.coverImages.length > 0) 
    ? vendor.coverImages[0] 
    : 'images/default_restaurant.png';
    content.innerHTML = `
        <div class="restaurant-menu-hero">
            <img src="${restaurantImage}" alt="${vendor.name}" class="restaurant-menu-hero-image" onerror="this.onerror=null; this.src='images/default_restaurant.png'">
            <div class="restaurant-menu-hero-overlay"></div>
            <div class="restaurant-menu-hero-content">
                <button id="back-to-restaurants-btn" class="btn-back"><i class="fas fa-arrow-left"></i> Back</button>
                <h1>${vendor.name || 'Restaurant'}</h1>
                <div class="restaurant-menu-info">
                    <span class="info-item"><i class="fas fa-star"></i> ${vendor.rating ?? 'N/A'}</span>
                    <span class="info-item"><i class="fas fa-utensils"></i> ${vendorFoodType}</span>
                    <span class="info-item"><i class="fas fa-map-pin"></i> ${vendor.address || 'N/A'}</span>
                </div>
            </div>
        </div>
        
        <div class="restaurant-menu-container">
            <div class="food-grid">
                ${safeFoods.length > 0 ?
                    safeFoods.map(food => {
                        const cartItem = cartItems.find(item => item.food._id === food._id);
                        const quantity = cartItem ? cartItem.unit : 0;
                        return `
                            <div class="food-card modern-food-card" data-food-id="${food._id}">
                                <div class="food-card-image-container">
                                   <img src="${(food.images && food.images.length > 0) ? food.images[0] : 'images/default_food.png'}" alt="${food.name}" onerror="this.onerror=null; this.src='images/default_food.png'">
                                    <div class="food-card-overlay">
                                        <span class="ready-time"><i class="fas fa-clock"></i> ${food.readyTime ?? 'N/A'} min</span>
                                    </div>
                                </div>
                                <div class="food-card-content">
                                    <h3>${food.name}</h3>
                                    <p class="food-description">${food.description || 'Delicious food item'}</p>
                                    <div class="food-card-footer">
                                        <div class="food-card-price">${formatPrice(food.price)}</div>
                                        <div class="food-card-controls">
                                            ${quantity === 0 ? `
                                                <button class="btn-add-to-cart" data-id="${food._id}" title="Add to cart">
                                                    <i class="fas fa-plus"></i> Add
                                                </button>
                                            ` : `
                                                <div class="quantity-control" data-food-id="${food._id}">
                                                    <button class="qty-btn qty-btn-minus" data-id="${food._id}" data-action="decrement" title="Decrease quantity" ${quantity === 1 ? 'disabled' : ''}>
                                                        <i class="fas fa-minus"></i>
                                                    </button>
                                                    <span class="qty-display" data-food-id="${food._id}">${quantity}</span>
                                                    <button class="qty-btn qty-btn-plus" data-id="${food._id}" data-action="increment" title="Increase quantity">
                                                        <i class="fas fa-plus"></i>
                                                    </button>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')
                    : '<div class="empty-foods-message"><i class="fas fa-inbox"></i><p>No food items available</p></div>'
                }
            </div>
        </div>
    `;
    return content;
};

export const categoryFilterDropdownComponent = (activeCategory = 'All', categories = []) => {
    const container = document.createElement('div');
    container.className = 'category-filter-dropdown';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'category-dropdown-toggle';
    toggleButton.innerHTML = `Filter By: <span>${activeCategory}</span> <span class="dropdown-arrow fas fa-caret-down"></span>`;
    toggleButton.dataset.toggle = 'category-dropdown';

    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'category-dropdown-content';

    categories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-dropdown-item';
        item.textContent = category;
        item.dataset.category = category;
        if (activeCategory === category) {
            item.classList.add('active');
        }
        dropdownContent.appendChild(item);
    });

    container.appendChild(toggleButton);
    container.appendChild(dropdownContent);

    return container;
};

// --- Auth Components ---
export const renderLoginPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content login-page';
    content.innerHTML = `
        <div class="auth-card">
            <h1>Login to FoodieDelight</h1>
            <p>Access your profile, cart, and orders.</p>
            <form class="auth-form" id="login-form">
                <div class="form-group">
                    <label for="login-email">Email:</label>
                    <input type="email" id="login-email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password:</label>
                    <input type="password" id="login-password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn primary">Login</button>
            </form>
            <p class="auth-switch">Don't have an account? <a href="#signup" class="nav-link" data-page="signup">Sign Up</a></p>
        </div>
    `;
    return content;
};

export const renderSignupPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content signup-page';
    content.innerHTML = `
        <div class="auth-card">
            <h1>Join FoodieDelight Today!</h1>
            <p>Create an account to start ordering.</p>
            <form class="auth-form" id="signup-form">
                <div class="form-group">
                    <label for="signup-email">Email:</label>
                    <input type="email" id="signup-email" placeholder="Enter your email" required>
                </div>
                   <div class="form-group">
                    <label for="signup-phone">Phone (for OTP):</label>
                    <input type="tel" id="signup-phone" placeholder="Enter your phone number" required>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password:</label>
                    <input type="password" id="signup-password" placeholder="Create a password (min 6 chars)" required>
                </div>
                <button type="submit" class="btn primary">Sign Up</button>
            </form>
            <p class="auth-switch">Already have an account? <a href="#login" class="nav-link" data-page="login">Login</a></p>
        </div>
    `;
    return content;
};

export const renderVerifyPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content login-page'; // Reuse login page styling
    content.innerHTML = `
        <div class="auth-card">
            <h1>Verify Account</h1>
            <p>An OTP has been sent to your registered mobile number for verification.</p>
            <form class="auth-form" id="verify-form">
                <div class="form-group">
                    <label for="otp-input">OTP:</label>
                    <input type="text" id="otp-input" placeholder="Enter the 6-digit OTP" required maxlength="6">
                </div>
                <button type="submit" class="btn primary">Verify</button>
                <button type="button" id="resend-otp-btn" class="btn ghost" style="margin-top: 10px;">Resend OTP</button>
            </form>
        </div>
    `;
    return content;
};

// --- Cart/Checkout Components ---
export const renderCartPage = (cartItems = []) => {
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.food?.price || 0) * (item.unit || 0)), 0);
    const deliveryFee = 80.00;
    const total = subtotal + deliveryFee;
    const hasItems = cartItems.length > 0;

    const content = document.createElement('div');
    content.className = 'page-content cart-page';

    // Modern delivery app style cart with two-column layout
    content.innerHTML = `
        <div class="cart-container">
            <div class="cart-items-section">
                <div class="cart-header">
                    <h1><i class="fas fa-shopping-bag"></i> Your Cart</h1>
                    <span class="cart-item-count">${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}</span>
                </div>

                <div id="cart-page-items" class="cart-items-list">
                    ${cartItems.length > 0 ?
                        cartItems.map(item => `
                            <div class="cart-item-card" data-id="${item.food?._id || ''}">
                                <img src="${(item.food?.images && item.food.images.length > 0) ? item.food.images[0] : 'images/default_food.png'}" alt="${item.food?.name || 'Food'}" class="cart-item-img" onerror="this.onerror=null; this.src='images/default_food.png'">
                                
                                <div class="cart-item-info">
                                    <div class="item-header">
                                        <h3>${item.food?.name || 'Unknown Item'}</h3>
                                        <span class="item-total">₹${(item.food?.price * item.unit).toFixed(2)}</span>
                                    </div>
                                    <p class="item-price-each">${formatPrice(item.food?.price)} each</p>
                                </div>

                                <div class="cart-item-controls">
                                    <button class="quantity-btn qty-decrement" data-id="${item.food?._id}" data-action="decrement" title="Decrease quantity" ${item.unit === 1 ? 'disabled' : ''}>
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span class="item-quantity" data-food-id="${item.food?._id}">${item.unit}</span>
                                    <button class="quantity-btn qty-increment" data-id="${item.food?._id}" data-action="increment" title="Increase quantity" ${item.unit >= 99 ? 'disabled' : ''}>
                                        <i class="fas fa-plus"></i>
                                    </button>
                                    <button class="remove-from-cart-btn" data-id="${item.food?._id}" title="Remove from cart">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')
                        : '<div class="empty-cart-message"><i class="fas fa-inbox"></i><p>Your cart is empty</p><p class="empty-cart-subtext">Start adding some delicious food!</p></div>'
                    }
                </div>
            </div>

            <div class="cart-summary-section">
                <div class="summary-card">
                    <h2>Bill Details</h2>
                    
                    ${hasItems ? `
                        <div class="summary-item">
                            <span>Subtotal</span>
                            <span class="subtotal-value">${formatPrice(subtotal)}</span>
                        </div>
                        
                        <div class="summary-item">
                            <span>Delivery Fee</span>
                            <span>₹${deliveryFee.toFixed(2)}</span>
                        </div>
                        
                        <div class="summary-item">
                            <span>Taxes & Charges</span>
                            <span>Calculated at checkout</span>
                        </div>

                        <div class="promo-code-section">
                            <input type="text" placeholder="Enter promo code" class="promo-input">
                            <button class="btn-apply-promo">Apply</button>
                        </div>
                        
                        <div class="summary-divider"></div>
                        
                        <div class="summary-total">
                            <span>Total Amount</span>
                            <span class="total-price">₹${total.toFixed(2)}</span>
                        </div>
                    ` : `
                        <div class="empty-summary-message">
                            <i class="fas fa-box-open"></i>
                            <p>Cart is empty</p>
                            <p class="empty-summary-text">Add items to see billing details</p>
                        </div>
                    `}

                    <button id="proceed-to-checkout-btn" class="btn checkout-btn nav-link" data-page="review" ${cartItems.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-lock"></i> Proceed to Checkout
                    </button>

                    <button id="continue-shopping-btn" class="btn continue-btn nav-link" data-page="home">
                        <i class="fas fa-arrow-left"></i> Continue Shopping
                    </button>

                    <button id="clear-cart-btn" class="btn clear-cart-btn" ${cartItems.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> Clear Cart
                    </button>
                </div>
            </div>
        </div>
    `;
    return content;
};

export const renderOrderReviewPage = (cartItems = [], subtotal = 0, appliedCouponDetails = {}, profile = {}) => {
    let deliveryFee = 80.00;
    const offer = appliedCouponDetails?.offer || {};
    const description = (offer.description || '').toString();
    const isFreeDelivery = description.toLowerCase().includes('free delivery');
    if (isFreeDelivery) {
        deliveryFee = 0.00;
    }

    const discountAmount = offer.offerAmount || 0.00;

    const discountDescription = discountAmount > 0
        ? `- ${formatPrice(discountAmount)} (${offer.promocode || ''})`
        : (isFreeDelivery ? 'Free Delivery' : formatPrice(0.00));

    const estimatedTotal = subtotal + deliveryFee - discountAmount;

    const content = document.createElement('div');
    content.className = 'order-review';
    content.innerHTML = `
        <h2>Review Your Order</h2>
        <div class="order-review-summary">
            <h3>Delivery To:</h3>
            <div class="user-details-for-order">
                <p>Name: <span>${profile.firstName || 'N/A'} ${profile.lastName || ''}</span></p>
                <p>Phone: <span>${profile.phone || 'N/A'}</span></p>
                <p>Address: <span>${profile.address || 'Please Update Profile'}</span></p>
            </div>
            <div class="order-review-items">
                <h3>Items in Cart:</h3>
                <div id="review-items-list">
                    ${cartItems.length > 0 ?
                        cartItems.map(item => `
                        <div class="order-review-item">
                            <span class="item-name">${item.food?.name || `Item`} (x${item.unit})</span>
                            <span>${formatPrice((item.food?.price || 0) * (item.unit || 0))}</span>
                        </div>
                    `).join('')
                        : '<p>Your cart is empty.</p>'
                    }
                </div>
            </div>

            <div class="discount-input-area" style="margin-top:10px;">
                <input type="text" id="coupon-code-input" placeholder="Enter Promocode (for offer verification)" value="${offer.promocode || ''}">
                <button id="apply-coupon-btn" class="btn primary" data-offerid="${offer._id || ''}">Verify Offer</button>
            </div>

            <p style="margin-top:12px;">Subtotal: <span>${formatPrice(subtotal)}</span></p>
            <p>Delivery Fee: <span>${formatPrice(deliveryFee)}</span></p>
            <p>Discount: <span class="discount-value">${discountDescription}</span></p>
            <p><strong>Estimated Total:</strong> <strong>${formatPrice(estimatedTotal)}</strong></p>

        </div>
           <div class="btn-group" style="margin-top:15px;">
            <button id="back-to-cart-btn" class="btn ghost nav-link" data-page="cart">Back to Cart</button>
            <button id="place-order-btn" class="btn primary nav-link" data-page="checkout" ${cartItems.length === 0 || !profile.address ? 'disabled' : ''}>Proceed to Payment</button>
        </div>
        ${!profile.address ? '<p style="color:red; margin-top: 10px;">Please update your address in the Profile section before proceeding.</p>' : ''}
    `;

    return content;
};

export const renderCheckoutPage = (orderData = {}) => {
    const { subtotal = 0, estimatedTotal = 0, deliveryFee = 0, discountAmount = 0, discountDescription = '', offerId = '', cartForServer = [], profile = {} } = orderData;

    // Set final order data on the form submit button for easy access in main.js
    const safeCart = Array.isArray(cartForServer) ? cartForServer : [];
    const checkoutButtonData = `data-total="${Number(estimatedTotal).toFixed(2)}" data-offerid="${offerId || 'NA'}" data-cartitems='${JSON.stringify(safeCart)}'`;

    const content = document.createElement('div');
    content.className = 'page-content checkout-page';
    content.innerHTML = `
        <div class="checkout-details-container auth-card">
            <h2>Delivery & Payment</h2>
            <form id="checkout-form" ${checkoutButtonData}>

                <h3 style="margin-bottom: 10px;">Delivery Address</h3>
                <div class="user-details-for-order" style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
                    <p>Name: <span>${profile.firstName || 'N/A'} ${profile.lastName || ''}</span></p>
                    <p>Phone: <span>${profile.phone || 'N/A'}</span></p>
                    <p>Address: <span>${profile.address || 'N/A'}</span></p>
                </div>

                <div class="payment-options-section">
                    <h3>Select Payment Method</h3>
                    <div class="payment-option-group">
                        <div class="payment-option">
                            <input type="radio" id="payment-cod" name="payment-method" value="COD" checked>
                            <label for="payment-cod">Cash on Delivery (COD)</label>
                        </div>
                        <div class="payment-option">
                            <input type="radio" id="payment-upi" name="payment-method" value="UPI" disabled>
                            <label for="payment-upi">Online Payment (UPI) - *Not fully implemented in backend*</label>
                        </div>
                    </div>
                </div>

                <h2 class="order-summary-heading">Final Order Summary</h2>
                <p class="summary-line">Subtotal: <span>${formatPrice(subtotal)}</span></p>
                <p class="summary-line">Delivery Fee: <span>${formatPrice(deliveryFee)}</span></p>
                <p class="summary-line">Discount: <span class="discount-value">${discountDescription}</span></p>
                <p class="summary-line final-total"><strong>Total Payable:</strong> <strong>${formatPrice(estimatedTotal)}</strong></p>

                <button type="submit" id="confirm-order-btn" class="btn primary">Confirm & Place Order</button>
                <button type="button" id="back-to-review-btn" class="btn ghost nav-link" data-page="review">Back to Review</button>
            </form>
        </div>
    `;
    return content;
};

// --- Profile Components ---
export const renderProfilePage = (profile) => {
    // Ensure profile defaults to an empty object if null is passed
    const profileData = profile || {};

    const content = document.createElement('div');
    content.className = 'page-content login-page'; // Reuse auth styling
    content.innerHTML = `
        <div class="auth-card">
            <h1>Update Your Profile</h1>
            <p>Ensure your delivery details are up to date.</p>
            <form class="auth-form" id="profile-form">
                <div class="form-group">
                    <label for="profile-email">Email:</label>
                    <input type="email" id="profile-email" value="${profileData.email || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="profile-phone">Phone:</label>
                    <input type="tel" id="profile-phone" value="${profileData.phone || ''}" disabled>
                </div>
                <div class="form-group">
                    <label for="profile-firstName">First Name:</label>
                    <input type="text" id="profile-firstName" placeholder="First Name" value="${profileData.firstName || ''}" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="profile-lastName">Last Name:</label>
                    <input type="text" id="profile-lastName" placeholder="Last Name" value="${profileData.lastName || ''}" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="profile-address">Delivery Address:</label>
                    <input type="text" id="profile-address" placeholder="Full Delivery Address" value="${profileData.address || ''}" required autocomplete="off">
                </div>
                <button type="submit" class="btn primary">Update Profile</button>
            </form>
        </div>
    `;
    return content;
};

// --- Orders Components ---
// components.js

export const renderOrdersPage = (orders = []) => {
    const content = document.createElement('div');
    content.className = 'page-content orders-page';
    
    // Style to center the content for empty states
    const centerContainerStyle = 'display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; height: 60vh;';

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>Your Past Orders</h1>
            <p>${orders.length} orders found.</p>
        </div>

        ${orders.length > 0 ? `
            <div class="food-grid-container">
                <div class="food-grid">
                    ${orders.map(order => `
                        <div class="food-card order-card" data-id="${order._id}">
                            <div class="food-card-content">
                                <h3>Order ID: #${order.orderId}</h3>
                                <p>Status: <strong>${order.orderStatus}</strong></p>
                                <p>Total: ${formatPrice(order.paidAmount)}</p>
                                <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
                                <button class="btn primary view-details-btn" data-id="${order._id}" style="margin-top: 10px;">View Details</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : `
            <div style="${centerContainerStyle}">
                <i class="fas fa-receipt" style="font-size: 60px; color: #ddd; margin-bottom: 20px;"></i>
                <p style="font-size: 1.2rem; color: #666; margin-bottom: 20px;">You have not placed any orders yet.</p>
                <button class="btn primary nav-link" data-page="home">Start Ordering Now</button>
            </div>
        `}
    `;
    return content;
};

export const renderOrderDetailPage = (order = {}) => {
    // Note: order.items is an array of { food: FoodDoc | string, unit: number }
    const itemsArray = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = itemsArray.map(item => {
        const name = item.food && item.food.name ? item.food.name : `Food Item ID: ${item.food}`;
        const price = item.food && item.food.price ? item.food.price : 0;
        return `
            <div class="order-review-item">
                <span class="item-name">${name} (x${item.unit})</span>
                <span>${formatPrice(price * item.unit)}</span>
            </div>
        `;
    }).join('');

    const content = document.createElement('div');
    content.className = 'page-content order-detail-page';
    content.innerHTML = `
        <button class="btn ghost nav-link" data-page="orders" style="margin-bottom: 20px;">&larr; Back to Orders</button>
        <h1>Order Details #${order.orderId}</h1>
        <div class="checkout-details-container auth-card" style="max-width: 700px;">
            <h3>Order Information</h3>
            <p class="summary-line">Status: <span><strong>${order.orderStatus}</strong></span></p>
            <p class="summary-line">Order Date: <span>${new Date(order.orderDate).toLocaleString()}</span></p>
            <p class="summary-line">Ready Time: <span>${order.readyTime ?? 'N/A'} minutes</span></p>
            <p class="summary-line">Delivery ID: <span>${order.deliveryId || 'Not Assigned'}</span></p>
            <p class="summary-line">Remarks: <span>${order.remarks || 'N/A'}</span></p>

            <h3 class="order-summary-heading">Items Ordered</h3>
            <div class="order-review-items">${itemsHtml}</div>

            <p class="summary-line final-total"><strong>Total Paid:</strong> <strong>${formatPrice(order.paidAmount)}</strong></p>
        </div>
    `;
    return content;
};

// --- Static Pages ---
export const renderAboutPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content about-page';
    content.innerHTML = `
        <div class="about-hero">
            <h1>About FoodieDelight</h1>
            <p>Your journey to deliciousness starts here!</p>
        </div>
        <div class="about-details">
            <div class="about-vision-mission">
                <h2>Our Vision & Mission</h2>
                <p>At FoodieDelight, we believe that great food should be accessible to everyone, effortlessly. Our mission is to connect you with the finest local restaurants and deliver culinary excellence right to your doorstep, ensuring every bite is a delight.</p>
                <p>We strive to be more than just a delivery service; we aim to be your trusted partner in discovering new flavors and enjoying your favorite meals with unparalleled convenience.</p>
            </div>
            <div class="about-why-choose-us">
                <h2>Why Choose FoodieDelight?</h2>
                <ul>
                    <li><strong>Curated Selection:</strong> Hand-picked restaurants ensuring quality and taste.</li>
                    <li><strong>Speedy Delivery:</strong> Fresh and hot meals delivered in record time.</li>
                    <li><strong>Seamless Experience:</strong> Easy ordering, tracking, and customer support.</li>
                    <li><strong>Variety of Cuisines:</strong> A world of flavors at your fingertips.</li>
                </ul>
            </div>
            <div class="about-call-to-action">
                <p>Ready to explore a world of flavors?</p>
                <button class="btn primary nav-link" data-page="home">Start Ordering Now!</button>
            </div>
        </div>
    `;
    return content;
};

export const renderOrderTypesPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content order-types-page';
    content.innerHTML = `
        <h1>Our Order Types</h1>
        <p>FoodieDelight offers various convenient ways to get your food:</p>
        <ul>
            <li class="delivery-option-card">
                <img src="images/delivery_standard.png" alt="Standard Delivery">
                <h3>Standard Delivery</h3>
                <p>Get your food delivered directly to your home or office. Our standard delivery ensures your meal arrives fresh and on time.</p>
            </li>
            <li class="delivery-option-card">
                <img src="images/delivery_express.png" alt="Express Delivery">
                <h3>Express Delivery</h3>
                <p>Need your food faster? Choose express delivery for priority service and quicker arrival times.</p>
            </li>
            <li class="delivery-option-card">
                <img src="images/delivery_scheduled.png" alt="Scheduled Orders">
                <h3>Scheduled Orders</h3>
                <p>Plan ahead! Schedule your orders for a specific date and time, perfect for meal prepping or future events.</p>
            </li>
            <li class="delivery-option-card">
                <img src="images/pickup_option.png" alt="Pickup Option">
                <h3>Pickup Option</h3>
                <p>Prefer to pick up your order yourself? Select the pickup option and collect your meal directly from the restaurant.</p>
            </li>
        </ul>
    `;
    return content;
};

export const renderDiscountsPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content discounts-page';
    content.innerHTML = `
        <h1>Exclusive Discounts & Offers</h1>
        <p>Check out our latest deals to save on your next delicious meal!</p>
        <p style="font-weight: bold; color: var(--primary-color);">Note: Offer verification is handled at checkout using the Pincode-based API. You must use the promocode during the review step.</p>
        <div style="max-width: 900px; margin: 20px auto;">
            <div class="discount-card">
                <h3>FEAST20 (20% Off)</h3>
                <p>Get 20% off all orders over ₹500! Applies to the entire cart value.</p>
                <p>Use code: <strong>FEAST20</strong></p>
            </div>
            <div class="discount-card">
                <h3>FREEDEL (Free Delivery)</h3>
                <p>Enjoy free delivery on all orders every Friday! Check for availability by Pincode.</p>
                <p>Use code: <strong>FREEDEL</strong></p>
            </div>
            <div class="discount-card">
                <h3>Custom Vendor Offers</h3>
                <p>Many restaurants have special offers just for your Pincode! These are automatically checked when you verify your order.</p>
                <button class="btn primary nav-link" data-page="home">Find Local Offers</button>
            </div>
        </div>
    `;

    return content;
};

export const renderContactPage = () => {
    const content = document.createElement('div');
    content.className = 'page-content contact-page';
    content.innerHTML = `
        <div class="contact-hero">
            <h1>Get in Touch with FoodieDelight</h1>
            <p>We're here to help! Reach out to us for any questions, feedback, or support.</p>
        </div>
        <div class="contact-details-container">
            <div class="contact-card">
                <i class="fas fa-headset icon-large"></i>
                <h3>Customer Support</h3>
                <p>Our friendly support team is ready to assist you.</p>
                <p><i class="fas fa-envelope icon-small"></i> Email: <a href="mailto:support@foodiedelight.com">support@foodiedelight.com</a></p>
                <p><i class="fas fa-phone-alt icon-small"></i> Phone: <a href="tel:+1234567890">+91 98765 XXXXX</a></p>
                <p class="availability"><i class="fas fa-clock icon-small"></i> Available: Mon-Sun, 9:00 AM - 10:00 PM EST</p>
            </div>
            <div class="contact-card">
                <i class="fas fa-briefcase icon-large"></i>
                <h3>Business Inquiries</h3>
                <p>For partnerships, media, or other business-related matters.</p>
                <p><i class="fas fa-envelope icon-small"></i> Email: <a href="mailto:partnerships@foodiedelight.com">partnerships@foodiedelight.com</a></p>
            </div>
            <div class="contact-card">
                <i class="fas fa-map-marker-alt icon-large"></i>
                <h3>Visit Our Headquarters</h3>
                <p>Although we're an online service, our main office is located here.</p>
                <p>FoodieDelight Headquarters<br>
                123 Delicious Lane, Flavor Town, FL 12345</p>
            </div>
        </div>
    `;
    return content;
};


// --- ADD THIS TO components.js ---

export const renderFoodSearchResults = (foods = []) => {
    const container = document.createElement('div');
    container.className = 'page-content search-results-container';
    container.innerHTML = `
        <h2>Search Results</h2>
        <p>${foods.length} food items found matching your search.</p>
    `;

    const grid = document.createElement('div');
    grid.className = 'food-grid';

    if (foods.length === 0) {
        container.innerHTML += '<p>No food items found matching your search.</p>';
        return container;
    }

    // Reuse the same card style as the menu page for consistency
    const cardsHtml = foods.map(food => {
        // Calculate price display
        const priceDisplay = `₹${(typeof food.price === 'number' ? food.price.toFixed(2) : '0.00')}`;
        
        // Cloudinary image logic
        const imageSrc = (food.images && food.images.length > 0) ? food.images[0] : 'images/default_food.png';

        return `
            <div class="food-card modern-food-card" data-food-id="${food._id}">
                <div class="food-card-image-container">
                    <img src="${imageSrc}" alt="${food.name}" onerror="this.onerror=null; this.src='images/default_food.png'">
                    <div class="food-card-overlay">
                        <span class="ready-time"><i class="fas fa-clock"></i> ${food.readyTime ?? 'N/A'} min</span>
                    </div>
                </div>
                <div class="food-card-content">
                    <h3>${food.name}</h3>
                    <p class="food-description">${food.description || ''}</p>
                    <div class="food-card-footer">
                        <div class="food-card-price">${priceDisplay}</div>
                        <div class="food-card-controls">
                            <button class="btn-add-to-cart" data-id="${food._id}" title="Add to cart">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cardsHtml;
    container.appendChild(grid);
    return container;
};