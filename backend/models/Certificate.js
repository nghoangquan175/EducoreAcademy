const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Courses', key: 'id' }
  },
  pdfUrl: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  cloudinaryPublicId: {
    type: DataTypes.STRING(256),
    allowNull: false,
  },
  certificateCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  studentNameSnap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  courseTitleSnap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['courseId'] },
    { fields: ['certificateCode'] },
  ],
});

module.exports = Certificate;
