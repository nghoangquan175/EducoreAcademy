/**
 * Xáo trộn một mảng sử dụng thuật toán Fisher-Yates.
 * @param {Array} array - Mảng cần xáo trộn.
 * @returns {Array} - Mảng mới đã được xáo trộn.
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

module.exports = {
  shuffleArray
};
