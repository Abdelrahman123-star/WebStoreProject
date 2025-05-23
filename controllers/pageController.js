exports.showHome = (req, res) => {
  res.render('pages/home');
};

exports.showAdmin = (req, res) => {
  res.render('admin/dashboard');
};

exports.showContact = (req, res) => {
  res.render('pages/contact');
};

exports.showAbout = (req, res) => {
  res.render('pages/about');
};

exports.showCategory = (req, res) => {
  res.render('products/category');
};
exports.showCart = (req, res) => {
    res.render('cart/view');
};