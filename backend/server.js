require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // ADD THIS LINE
const Contact = require('./models/Contact');
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // SERVE FRONTEND FILES

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herbal_garden';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas!');
  console.log('📁 Database: herbal_garden');
  console.log('👁️  View data at: https://cloud.mongodb.com/');
  
  // Seed products if database is empty
  await seedProducts();
})
.catch((err) => {
  console.log('⚠️  MongoDB Connection Warning:', err.message);
});

// ==================== SEED PRODUCTS ====================
async function seedProducts() {
  try {
    const count = await Product.countDocuments();
    
    if (count === 0) {
      console.log('🌱 Seeding products to MongoDB...');
      
      const products = [
        {
          id: 1,
          name: "Tulsi",
          scientificName: "Ocimum sanctum",
          description: "Holy Basil, known for its spiritual significance and medicinal properties.",
          medicinalUses: "Anti-inflammatory, anti-viral, antioxidant properties. Boosts immunity, relieves stress.",
          habitat: "Native to India, commonly found in gardens and tropical regions.",
          cultivation: "Prefers warm climates, well-drained soil, and regular watering.",
          price: 13.43,
          previousPrice: 15.99,
          image: "https://static.tnn.in/thumb/msid-97568598,thinksize-124936,width-1280,height-720,resizemode-75/97568598.jpg",
          images: [
            "https://static.tnn.in/thumb/msid-97568598,thinksize-124936,width-1280,height-720,resizemode-75/97568598.jpg",
            "https://thumbs.dreamstime.com/b/green-fresh-basil-leaves-isolated-white-background-151477477.jpg"
          ],
          properties: ["Immune Booster", "Respiratory Health", "Stress Relief", "Antibacterial"],
          category: "medicinal",
          rating: { stars: 4.5, reviewCount: 128 },
          featured: true
        },
        // ... keep all other products the same
      ];

      await Product.insertMany(products);
      console.log(`✅ ${products.length} products seeded to MongoDB Atlas!`);
    } else {
      console.log(`📊 Found ${count} existing products in database`);
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }
}

// ==================== ROUTES ====================

// Serve main website (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    collections: ['contacts', 'products', 'orders']
  });
});

// ==================== PRODUCT ROUTES ====================

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, featured } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    
    console.log(`📦 Sent ${products.length} products to client`);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
  try {
    let product;
    
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      product = await Product.findById(req.params.id);
    }
    
    if (!product) {
      product = await Product.findOne({ id: req.params.id });
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// SEARCH PRODUCTS
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { scientificName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products'
    });
  }
});

// ==================== CONTACT ROUTES ====================

// SUBMIT CONTACT FORM
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });

    await contact.save();

    console.log('='.repeat(50));
    console.log('📧 NEW FORM SUBMISSION SAVED!');
    console.log(`   👤 Name: ${name}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   📝 Subject: ${subject}`);
    console.log(`   🆔 ID: ${contact._id}`);
    console.log('='.repeat(50));

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent.',
      data: {
        id: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error saving contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// VIEW ALL CONTACTS
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// ==================== ORDER ROUTES ====================

// CREATE ORDER
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, notes } = req.body;

    if (!customer || !customer.name || !customer.email || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer info and items are required'
      });
    }

    const orderId = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    const order = new Order({
      orderId,
      customer,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      notes
    });

    await order.save();

    console.log('='.repeat(50));
    console.log('🛒 NEW ORDER PLACED!');
    console.log(`   📦 Order ID: ${orderId}`);
    console.log(`   👤 Customer: ${customer.name}`);
    console.log(`   💰 Total: $${totalAmount}`);
    console.log(`   📝 Items: ${items.length} products`);
    console.log(`   🆔 MongoDB ID: ${order._id}`);
    console.log('='.repeat(50));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId,
        orderDate: order.createdAt,
        totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
});

// VIEW ALL ORDERS
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

// Serve all other frontend files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../')));

// Handle 404 for frontend routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 HERBAL GARDEN FULL-STACK APPLICATION STARTED!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 WEBSITE: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('📋 AVAILABLE ENDPOINTS:');
  console.log(`   🏠 Website: http://localhost:${PORT}/`);
  console.log(`   📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`   📧 Contact API: http://localhost:${PORT}/api/contact`);
  console.log(`   🛒 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`   👁️  Admin Contacts: http://localhost:${PORT}/api/contacts`);
  console.log(`   👁️  Admin Orders: http://localhost:${PORT}/api/orders`);
  console.log('='.repeat(60));
  console.log('💾 DATA SAVED TO YOUR MONGODB ATLAS:');
  console.log('   • contacts - Form submissions');
  console.log('   • products - All medicinal plants');
  console.log('   • orders - Customer orders');
  console.log('💡 View at: https://cloud.mongodb.com/');
  console.log('='.repeat(60));
});