import React, { useRef, useState } from 'react';
import FontManager from './FontManager';

const Editor = () => {
  const editorRef = useRef(null);
  const [textDirection, setTextDirection] = useState('horizontal');
  const [selectedFont, setSelectedFont] = useState('');

  const exportImage = async () => {
    const editorElement = editorRef.current;
    
    // 创建临时导出容器
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    exportContainer.style.width = `${editorElement.offsetWidth}px`;
    exportContainer.style.height = `${editorElement.offsetHeight}px`;
    exportContainer.style.position = 'absolute';
    
    // 克隆编辑器内容到导出容器
    const clonedContent = editorElement.cloneNode(true);
    exportContainer.appendChild(clonedContent);
    
    // 临时添加到文档中
    document.body.appendChild(exportContainer);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          // 获取原始编辑器的边界框
          const editorRect = editorElement.getBoundingClientRect();
          
          // 确保所有文本元素位置正确
          const textElements = clonedDoc.querySelectorAll('.text-editor');
          textElements.forEach(element => {
            const originalElement = document.querySelector(`[data-text-id="${element.dataset.textId}"]`);
            if (originalElement) {
              // 获取原始元素的位置信息
              const originalRect = originalElement.getBoundingClientRect();
              
              // 计算相对位置（百分比）
              const relativeX = ((originalRect.left - editorRect.left) / editorRect.width) * 100;
              const relativeY = ((originalRect.top - editorRect.top) / editorRect.height) * 100;
              
              // 应用相对位置
              element.style.left = `${relativeX}%`;
              element.style.top = `${relativeY}%`;
              
              // 保持缩放比例
              const scale = originalElement.style.transform;
              if (scale) {
                element.style.transform = scale;
              }

              console.log('Original editor rect:', editorRect);
              console.log('Original element rect:', originalRect);
              console.log('Calculated position:', { relativeX, relativeY });
            }
          });
        }
      });
      
      return canvas.toDataURL('image/png');
    } finally {
      // 清理临时元素
      exportContainer.remove();
    }
  };

  return (
    <>
      <div className="text-toolbar">
        <div className="toolbar-group">
          <button 
            className={`direction-btn ${textDirection === 'horizontal' ? 'active' : ''}`}
            onClick={() => setTextDirection('horizontal')}
          >
            横排
          </button>
          <button 
            className={`direction-btn ${textDirection === 'vertical' ? 'active' : ''}`}
            onClick={() => setTextDirection('vertical')}
          >
            竖排
          </button>
        </div>
        
        <FontManager 
          onFontSelect={setSelectedFont} 
          selectedFont={selectedFont}
        />
      </div>

      <div 
        ref={editorRef}
        className="editor-container" 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '500px',
          aspectRatio: '1',
          overflow: 'hidden',
          touchAction: 'none',
          backgroundColor: '#fff',
          marginTop: '60px'
        }}
      >
        <div 
          className="editor-content"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
          <TextEditor
            editorRef={editorRef}
            textId={uniqueId}
            direction={textDirection}
            customFont={selectedFont}
            {...otherProps}
          />
        </div>
      </div>
    </>
  );
};

export default Editor;
