const mongoose = require('mongoose');

const db = 'mongodb+srv://abdelrahmanZayed:AMB6v7AQX23GK3Vz@cluster0.4a9fxtq.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(db)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(() => {
    console.log("MongoDB Connection Failed");
  });

const LoginSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
});

const User = mongoose.models.Users || mongoose.model("Users", LoginSchema);

module.exports = User;
