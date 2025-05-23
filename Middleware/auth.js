exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

exports.ensureAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin') {
    return next();
  }
  res.redirect('/login');
};