import React from 'react';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title = 'Xác nhận', 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  type = 'warning' 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle size={48} className="dialog-icon danger" />;
      case 'info': return <Info size={48} className="dialog-icon info" />;
      default: return <HelpCircle size={48} className="dialog-icon warning" />;
    }
  };

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog-content admin-content-fade-in">
        <button className="confirm-dialog-close" onClick={onCancel}>
          <X size={20} />
        </button>
        
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon-wrapper">
            {getIcon()}
          </div>
          <div className="confirm-dialog-text">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>

        <div className="confirm-dialog-footer">
          <button className="btn-dialog-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`btn-dialog-confirm ${type}`} 
            onClick={() => {
              onConfirm();
              onCancel(); // Close after confirm
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
