const Discount = require('../models/discount');
const Product = require('../models/Product');
const Category = require('../models/category');

// Get all discounts
exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find()
      .populate('products', 'name price')
      .populate('categories', 'name')
      .sort({ createdAt: -1 });
    
    res.render('admin/discounts/index', {
      title: 'Manage Discounts',
      user: req.session.user,
      discounts,
      activePage: 'discounts'
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).render('error', { message: 'Error fetching discounts' });
  }
};

// Show create discount form
exports.showCreateForm = async (req, res) => {
  try {
    const products = await Product.find().select('name price');
    const categories = await Category.find().select('name');
    
    res.render('admin/discounts/create', {
        user: req.session.user,

        title: 'Create Discount',
        products,
        categories,
        activePage: 'discounts'
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.status(500).render('error', { message: 'Error loading create form' });
  }
};

// Create new discount
exports.createDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      products,
      categories
    } = req.body;

    const now = new Date();
    const status = now >= new Date(startDate) && now <= new Date(endDate) ? 'active' : 'scheduled';

    const discount = new Discount({
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      products: products || [],
      categories: categories || [],
      status
    });

    await discount.save();
    res.redirect('/admin/discounts');
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).render('error', { message: 'Error creating discount' });
  }
};

// Show edit discount form
exports.showEditForm = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('products', 'name price')
      .populate('categories', 'name');
    
    const products = await Product.find().select('name price');
    const categories = await Category.find().select('name');

    res.render('admin/discounts/edit', {
      title: 'Edit Discount',
      user: req.session.user,

      discount,
      products,
      categories,
      activePage: 'discounts'
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', { message: 'Error loading edit form' });
  }
};

// Update discount
exports.updateDiscount = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      products,
      categories
    } = req.body;

    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).render('error', { message: 'Discount not found' });
    }

    const now = new Date();
    const status = now >= new Date(startDate) && now <= new Date(endDate) ? 'active' : 'scheduled';

    Object.assign(discount, {
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      products: products || [],
      categories: categories || [],
      status
    });

    await discount.save();
    res.redirect('/admin/discounts');
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).render('error', { message: 'Error updating discount' });
  }
};

// Delete discount
exports.deleteDiscount = async (req, res) => {
  try {
    await Discount.findByIdAndDelete(req.params.id);
    res.redirect('/admin/discounts');
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).render('error', { message: 'Error deleting discount' });
  }
};

// Get active discounts for a product
exports.getProductDiscounts = async (productId) => {
  try {
    const now = new Date();
    return await Discount.find({
      products: productId,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
  } catch (error) {
    console.error('Error fetching product discounts:', error);
    return [];
  }
};

// Get active discounts for a category
exports.getCategoryDiscounts = async (categoryId) => {
  try {
    const now = new Date();
    return await Discount.find({
      categories: categoryId,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
  } catch (error) {
    console.error('Error fetching category discounts:', error);
    return [];
  }
}; 