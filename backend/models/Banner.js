const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  buttonText: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Khám phá ngay',
  },
  gradient: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  tag: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = Banner;
