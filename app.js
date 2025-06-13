const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const sslConfig = require('./config/sslConfig');
require('dotenv').config();
const flash = require('connect-flash');
require('./dataBase'); // Import database connection

const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminCartRoutes = require('./routes/admin/cartRoutes');
const searchRoutes = require('./routes/searchRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'WebProject_secret_123',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://abdelrahmanZayed:AMB6v7AQX23GK3Vz@cluster0.4a9fxtq.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash middleware
app.use(flash());

// Make session data available to all views
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.session.user;
    res.locals.searchTerm = req.query.term || '';
    next();
});

// Flash messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', aiRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/products', productRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/carts', adminCartRoutes);
app.use('/', commentRoutes);
app.use('/products', productRoutes);
app.use('/myCart', cartRoutes);
app.use('/search', searchRoutes);
app.use('/order', orderRoutes);

// Catch-all route for undefined URLs
app.use((req, res, next) => {
    res.status(404).render('error', {
        message: 'Page Not Found',
        error: {
            status: 404,
            stack: 'The page you are looking for does not exist.'
        },
        user: req.session.user || null
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.session.user || null
    });
});

// Create HTTP server for redirection
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(`https://${req.headers.host}${req.url}`);
});

// Create HTTPS server
const httpsServer = https.createServer(sslConfig, app);

// Start both servers
const HTTP_PORT = 3000;  // Hardcoded for development
const HTTPS_PORT = 3443; // Hardcoded for development

console.log('Starting servers with ports:', { HTTP_PORT, HTTPS_PORT });

// Create and start HTTP server
const httpServer = http.createServer(httpApp);
httpServer.listen(HTTP_PORT, '127.0.0.1', (err) => {
  if (err) {
    console.error('Error starting HTTP server:', err);
    return;
  }
  console.log(`HTTP Server running on http://127.0.0.1:${HTTP_PORT}`);
});

// Start HTTPS server
httpsServer.listen(HTTPS_PORT, '127.0.0.1', (err) => {
  if (err) {
    console.error('Error starting HTTPS server:', err);
    return;
  }
  console.log(`HTTPS Server running on https://127.0.0.1:${HTTPS_PORT}`);
});