const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('auth/login');
};

exports.handleLogin = async (req, res) => {
  try {
    const user = await User.findByUsernameOrEmail(req.body.UsernameOrEmail);

    if (!user) {
      return res.render('auth/login', { 
        error: 'Invalid username or password!',
        username: req.body.username
      });
    }

    const isPasswordMatch = await User.verifyPassword(user, req.body.password);

    if (isPasswordMatch) {
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role // Store role in session
      };

      // Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/');
      }
      
    } else {
      return res.render('auth/login', { 
        error: 'Invalid username or password!',
        username: req.body.username
      });
    }
  } catch(error) {
    console.error("Login error:", error);
    return res.status(500).send("Login failed");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect('/');
    }
    res.redirect('/');
  });
};

exports.showSignup = (req, res) => {
  res.render('auth/signup');
};

exports.handleSignup = async (req, res) => {
  try {
    const existingUser = await User.findByUsernameOrEmail(req.body.username);
    const existingEmail = await User.findByUsernameOrEmail(req.body.email);

    if (existingUser) {
      return res.render('auth/signup', { 
        error: 'Username already exists. Please choose a different username!',
        username: req.body.username
      });
    }

    if (existingEmail) {
      return res.render('auth/signup', { 
        error: 'Email already exists. Please choose a different Email!',
        username: req.body.email
      });
    }

    await User.createUser(req.body);
    res.redirect('/login');
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send("Signup failed");
  }
};