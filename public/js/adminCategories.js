document.addEventListener('DOMContentLoaded', function() {
  // Modal elements
  const modal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const addCategoryBtn = document.querySelector('.add-product');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const categoryForm = document.getElementById('productForm');
  
  // Delete modal elements
  const deleteCategoryName = document.getElementById('deleteCategoryName');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  let categoryToDelete = null;
  
  // Image upload elements
  const uploadBtn = document.getElementById('uploadBtn');
  const categoryImage = document.getElementById('productImage');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = imagePreview.querySelector('.image-preview__image');
  const previewDefaultText = imagePreview.querySelector('.image-preview__default-text');
  
  // Flash message function
  function showFlash(message, type) {
    const flashDiv = document.createElement('div');
    flashDiv.className = `alert alert-${type}`;
    flashDiv.textContent = message;
    
    const mainContent = document.querySelector('.admin-main');
    mainContent.insertBefore(flashDiv, mainContent.firstChild);

    setTimeout(() => {
      flashDiv.remove();
    }, 5000);
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
    categoryForm.reset();
    categoryForm.action = '/admin/categories/create';
    previewImage.style.display = 'none';
    previewDefaultText.style.display = 'block';
    previewImage.src = '';
    document.getElementById('modalTitle').textContent = 'Add New Category';
    document.getElementById('submitBtn').textContent = 'Add Category';
  }

  // Delete category functionality
  async function handleDeleteCategory(categoryId) {
    try {
      const response = await fetch(`/admin/categories/delete/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Delete response:', data);
      
      if (data.success) {
        showFlash(data.message || 'Category deleted successfully', 'success');
        const categoryCard = document.querySelector(`.delete[data-id="${categoryId}"]`).closest('.category-card');
        if (categoryCard) {
          categoryCard.remove();
        }
      } else {
        const errorMessage = data.error || 'Failed to delete category';
        showFlash(errorMessage, 'danger');
        if (errorMessage.includes('product(s)')) {
          // showFlash('Please remove or reassign all products before deleting this category.', 'warning');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showFlash('Failed to delete category', 'danger');
    }
  }

  // Event Listeners
  // Delete button click
  document.addEventListener('click', function(e) {
    if (e.target.closest('.delete')) {
      e.preventDefault();
      const deleteBtn = e.target.closest('.delete');
      categoryToDelete = deleteBtn.dataset.id;
      deleteCategoryName.textContent = deleteBtn.dataset.name;
      deleteModal.style.display = 'block';
    }
  });

  // Edit button click
  document.addEventListener('click', async function(e) {
    if (e.target.closest('.edit-btn')) {
      e.preventDefault();
      const editBtn = e.target.closest('.edit-btn');
      const categoryId = editBtn.dataset.id;
      
      try {
        const response = await fetch(`/admin/categories/edit/${categoryId}`);
        if (!response.ok) throw new Error('Failed to fetch category details');
        
        const category = await response.json();
        
        // Populate form
        document.getElementById('productName').value = category.name;
        document.getElementById('productDescription').value = category.description || '';
        document.getElementById('imageUrl').value = category.imageUrl || '';
        
        // Update image preview
        if (category.imageUrl || category.imagePath) {
          previewImage.src = category.imageUrl || category.imagePath;
          previewImage.style.display = 'block';
          previewDefaultText.style.display = 'none';
        }
        
        // Update form for edit
        categoryForm.action = `/admin/categories/update/${categoryId}`;
        document.getElementById('modalTitle').textContent = 'Edit Category';
        document.getElementById('submitBtn').textContent = 'Update Category';
        
        openModal();
      } catch (error) {
        console.error('Error:', error);
        showFlash('Failed to load category details', 'danger');
      }
    }
  });

  // Delete confirmation
  confirmDeleteBtn.addEventListener('click', function() {
    if (categoryToDelete) {
      handleDeleteCategory(categoryToDelete);
      deleteModal.style.display = 'none';
      categoryToDelete = null;
    }
  });

  // Cancel delete
  cancelDeleteBtn.addEventListener('click', function() {
    deleteModal.style.display = 'none';
    categoryToDelete = null;
  });

  // Add category button
  addCategoryBtn.addEventListener('click', function() {
    resetForm();
    openModal();
  });

  // Close modal buttons
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
      categoryToDelete = null;
    }
  });

  // Image preview functionality
  uploadBtn.addEventListener('click', function() {
    categoryImage.click();
  });

  categoryImage.addEventListener('change', function(e) {
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