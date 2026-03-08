const { Banner } = require('../models');

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

// ── POST /api/banners — Admin: create a new banner ───────────────────────────
const createBanner = async (req, res) => {
  try {
    const { title, description, buttonText, gradient, imageUrl, tag, sortOrder, isActive } = req.body;
    const banner = await Banner.create({ title, description, buttonText, gradient, imageUrl, tag, sortOrder, isActive });
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

// ── DELETE /api/banners/:id — Admin: delete a banner ─────────────────────────
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
    await banner.destroy();
    res.json({ message: 'Đã xoá banner' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = { getBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
