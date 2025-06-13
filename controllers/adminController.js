const mongoose = require('mongoose');
const collection = require('../database');
const UserModel = require('../models/User');
const Category = require('../models/category');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.showDashboard = async (req, res, activePage) => {
  try {
    // Fetch all required statistics
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      topSellingProducts
    ] = await Promise.all([
      // Total Products
      Product.countDocuments(),
      
      // Total Orders
      Order.countDocuments(),
      
      // Total Users
      collection.User.countDocuments(),
      
      // Total Revenue (sum of all order totals)
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Recent Orders (last 5)
      Order.find()
        .populate('user', 'username email')
        .sort({ orderDate: -1 })
        .limit(5),
      
      // Low Stock Products (less than 10 items)
      Product.find({ stock: { $lt: 10 } })
        .select('name stock price')
        .limit(5),
      
      // Top Selling Products
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { 
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' }
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }},
        { $unwind: '$productDetails' }
      ])
    ]);

    // Calculate total revenue
    const revenue = totalRevenue[0]?.total || 0;

    res.render('admin/dashboard', {
      user: req.session.user,
      activePage,
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: revenue.toFixed(2)
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.render('admin/dashboard', {
      user: req.session.user,
      activePage,
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: '0.00'
      },
      recentOrders: [],
      lowStockProducts: [],
      topSellingProducts: []
    });
  }
};

exports.showProducts = async (req, res, activePage) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    
    // Fetch both products and categories
    const [products, totalProducts, categories] = await Promise.all([
      collection.Product.find()
        .populate({
          path: 'category',
          select: 'name slug _id'
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      collection.Product.countDocuments(),
      Category.find().sort({ name: 1 }) // Sort categories alphabetically
    ]);

    const totalPages = Math.ceil(totalProducts / limit);
    res.render('admin/products', {
      user: req.session.user,
      activePage,
      products,
      categories,
      currentPage: page,
      totalPages,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('admin/products', {
      user: req.session.user,
      activePage,
      products: [],
      categories: [],
      currentPage: 1,
      totalPages: 1,
      success: req.flash("success"),
      error: req.flash("error")
    });
  }
};

exports.showOrders = (req, res, activePage) => {
  res.render('admin/orders', {
    user: req.session.user,
    activePage
  });
};

// function 3shan ne export el users mn el database
exports.showUsers = async (req, res, activePage) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    
    const [users, totalUsers] = await Promise.all([
      collection.User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      collection.User.countDocuments()
    ]);

    const totalPages = Math.ceil(totalUsers / limit);
    
    res.render('admin/users', {
      user: req.session.user,
      activePage,
      users,
      currentPage: page,
      totalPages,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).render('admin/users', {
      user: req.session.user,
      activePage,
      users: [],
      currentPage: 1,
      totalPages: 1,
      success: req.flash("success"),
      error: req.flash("error")
    });
  }
};

exports.createUser = async(req,res,activePage) =>{
   try {
    const { username, email,role, password, street, city, phone } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      req.flash('error', 'Username, email, and password are required');
      return res.redirect('/admin/users');
    }

    const fullPhone = '+20' + phone; // Egyptian country code

    // Create user using Mongoose model directly
    await UserModel.createUser({
      username,
      email,
      password,
      role,
      phone: fullPhone,
      street,
      city
    });

    req.flash('success', 'User created successfully');
    res.redirect('/admin/users');

  } catch (error) {
    console.error("Create user error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // Gets 'username' or 'email'
      req.flash('error', `${field} already exists`);
    } 
    // Handle validation errors
    else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      req.flash('error', messages.join(', '));
    }
    // Other errors
    else {
      req.flash('error', 'Failed to create user');
    }
    
    res.redirect('/admin/users');
  }
};

//3shan N3mel edit lel user
exports.editUser = async (req, res) => {
  const { id, username, email, role,street,city,phone } = req.body;
  try {
    await UserModel.editUser(id, { username, email, role,street,city,phone });
    req.flash('success', 'User edited successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', 'User Not successfully');
    res.redirect('/admin/users');
  }
};

//3shan N3mel delete lel user
exports.deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.body.id;
    const currentUserId = req.session.user.id;
    console.log("currentUserId is ");

    console.log(currentUserId);
    console.log("userIdToDelete is ");
    console.log(userIdToDelete);
    // Check if ID is provided
    if (!userIdToDelete || !mongoose.Types.ObjectId.isValid(userIdToDelete)) {
      req.flash('error', 'Invalid user ID');
      return res.redirect('/admin/users');

    }

    // Prevent deleting your own account
    if (userIdToDelete === currentUserId) {
      req.flash('error', 'You cannot delete your own account');
      
      return res.redirect('/admin/users');
    }

    // Fetch the user before deletion
    const userToDelete = await UserModel.findById(userIdToDelete);
    if (!userToDelete) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Optional: prevent deleting another admin
    if (userToDelete.role === 'admin') {
      req.flash("error", "You cannot delete another admin account.");
      return res.redirect("/admin/users");
    }

    // Perform deletion
    await UserModel.deleteUserById(userIdToDelete);
    req.flash("success", "Deleted user successfully.");
    res.redirect('/admin/users');
  } catch (error) {
    req.flash("error", "Error Deleted user.");
    res.redirect('/admin/users');
  }
};

exports.showSettings = (req, res, activePage) => {
  res.render('admin/settings', {
    user: req.session.user,
    activePage
  });
};

// Add this new function for user search
exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.json({ users: [] });
    }

    const users = await collection.User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};





