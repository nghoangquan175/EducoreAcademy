const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true // nullable for guest users
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true // for guest users without login
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true // auto-generated from first message
  }
}, {
  timestamps: true
});

module.exports = Conversation;
