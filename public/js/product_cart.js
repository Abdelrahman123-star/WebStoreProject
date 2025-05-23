function updateQuantity(button, change) {
    const input = button.parentElement.querySelector('input');
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    input.value = value;
    updateSummary();
}

function removeItem(button) {
    const item = button.parentElement.parentElement;
    item.style.transition = 'opacity 0.3s ease';
    item.style.opacity = '0';
    setTimeout(() => item.remove(), 300);
    setTimeout(updateSummary, 300);
}

function addToCart() {
    const quantity = document.querySelector('.product-info .quantity input').value;
    alert(`Added ${quantity} item(s) to cart!`);
}

function updateSummary() {
    const items = document.querySelectorAll('.cart-item');
    let subtotal = 0;
    items.forEach(item => {
        const price = parseFloat(item.querySelector('p').textContent.replace('EGP ', '').replace(',', ''));
        const quantity = parseInt(item.querySelector('input').value);
        subtotal += price * quantity;
    });
    const shipping = 100;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `EGP ${subtotal.toLocaleString('en-EG')}`;
    document.getElementById('shipping').textContent = `EGP ${shipping.toLocaleString('en-EG')}`;
    document.getElementById('total').textContent = `EGP ${total.toLocaleString('en-EG')}`;
}