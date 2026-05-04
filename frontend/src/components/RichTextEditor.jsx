import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !quillRef.current) {
      // Find and remove any existing toolbars in case of hot-reload or strict mode issues
      const existingToolbar = containerRef.current.parentElement.querySelector('.ql-toolbar');
      if (existingToolbar) {
        existingToolbar.remove();
      }

      quillRef.current = new Quill(containerRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Nhập nội dung bài học...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
          ]
        }
      });

      quillRef.current.on('text-change', () => {
        if (!isUpdatingRef.current) {
          const html = quillRef.current.root.innerHTML;
          onChange(html === '<p><br></p>' ? '' : html);
        }
      });
    }

    return () => {
      if (quillRef.current) {
        const toolbar = containerRef.current?.parentElement?.querySelector('.ql-toolbar');
        if (toolbar) {
          toolbar.remove();
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        quillRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (quillRef.current && value !== undefined && value !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div className="rich-text-editor-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <div ref={containerRef} style={{ minHeight: '250px', fontSize: '1.05rem' }} />
    </div>
  );
};

export default RichTextEditor;
