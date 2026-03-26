const { Notification, User } = require('../models');

/**
 * Sends a notification to all users with role 'admin'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
const notifyAdmins = async (title, message, relatedId = null, type = null) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin' } });
    
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        userId: admin.id,
        title,
        message,
        relatedId: relatedId ? relatedId.toString() : null,
        type,
        isRead: false
      }));
      
      await Notification.bulkCreate(notifications);
      console.log(`Sent notifications to ${admins.length} admins.`);
    }
  } catch (error) {
    console.error('Error in notifyAdmins:', error.message);
  }
};

module.exports = { notifyAdmins };
