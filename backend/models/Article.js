const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  articleStatus: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0: Draft, 1: Pending, 2: Approved, 3: Rejected'
  }
}, {
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      fields: ['title']
    }
  ]
});

module.exports = Article;
