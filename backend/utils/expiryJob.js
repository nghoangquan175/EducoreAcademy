const { Course, CourseEditRequest } = require('../models');
const { Op } = require('sequelize');

/**
 * Checks for inactive course drafts and marks them as expired.
 * Run this periodically (e.g., daily).
 */
async function checkInactivity() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // 1. Find all draft versions (published = 0) that haven't been updated in 7 days
    const inactiveDrafts = await Course.findAll({
      where: {
        published: 0,
        rootCourseId: { [Op.ne]: null },
        updatedAt: { [Op.lt]: sevenDaysAgo }
      }
    });

    for (const draft of inactiveDrafts) {
      console.log(`Draft ${draft.id} (ROOT: ${draft.rootCourseId}) is inactive. Marking as expired.`);
      
      // Update associated edit request
      await CourseEditRequest.update(
        { status: 'expired' },
        { where: { courseId: draft.rootCourseId, status: 'approved' } }
      );

      // We don't delete yet, just let the instructor know it's expired in the UI
      // The instructor dashboard logic will pick up the 'expired' status from CourseEditRequest
    }

  } catch (error) {
    console.error('Error checking inactivity:', error);
  }
}

module.exports = { checkInactivity };
