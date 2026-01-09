const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please add product name'],
    trim: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  medicinalUses: {
    type: String,
    default: ''
  },
  habitat: {
    type: String,
    default: ''
  },
  cultivation: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  previousPrice: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  images: [String],
  properties: [String],
  category: {
    type: String,
    enum: ['medicinal', 'herbal', 'ayurvedic', 'spice'],
    default: 'medicinal'
  },
  rating: {
    stars: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  inStock: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);