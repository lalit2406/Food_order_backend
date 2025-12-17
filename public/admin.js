import { apiCall, renderMessage } from './api.js';

// 1. Create Vendor
const createVendorForm = document.getElementById('create-vendor-form');
if (createVendorForm) {
    createVendorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Convert form data to JSON object (Admin create doesn't use FormData in backend)
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Convert foodType string to array
        data.foodType = data.foodType.split(',').map(s => s.trim());

        try {
            await apiCall('/admin/vandor', 'POST', data);
            renderMessage('success', 'Vendor Created Successfully!');
            e.target.reset();
            loadVendors();
        } catch (error) {
            renderMessage('error', 'Failed to create vendor: ' + error.message);
        }
    });
}

// 2. Load Vendors
async function loadVendors() {
    const container = document.getElementById('vendor-list');
    if (!container) return;

    try {
        const vendors = await apiCall('/admin/vandors', 'GET');
        
        if (!vendors || vendors.length === 0) {
            container.innerHTML = '<p>No vendors found.</p>';
            return;
        }

        container.innerHTML = vendors.map(v => `
            <div class="auth-card" style="padding: 15px; margin: 0; text-align: left;">
                <h3>${v.name}</h3>
                <p><strong>ID:</strong> ${v._id}</p>
                <p><strong>Email:</strong> ${v.email}</p>
                <p><strong>Pincode:</strong> ${v.pincode}</p>
                <p><strong>Phone:</strong> ${v.phone}</p>
            </div>
        `).join('');
    } catch (error) { 
        console.error(error);
        container.innerHTML = '<p>Failed to load vendors.</p>';
    }
}

// Initial Load
loadVendors();