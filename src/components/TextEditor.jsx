import React, { useState } from 'react';
import '../styles/fonts.css';

const TextEditor = () => {
  const [isVertical, setIsVertical] = useState(false);
  
  return (
    <div className="text-editor">
      {/* 文字方向切换按钮 */}
      <div className="controls">
        <button 
          onClick={() => setIsVertical(!isVertical)}
          className="direction-toggle"
        >
          {isVertical ? '切换为横排' : '切换为竖排'}
        </button>
      </div>
      
      {/* 文字编辑区域 */}
      <div 
        className="text-area"
        style={{
          fontFamily: 'CustomFont',
          writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
          minHeight: '200px',
          border: '1px solid #ccc',
          padding: '10px'
        }}
        contentEditable
      >
        在这里输入文字...
      </div>
    </div>
  );
};

export default TextEditor;
