console.log('Admin Products JS file loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  // Modal elements
  const modal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const addProductBtn = document.querySelector('.add-product');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const productForm = document.getElementById('productForm');
  
  // Delete modal elements
  const deleteProductName = document.getElementById('deleteProductName');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  let productToDelete = null;
  
  // Image upload elements
  const uploadBtn = document.getElementById('uploadBtn');
  const productImage = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = imagePreview.querySelector('.image-preview__image');
  const previewDefaultText = imagePreview.querySelector('.image-preview__default-text');
  
  // Flash message function
  function showFlash(message, type) {
    const flashDiv = document.createElement('div');
    flashDiv.className = `alert alert-${type}`;
    flashDiv.textContent = message;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.admin-main');
    mainContent.insertBefore(flashDiv, mainContent.firstChild);

    // Remove after 5 seconds
    setTimeout(() => {
      flashDiv.remove();
    }, 5000);
  }
  
  // Using event delegation for delete and edit buttons
  document.addEventListener('click', function(e) {
    // Handle delete button clicks
    if (e.target.closest('.delete')) {
      e.preventDefault();
      const deleteBtn = e.target.closest('.delete');
      productToDelete = deleteBtn.dataset.id;
      deleteProductName.textContent = deleteBtn.dataset.name;
      // Store reference to the product card
      deleteBtn.productCard = deleteBtn.closest('.product-card');
      deleteModal.style.display = 'block';
    }
    
    // Handle edit button clicks
    if (e.target.closest('.edit')) {
      e.preventDefault();
      const editBtn = e.target.closest('.edit');
      handleEditClick(editBtn);
    }
  });

  // Handle delete confirmation
  confirmDeleteBtn.addEventListener('click', async function() {
    try {
      const response = await fetch(`/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Close the modal first
      deleteModal.style.display = 'none';
      
      if (response.ok) {
        // Show success message
        showFlash('Product deleted successfully', 'success');
        
        // Find and remove the product card
        const productCard = document.querySelector(`.delete[data-id="${productToDelete}"]`).closest('.product-card');
        if (productCard) {
          productCard.remove();
        }
        
        // Reset the productToDelete variable
        productToDelete = null;
      } else {
        const data = await response.json();
        showFlash(data.error || 'Failed to delete product', 'danger');
      }
    } catch (error) {
      console.error('Error:', error);
      showFlash('Failed to delete product', 'danger');
      deleteModal.style.display = 'none';
    }
  });

  // Check for flash message in sessionStorage on page load
  window.addEventListener('load', function() {
    const flashMessage = sessionStorage.getItem('flashMessage');
    const flashType = sessionStorage.getItem('flashType');
    
    if (flashMessage) {
      showFlash(flashMessage, flashType);
      // Clear the stored message
      sessionStorage.removeItem('flashMessage');
      sessionStorage.removeItem('flashType');
    }
  });

  // Cancel delete
  cancelDeleteBtn.addEventListener('click', function() {
    deleteModal.style.display = 'none';
    productToDelete = null;
  });

  // Edit product functionality
  async function handleEditClick(editBtn) {
    const productId = editBtn.dataset.id;
    console.log('Edit button clicked, product ID:', productId);
    try {
      const response = await fetch(`/admin/products/${productId}`);
      console.log('Fetch response:', response);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      const data = await response.json();
      console.log('Raw response data:', data);
      
      // Extract the product from the response
      const product = data.product || data;
      console.log('Product data:', product);
      
      // Set form values with null checks and default values
      const nameInput = document.getElementById('productName');
      const priceInput = document.getElementById('productPrice');
      const stockInput = document.getElementById('productStock');
      const descriptionInput = document.getElementById('productDescription');
      
      if (nameInput) nameInput.value = product.name || '';
      if (priceInput) priceInput.value = product.price || 0;
      if (stockInput) stockInput.value = product.stock || 0;
      if (descriptionInput) descriptionInput.value = product.description || '';
      
      // Handle category selection
      const categorySelect = document.getElementById('productCategory');
      if (categorySelect && product.category && product.category._id) {
        categorySelect.value = product.category._id;
      }
      
      // Handle image
      if (product.imageUrl || product.imagePath) {
        previewImage.src = product.imageUrl || product.imagePath;
        previewImage.style.display = 'block';
        previewDefaultText.style.display = 'none';
      } else {
        previewImage.src = '';
        previewImage.style.display = 'none';
        previewDefaultText.style.display = 'block';
      }
      
      // Update form action and method
      const form = document.getElementById('productForm');
      form.action = `/admin/products/${productId}`;
      form.method = 'POST';
      
      // Remove any existing method override field
      const existingMethodField = form.querySelector('input[name="_method"]');
      if (existingMethodField) {
        existingMethodField.remove();
      }
      
      document.getElementById('modalTitle').textContent = 'Edit Product';
      document.getElementById('submitBtn').textContent = 'Update Product';
      
      // Show the modal
      modal.style.display = 'block';
    } catch (error) {
      console.error('Error:', error);
      showFlash('Failed to load product details', 'danger');
    }
  }
  
  // Modal functions
  function openModal() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetForm();
  }
  
  function resetForm() {
    productForm.reset();
    productForm.action = '/admin/products/create';
    productForm.setAttribute('method', 'POST');
    
    // Reset image preview
    previewImage.style.display = 'none';
    previewDefaultText.style.display = 'block';
    previewImage.src = '';
    
    // Reset modal title and submit button
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('submitBtn').textContent = 'Add Product';
  }
  
  addProductBtn.addEventListener('click', function() {
    resetForm();
    openModal();
  });
  
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
      productToDelete = null;
    }
  });
  
  // Image preview functionality
  uploadBtn.addEventListener('click', function() {
    productImage.click();
  });
  
  productImage.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        previewDefaultText.style.display = 'none';
      }
      
      reader.readAsDataURL(e.target.files[0]);
    }
  });
});

// Prevent body scroll when modal is open
function disableBodyScroll() {
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
}

function enableBodyScroll() {
  document.body.style.overflow = 'auto';
  document.body.style.position = 'static';
}

// Update your open/close functions:
function openModal() {
  modal.style.display = 'block';
  disableBodyScroll();
}