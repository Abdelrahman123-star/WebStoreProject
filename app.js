const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();
const flash = require('connect-flash');


const authRoutes = require('./routes/authRoutes');
const pageRoutes = require('./routes/pageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');


const app = express();
const port = 3000;

const { OpenAI } = require('openai');




app.use(express.json()); 
app.use(express.urlencoded({ extended:false }));
app.use(session({
  secret: 'WebProject_secret_123',
  resave: false,
  saveUninitialized: true
}));

// Flash middleware
app.use(flash());

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

//View engine setup

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/', aiRoutes);
app.use('/admin', adminRoutes);


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});