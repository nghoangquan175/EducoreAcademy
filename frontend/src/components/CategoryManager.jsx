import React, { useState, useEffect } from 'react';
import { 
  fetchAllCategoriesAPI, 
  createCategoryAPI, 
  updateCategoryAPI, 
  deleteCategoryAPI 
} from '../services/categoryService';
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryManager = ({ setConfirmDialog }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCategoriesAPI();
      setCategories(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategoryAPI(newCategoryName);
      toast.success('Đã thêm danh mục mới');
      setNewCategoryName('');
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm danh mục');
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      await updateCategoryAPI(id, editName);
      toast.success('Đã cập nhật tên danh mục');
      setEditingId(null);
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật danh mục');
    }
  };

  const handleDelete = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa danh mục',
      message: `Bạn có chắc chắn muốn xóa danh mục "${name}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteCategoryAPI(id);
          toast.success('Đã xóa danh mục');
          loadCategories();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Lỗi khi xóa danh mục');
        }
      }
    });
  };

  if (loading) return <div className="loading-container">Đang tải danh mục...</div>;

  return (
    <div className="admin-content-fade-in category-manager">
      <div className="section-header">
        <h2 className="content-title">Quản lý danh mục</h2>
      </div>
      <p className="section-desc">
        Danh sách các chủ đề/danh mục dùng trong Khóa học và Bài viết.
      </p>

      <div className="category-form-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px', maxWidth: '500px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Thêm danh mục mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Nhập tên danh mục..." 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <button type="submit" className="admin-btn approve" style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Plus size={18} /> Thêm
          </button>
        </form>
      </div>

      <div className="table-container" style={{ maxWidth: '800px' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Tên danh mục</th>
              <th style={{ width: '150px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? categories.map(cat => (
              <tr key={cat.id}>
                <td>#{cat.id}</td>
                <td>
                  {editingId === cat.id ? (
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #4f46e5' }}
                      autoFocus
                    />
                  ) : (
                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                  )}
                </td>
                <td>
                  <div className="admin-actions">
                    {editingId === cat.id ? (
                      <>
                        <button className="admin-btn approve" onClick={() => handleUpdate(cat.id)} title="Lưu">
                          <Save size={18} />
                        </button>
                        <button className="admin-btn reject" onClick={() => setEditingId(null)} title="Hủy">
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="admin-btn view" 
                          onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} 
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button className="admin-btn reject" onClick={() => handleDelete(cat.id, cat.name)} title="Xóa">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="3" className="empty-table-cell">Chưa có danh mục nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManager;
