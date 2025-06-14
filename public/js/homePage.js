
// Add to your JS
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollProgress = (scrollTop / scrollHeight) * 100;
  document.querySelector('.scroll-progress').style.width = scrollProgress + '%';
});

// Carousel Functionality
let currentSlide = 0;
let autoPlayInterval;

const carouselInner = document.querySelector('.carousel-inner');
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.indicator');

// Function to show a specific slide
function showSlide(index) {
  if (index >= slides.length) {
    currentSlide = 0;
  } else if (index < 0) {
    currentSlide = slides.length - 1;
  } else {
    currentSlide = index;
  }

  const offset = -currentSlide * 100;
  carouselInner.style.transform = `translateX(${offset}%)`;

  // Update active dot
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// Function to go to the next slide
function nextSlide() {
  showSlide(currentSlide + 1);
}

// Function to go to the previous slide
function prevSlide() {
  showSlide(currentSlide - 1);
}

// Function to go to a specific slide
function goToSlide(index) {
  showSlide(index);
}

// Start auto-play
function startAutoPlay() {
  autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

// Stop auto-play (optional, if you want to stop on user interaction)
function stopAutoPlay() {
  clearInterval(autoPlayInterval);
}

// Initialize carousel
function initializeCarousel() {
  // Add event listeners to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
  });

  // Start auto-play
  startAutoPlay();

  // Optional: Stop auto-play on user interaction
  carouselInner.addEventListener('mouseenter', stopAutoPlay);
  carouselInner.addEventListener('mouseleave', startAutoPlay);
}

// Initialize the carousel when the page loads
initializeCarousel();


document.getElementById('send-btn').addEventListener('click', async function() {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;
  
  // Add user message to chat
  addMessage('user', userInput);
  
  // Get bot response
  const response = await fetch('/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: userInput })
  });
  
  const data = await response.json();
  addMessage('bot', data.answer);
  
  // Clear input
  document.getElementById('user-input').value = '';
});

function addMessage(sender, text) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}