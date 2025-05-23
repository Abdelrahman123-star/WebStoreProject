// DOM Elements
const searchInput = document.querySelector('.search-by-category input');
const categoryButtons = document.querySelectorAll('.category-buttons button');
const productCards = document.querySelectorAll('.product-card');
const showAllButton = document.querySelector('.category-buttons .show-all');

// Function to filter products by category
function filterProducts(category) {
  productCards.forEach(card => {
    const cardCategory = card.getAttribute('data-category');
    if (category === 'all' || cardCategory === category) {
      card.style.display = 'block'; // Show the product
    } else {
      card.style.display = 'none'; // Hide the product
    }
  });
}

// Function to handle category button clicks
function handleCategoryButtonClick(event) {
  const selectedCategory = event.target.getAttribute('data-category');

  // Remove active class from all buttons
  categoryButtons.forEach(button => button.classList.remove('active'));

  // Add active class to the clicked button
  event.target.classList.add('active');

  // Filter products based on the selected category
  filterProducts(selectedCategory);
}

// Function to handle search input
function handleSearchInput() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  productCards.forEach(card => {
    const cardCategory = card.getAttribute('data-category').toLowerCase();
    if (cardCategory.includes(searchTerm)) {
      card.style.display = 'block'; // Show the product
    } else {
      card.style.display = 'none'; // Hide the product
    }
  });
}

// Function to show all categories
function showAllCategories() {
  // Remove active class from all buttons
  categoryButtons.forEach(button => button.classList.remove('active'));

  // Add active class to the "All" button
  categoryButtons[0].classList.add('active');

  // Show all products
  filterProducts('all');
}

// Event Listeners
// Add click event to category buttons
categoryButtons.forEach(button => {
  button.addEventListener('click', handleCategoryButtonClick);
});

// Add input event to search bar
searchInput.addEventListener('input', handleSearchInput);

// Add click event to "Show All Categories" button
showAllButton.addEventListener('click', showAllCategories);

// Initialize by showing all products
showAllCategories();