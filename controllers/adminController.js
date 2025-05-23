const mongoose = require('mongoose');
const User = require('../database');
const UserModel = require('../models/User'); // Adjust path if needed




exports.showDashboard = (req, res, activePage) => {
  res.render('admin/dashboard', {
    user: req.session.user,
    activePage
  });
};

exports.showProducts = (req, res, activePage) => {
  res.render('admin/products', {
    user: req.session.user,
    activePage
  });
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
    const users = await User.find(); // Fetch all users
    res.render('admin/users', {
      user: req.session.user,
      activePage,
      users,
      success: req.flash("success"),
      error: req.flash("error")
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
};

//3shan N3mel edit lel user
exports.editUser = async (req, res) => {
  const { id, username, email, role } = req.body;
  try {
    await UserModel.editUser(id, { username, email, role });
    res.redirect('/admin/users');
  } catch (error) {
    console.error("Failed to edit user:", error);
    res.status(500).send("Internal Server Error");
  }
};

//3shan N3mel delete lel user
exports.deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.body.id;
    const currentUserId = req.session.user._id;

    // Check if ID is provided
    if (!userIdToDelete || !mongoose.Types.ObjectId.isValid(userIdToDelete)) {
      return res.status(400).send("Invalid user ID.");
    }

    // Prevent deleting your own account
    if (userIdToDelete === currentUserId) {
      return res.status(403).send("You cannot delete your own account.");
    }

    // Fetch the user before deletion
    const userToDelete = await UserModel.findById(userIdToDelete);
    if (!userToDelete) {
      return res.status(404).send("User not found.");
    }

    // Optional: prevent deleting another admin
    if (userToDelete.role === 'admin') {
      req.flash("error", "You cannot delete your own account.");
      return res.redirect("/admin/users");
    }

    // Perform deletion
    await UserModel.deleteUserById(userIdToDelete);
    res.redirect('/admin/users');
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Server Error");
  }
};



exports.showSettings = (req, res, activePage) => {
  res.render('admin/settings', {
    user: req.session.user,
    activePage
  });
};