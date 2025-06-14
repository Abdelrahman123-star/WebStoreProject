const bcrypt = require('bcrypt');
const collection = require("../dataBase");

class User {
  static async findByUsernameOrEmail(identifier) {
    return await collection.User.findOne({ 
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
  }

  static async createUser(userData) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    return await collection.User.create({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: userData.role || 'customer', // Default role
      street: userData.street,
      city: userData.city,
      phone: userData.phone,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  static async editUser(id, updatedData) {
    try {
      return await collection.User.updateOne(
        { _id: id },
        {
          $set: {
            username: updatedData.username,
            email: updatedData.email,
            phone: updatedData.phone,
            street: updatedData.street,
            city: updatedData.city,
            role: updatedData.role,
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    return await collection.User.findById(id);
  }

  static async deleteUserById(userId) {
    return await collection.User.deleteOne({ _id: userId });
  }

  // New methods for password reset
  static async findByEmail(email) {
    return await collection.User.findOne({ email });
  }

  static async updateResetToken(email, token, expiry) {
    try {
      const result = await collection.User.updateOne(
        { email },
        {
          $set: {
            resetPasswordToken: token,
            resetPasswordExpires: new Date(expiry)
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
      
      return result;
    } catch (error) {
      console.error('Error updating reset token:', error);
      throw error;
    }
  }

  static async findByResetToken(token) {
    try {
      return await collection.User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  static async updatePassword(userId, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    return await collection.User.updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined
        }
      }
    );
  }
}

module.exports = User;