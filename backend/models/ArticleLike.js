const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ArticleLike = sequelize.define('ArticleLike', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'articleId']
    }
  ]
});

module.exports = ArticleLike;
