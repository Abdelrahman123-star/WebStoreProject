const bcrypt = require('bcrypt');
const collection = require("../dataBase");

class User {
  static async findByUsernameOrEmail(identifier) {
    return await collection.findOne({ 
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
  }

  static async createUser(userData) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    return await collection.create({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: 'customer' // Yb2a dyman customer

    });
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }




  static async editUser(id, updatedData) {
    try {
      return await collection.updateOne(
        { _id: id },
        {
          $set: {
            username: updatedData.username,
            email: updatedData.email,
            role: updatedData.role
          }
        }
      );
    } catch (error) {
      throw error;
    }
  }
  static async findById(id) {
    return await collection.findById(id);
  }
  static async deleteUserById(userId) {
    return await collection.deleteOne({ _id: userId });
  }




}

module.exports = User;