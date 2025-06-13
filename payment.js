// DOM Elements
const visaOption = document.getElementById('visaOption');
const cashOption = document.getElementById('cashOption');
const visaForm = document.getElementById('visaForm');
const cashForm = document.getElementById('cashForm');

// Function to switch between payment options
function switchPaymentOption(selectedOption) {
  // Remove active class from all options
  visaOption.classList.remove('active');
  cashOption.classList.remove('active');

  // Add active class to the selected option
  selectedOption.classList.add('active');

  // Show the corresponding form
  if (selectedOption === visaOption) {
    visaForm.classList.remove('hidden');
    cashForm.classList.add('hidden');
  } else {
    cashForm.classList.add('hidden');
    visaForm.classList.add('hidden');
    cashForm.classList.remove('hidden');
  }
}

// Event Listeners
visaOption.addEventListener('click', () => switchPaymentOption(visaOption));
cashOption.addEventListener('click', () => switchPaymentOption(cashOption));

// Function to confirm cash payment
function confirmCashPayment() {
  alert('Cash payment confirmed! Our staff will assist you upon delivery.');
}