
export const foodCategories = [
    'All',
    'Indian',
    'Chinese',
    'Italian',
    'American',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Seafood',
    'Bakery-Desserts',
    'Vegetarian',
    'Non-Vegetarian',
    'Drinks'
];

export const discounts = [
    // Mock discount data used for display
    {
        id: 'DISC20',
        name: 'Weekend Feast',
        description: 'Get 20% off all orders over ₹500!',
        code: 'FEAST20',
        minOrder: 500,
        discountPercent: 20
    },
    {
        id: 'FREEDEL',
        name: 'Free Delivery Friday',
        description: 'Enjoy free delivery on all orders every Friday!',
        code: 'FREEDEL',
        minOrder: 0,
        deliveryDiscount: true
    },
    {
        id: 'BURGERBOGO',
        name: 'Burger Buy One Get One',
        description: 'Buy one Gourmet Cheddar Burger, get one 50% off!',
        code: 'BURGERBOGO',
        appliesTo: 'burger-cheddar',
        type: 'BOGO'
    }
];

export const foodItems = [];
