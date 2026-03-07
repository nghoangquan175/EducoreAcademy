const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Course;
