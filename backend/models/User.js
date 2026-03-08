const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // nullable for social login users
  },
  role: {
    type: DataTypes.ENUM('student', 'instructor', 'admin'),
    defaultValue: 'student'
  },
  // Social login fields
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  facebookId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook'),
    defaultValue: 'local'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  hooks: {
    beforeSave: async (user, options) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
