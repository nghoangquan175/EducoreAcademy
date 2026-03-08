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
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  indexes: [
    {
      fields: ['title']
    }
  ]
});

module.exports = Article;
