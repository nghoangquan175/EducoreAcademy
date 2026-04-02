const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'PUBLISHED',
    allowNull: false,
    validate: {
      isIn: [['PUBLISHED', 'REJECTED']]
    }
  },
  moderationSource: {
    type: DataTypes.STRING,      // 'BLACKLIST', 'LINK_FILTER', 'AI_TOXIC', null
    allowNull: true
  },
  moderationReason: {
    type: DataTypes.STRING(500), // Detailed reason
    allowNull: true
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  heartCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  paranoid: true,
  timestamps: true
});

module.exports = Comment;
