// ==================== HERBAL GARDEN APP - COMPLETE VERSION ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌿 Herbal Garden Website Loaded');
  
  // Use relative URLs since frontend/backend are on same server
  const API_BASE_URL = ''; // Empty because same origin
  
  // ==================== CART SYSTEM ====================
  let listProductHTML = document.querySelector('.js-product-grid');
  let listCartHTML = document.querySelector('.listCart');
  let iconCart = document.querySelector('.cart');
  let iconCartSpan = document.querySelector('.cart-quantity');
  let body = document.querySelector('body');
  let closeCart = document.querySelector('.close');
  let checkOutBtn = document.querySelector('.checkOut');
  
  let products = [];
  let cart = [];

  // Toggle Cart
  if (iconCart) {
    iconCart.addEventListener('click', () => body.classList.toggle('showCart'));
  }
  if (closeCart) {
    closeCart.addEventListener('click', () => body.classList.toggle('showCart'));
  }

  // ==================== LOAD PRODUCTS FROM MONGODB ====================
  async function loadProducts() {
    try {
      console.log('📦 Loading products from MongoDB...');
      
      const response = await fetch('/api/products'); // CHANGED: Removed localhost:5000
      const data = await response.json();
      
      if (data.success) {
        products = data.data;
        console.log(`✅ Loaded ${products.length} products from MongoDB`);
        renderProducts();
        loadCartFromStorage();
      } else {
        throw new Error('Failed to load products from API');
      }
    } catch (error) {
      console.error('❌ Error loading from MongoDB:', error);
      console.log('⚠️ Falling back to local products.json...');
      
      // Fallback to local JSON
      try {
        const response = await fetch('products.json');
        products = await response.json();
        console.log(`✅ Loaded ${products.length} products from local file`);
        renderProducts();
        loadCartFromStorage();
      } catch (localError) {
        console.error('❌ Failed to load products:', localError);
        if (listProductHTML) {
          listProductHTML.innerHTML = '<p class="error">Unable to load products. Please try again later.</p>';
        }
      }
    }
  }

  // ==================== RENDER PRODUCTS ====================
  function renderProducts() {
    if (!listProductHTML) return;
    
    listProductHTML.innerHTML = '';
    
    if (products.length === 0) {
      listProductHTML.innerHTML = '<p class="no-products">No products available.</p>';
      return;
    }
    
    products.forEach(product => {
      const div = document.createElement('div');
      div.className = 'item';
      div.dataset.id = product.id || product._id;
      
      const nameHash = product.name ? product.name.replace(/\s+/g, '') : '';
      
      div.innerHTML = `
        <div class="Tulsi">
          <a href="index3.html#${nameHash}">
            <img src="${product.image || product.images?.[0] || '/images/placeholder.png'}" 
                 alt="${product.name}" 
                 onerror="this.src='/images/placeholder.png'">
          </a>
          <h4>${product.name || 'Unknown Plant'}</h4>
          
          <div class="rating">
            <div class="stars">
              ${getStarsHTML(product.rating?.stars || 0)}
            </div>
            <span>${(product.rating?.stars || 0).toFixed(1)} (${product.rating?.reviewCount || 0})</span>
          </div>
          
          ${product.description ? `<p class="product-description">${product.description.substring(0, 80)}...</p>` : ''}
          
          <div class="product-footer">
            <div class="product-price">
              $${(product.price || 0).toFixed(2)} 
              ${product.previousPrice ? `<span>$${(product.previousPrice).toFixed(2)}</span>` : ''}
            </div>
            <button class="add-to-cart" data-id="${product.id || product._id}">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>
      `;
      
      listProductHTML.appendChild(div);
    });
    
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.dataset.id;
        addToCart(productId);
        
        this.classList.add('added');
        this.innerHTML = '<i class="fas fa-check"></i> Added';
        
        setTimeout(() => {
          this.classList.remove('added');
          this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }, 1500);
      });
    });
  }

  function getStarsHTML(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    return stars;
  }

  // ==================== CART FUNCTIONS ====================
  function addToCart(productId) {
    const product = products.find(p => (p.id == productId) || (p._id == productId));
    if (!product) return;
    
    const existing = cart.find(item => item.product_id == productId);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({
        product_id: productId,
        name: product.name,
        price: product.price,
        image: product.image || product.images?.[0],
        quantity: 1
      });
    }
    
    updateCartDisplay();
    saveCartToStorage();
    showNotification('Product added to cart!');
  }

  function updateCartDisplay() {
    if (!listCartHTML) return;
    
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalAmount = 0;

    cart.forEach(item => {
      const product = products.find(p => (p.id == item.product_id) || (p._id == item.product_id));
      if (product) {
        totalQuantity += item.quantity;
        totalAmount += (item.price || product.price) * item.quantity;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.dataset.id = item.product_id;
        
        itemDiv.innerHTML = `
          <div class="image">
            <img src="${item.image || product.image || '/images/placeholder.png'}" 
                 alt="${item.name || product.name}">
          </div>
          <div class="name">${item.name || product.name}</div>
          <div class="totalPrice">$${((item.price || product.price) * item.quantity).toFixed(2)}</div>
          <div class="quantity">
            <span class="minus" data-id="${item.product_id}">-</span>
            <span>${item.quantity}</span>
            <span class="plus" data-id="${item.product_id}">+</span>
          </div>
        `;
        
        listCartHTML.appendChild(itemDiv);
      }
    });

    if (iconCartSpan) {
      iconCartSpan.textContent = totalQuantity;
    }

    const totalDiv = document.createElement('div');
    totalDiv.className = 'cart-total';
    totalDiv.innerHTML = `
      <hr>
      <div class="total-amount-container">
        <span class="total-label">Total Amount:</span>
        <span class="total-value">$${totalAmount.toFixed(2)}</span>
      </div>
      ${cart.length > 0 ? '<button class="checkout-btn">Proceed to Checkout</button>' : ''}
    `;
    
    listCartHTML.appendChild(totalDiv);

    listCartHTML.querySelectorAll('.minus').forEach(btn => {
      btn.addEventListener('click', function() {
        updateQuantity(this.dataset.id, -1);
      });
    });
    
    listCartHTML.querySelectorAll('.plus').forEach(btn => {
      btn.addEventListener('click', function() {
        updateQuantity(this.dataset.id, 1);
      });
    });
    
    const checkoutBtn = totalDiv.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', showCheckoutModal);
    }
  }

  function updateQuantity(productId, change) {
    const item = cart.find(item => item.product_id == productId);
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        cart = cart.filter(item => item.product_id != productId);
      }
      updateCartDisplay();
      saveCartToStorage();
    }
  }

  function saveCartToStorage() {
    localStorage.setItem('herbal_garden_cart', JSON.stringify(cart));
  }

  function loadCartFromStorage() {
    const saved = localStorage.getItem('herbal_garden_cart');
    if (saved) {
      cart = JSON.parse(saved);
      updateCartDisplay();
    }
  }

  // ==================== CHECKOUT FUNCTIONALITY ====================
  function showCheckoutModal() {
    const modalHTML = `
      <div class="checkout-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
        ">
          <h2 style="margin-top: 0;">Checkout</h2>
          
          <div id="checkoutItems" style="margin-bottom: 20px;"></div>
          
          <form id="checkoutForm">
            <h3>Customer Details</h3>
            <input type="text" id="checkoutName" placeholder="Full Name" required style="width: 100%; padding: 10px; margin: 5px 0;">
            <input type="email" id="checkoutEmail" placeholder="Email" required style="width: 100%; padding: 10px; margin: 5px 0;">
            <input type="tel" id="checkoutPhone" placeholder="Phone" style="width: 100%; padding: 10px; margin: 5px 0;">
            <textarea id="checkoutAddress" placeholder="Shipping Address" rows="3" required style="width: 100%; padding: 10px; margin: 5px 0;"></textarea>
            
            <h3>Payment Method</h3>
            <select id="paymentMethod" style="width: 100%; padding: 10px; margin: 5px 0;">
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Payment</option>
            </select>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="button" onclick="closeCheckoutModal()" style="flex: 1; padding: 10px; background: #ccc;">Cancel</button>
              <button type="submit" style="flex: 1; padding: 10px; background: #4CAF50; color: white;">Place Order</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
    
    const itemsDiv = modalDiv.querySelector('#checkoutItems');
    let total = 0;
    
    cart.forEach(item => {
      const product = products.find(p => (p.id == item.product_id) || (p._id == item.product_id));
      if (product) {
        const itemTotal = (item.price || product.price) * item.quantity;
        total += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.justifyContent = 'space-between';
        itemDiv.style.marginBottom = '5px';
        itemDiv.innerHTML = `
          <span>${item.name || product.name} × ${item.quantity}</span>
          <span>$${itemTotal.toFixed(2)}</span>
        `;
        itemsDiv.appendChild(itemDiv);
      }
    });
    
    const totalDiv = document.createElement('div');
    totalDiv.style.display = 'flex';
    totalDiv.style.justifyContent = 'space-between';
    totalDiv.style.marginTop = '10px';
    totalDiv.style.paddingTop = '10px';
    totalDiv.style.borderTop = '1px solid #ddd';
    totalDiv.style.fontWeight = 'bold';
    totalDiv.innerHTML = `
      <span>Total:</span>
      <span>$${total.toFixed(2)}</span>
    `;
    itemsDiv.appendChild(totalDiv);
    
    const form = modalDiv.querySelector('#checkoutForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const orderData = {
        customer: {
          name: document.getElementById('checkoutName').value,
          email: document.getElementById('checkoutEmail').value,
          phone: document.getElementById('checkoutPhone').value,
          address: document.getElementById('checkoutAddress').value
        },
        items: cart.map(item => ({
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        totalAmount: total,
        paymentMethod: document.getElementById('paymentMethod').value
      };
      
      try {
        const response = await fetch('/api/orders', { // CHANGED: Removed localhost:5000
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert(`🎉 Order placed successfully!\nOrder ID: ${data.data.orderId}\nTotal: $${data.data.totalAmount}`);
          
          cart = [];
          updateCartDisplay();
          saveCartToStorage();
          closeCheckoutModal();
          
          body.classList.remove('showCart');
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        alert(`❌ Error: ${error.message}`);
      }
    });
    
    window.closeCheckoutModal = function() {
      document.body.removeChild(modalDiv);
    };
  }

  // ==================== CONTACT FORM ====================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submitBtn');
      const formMessage = document.getElementById('formMessage');
      
      const formData = {
        name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim()
      };
      
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        showMessage('Please fill all required fields', 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      
      try {
        console.log('📤 Sending form to backend...');
        
        const response = await fetch('/api/contact', { // CHANGED: Removed localhost:5000
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          showMessage('✅ ' + data.message, 'success');
          contactForm.reset();
          console.log('🎉 Form submitted to MongoDB!');
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (error) {
        console.error('❌ Form error:', error);
        showMessage('❌ Error: ' + error.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }
  
  function showMessage(text, type) {
    const formMessage = document.getElementById('formMessage');
    if (!formMessage) return;
    
    formMessage.textContent = text;
    formMessage.style.display = 'block';
    formMessage.style.padding = '10px';
    formMessage.style.marginTop = '15px';
    formMessage.style.borderRadius = '5px';
    formMessage.style.color = type === 'success' ? '#155724' : '#721c24';
    formMessage.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    formMessage.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
    
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  }
  
  function showNotification(text) {
    const notification = document.createElement('div');
    notification.textContent = text;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // ==================== INITIALIZE ====================
  loadProducts();
  
  // Test backend connection
  fetch('/health') // CHANGED: Removed localhost:5000
    .then(res => res.json())
    .then(data => {
      console.log('✅ Backend connected:', data);
      console.log('💾 Data saved to your MongoDB Atlas account');
    })
    .catch(err => console.log('⚠️ Backend not reachable:', err.message));
});