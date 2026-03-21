const { Category, Course, Article } = require('../models');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }
    const category = await Category.create({ name: name.trim() });
    res.status(201).json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Danh mục này đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    const oldName = category.name;
    const newName = name.trim();

    if (oldName !== newName) {
      // Update Category name
      category.name = newName;
      await category.save();

      // Cascade update to Courses and Articles holding this string
      await Course.update({ category: newName }, { where: { category: oldName }});
      await Article.update({ category: newName }, { where: { category: oldName }});
    }

    res.json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Danh mục này đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    // Check if any courses or articles are using it to block deletion
    const courseCount = await Course.count({ where: { category: category.name } });
    const articleCount = await Article.count({ where: { category: category.name } });

    if (courseCount > 0 || articleCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa vì danh mục này đang chứa ${courseCount} khóa học và ${articleCount} bài viết` 
      });
    }

    await category.destroy();
    res.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
