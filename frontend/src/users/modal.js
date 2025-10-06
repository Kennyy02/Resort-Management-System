import React from "react";
import "./styles/modal.css";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <h1>{title}</h1>
        </div>

        {/* Content */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
