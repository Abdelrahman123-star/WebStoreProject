const mongoose = require('mongoose');

const db = 'mongodb+srv://abdelrahmanZayed:AMB6v7AQX23GK3Vz@cluster0.4a9fxtq.mongodb.net/Login?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to MongoDB Users Database");
})
.catch((err) => {
    console.error("MongoDB Connection Failed:", err);
});

const LoginSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.Users || mongoose.model("Users", LoginSchema);
const Product = require('./models/Product');

module.exports = { User, Product };
