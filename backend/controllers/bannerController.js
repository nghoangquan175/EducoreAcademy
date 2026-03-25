const { Banner } = require('../models');
const { Op } = require('sequelize');

// ── GET /api/banners — Public: list active banners ordered by sortOrder ─────
const getBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── GET /api/banners/all — Admin: list all banners (active + inactive) ───────
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({ order: [['sortOrder', 'ASC']] });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── GET /api/banners/trash — Admin: list soft-deleted banners ────────────────
const getTrashBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false,
      order: [['deletedAt', 'DESC']],
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── POST /api/banners — Admin: create a new banner ───────────────────────────
const createBanner = async (req, res) => {
  try {
    const { sortOrder, ...rest } = req.body;
    
    // Đẩy các banner khác (có số >= mới) tăng thêm 1 đơn vị
    if (sortOrder) {
      await Banner.increment('sortOrder', {
        where: { sortOrder: { [Op.gte]: sortOrder } },
        by: 1
      });
    }

    const banner = await Banner.create({
      ...rest,
      sortOrder,
      linkType: rest.linkType || null,
      linkId: rest.linkId || null,
    });
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── PUT /api/banners/:id — Admin: update a banner ────────────────────────────
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
    
    const oldOrder = banner.sortOrder;
    const newOrder = req.body.sortOrder;

    // Logic đổi chỗ thông minh (Shift)
    if (newOrder && newOrder !== oldOrder) {
      if (newOrder < oldOrder) {
        // Đẩy xuống: ví dụ 3 -> 1, thì 1, 2 sẽ tăng lên 2, 3
        await Banner.increment('sortOrder', {
          where: { sortOrder: { [Op.between]: [newOrder, oldOrder - 1] } },
          by: 1
        });
      } else {
        // Đẩy lên: ví dụ 1 -> 3, thì 2, 3 sẽ giảm xuống 1, 2
        await Banner.decrement('sortOrder', {
          where: { sortOrder: { [Op.between]: [oldOrder + 1, newOrder] } },
          by: 1
        });
      }
    }

    await banner.update(req.body);
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── DELETE /api/banners/:id — Admin: soft delete a banner ────────────────────
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
    
    const deletedOrder = banner.sortOrder;
    
    // Soft delete
    await banner.destroy();

    // Đẩy các banner phía sau lên (giảm sortOrder đi 1)
    await Banner.decrement('sortOrder', {
      where: { sortOrder: { [Op.gt]: deletedOrder } },
      by: 1
    });

    res.json({ message: 'Đã chuyển banner vào thùng rác và sắp xếp lại thứ tự' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── PUT /api/banners/:id/restore — Admin: restore soft-deleted banner ────────
const restoreBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id, { paranoid: false });
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });

    // Trước khi khôi phục, dọn chỗ cho nó (tương tự Logic Create)
    await Banner.increment('sortOrder', {
      where: { sortOrder: { [Op.gte]: banner.sortOrder } },
      by: 1
    });

    await banner.restore();
    res.json({ message: 'Đã khôi phục banner và sắp xếp lại vị trí' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── DELETE /api/banners/:id/force — Admin: permanently delete banner ─────────
const forceDeleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id, { paranoid: false });
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
    await banner.destroy({ force: true });
    res.json({ message: 'Đã xóa vĩnh viễn banner' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = {
  getBanners,
  getAllBanners,
  getTrashBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  restoreBanner,
  forceDeleteBanner,
};
