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
    const { title, description, buttonText, gradient, imageUrl, tag, sortOrder, isActive, linkType, linkId } = req.body;
    const banner = await Banner.create({
      title, description, buttonText, gradient, imageUrl, tag, sortOrder, isActive,
      linkType: linkType || null,
      linkId: linkId || null,
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
    await banner.destroy(); // paranoid soft delete
    res.json({ message: 'Đã chuyển banner vào thùng rác' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ── PUT /api/banners/:id/restore — Admin: restore soft-deleted banner ────────
const restoreBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id, { paranoid: false });
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
    await banner.restore();
    res.json({ message: 'Đã khôi phục banner' });
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
