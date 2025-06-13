exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  
  // For API requests, send JSON response
  if (req.xhr || req.headers.accept.includes('application/json')) {
    return res.status(401).json({
      error: 'Please login to continue',
      redirect: '/login'
    });
  }
  
  // For regular requests, redirect to login
  res.redirect('/login');
};

exports.ensureAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin') {
    return next();
  }
  
  // For API requests, send JSON response
  if (req.xhr || req.headers.accept.includes('application/json')) {
    return res.status(403).json({
      error: 'Admin access required',
      redirect: '/login'
    });
  }
  
  // For regular requests, redirect to login
  res.redirect('/login');
};