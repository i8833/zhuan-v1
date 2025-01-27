import React, { useState, useRef } from 'react';

const TextEditor = ({ 
  text, 
  position, 
  onPositionChange, 
  onTextChange, 
  editorRef, 
  textId,
  direction = 'horizontal',
  customFont = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const textRef = useRef(null);

  // 计算相对于编辑器容器的位置
  const calculateRelativePosition = (clientX, clientY) => {
    if (!editorRef.current) return { x: 0, y: 0 };
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const textRect = textRef.current.getBoundingClientRect();
    
    // 计算文本中心点相对于编辑器的位置
    const centerX = clientX - (textRect.width / 2);
    const centerY = clientY - (textRect.height / 2);
    
    // 转换为百分比位置
    const percentX = ((centerX - editorRect.left) / editorRect.width) * 100;
    const percentY = ((centerY - editorRect.top) / editorRect.height) * 100;
    
    // 确保位置在编辑器范围内
    return {
      x: Math.max(0, Math.min(100, percentX)),
      y: Math.max(0, Math.min(100, percentY))
    };
  };

  // 添加触摸事件处理
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // 防止页面滚动
    
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const newPosition = calculateRelativePosition(touch.clientX, touch.clientY);
      
      onPositionChange({
        x: `${newPosition.x}%`,
        y: `${newPosition.y}%`
      });
    }
    
    // 处理双指缩放
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // 根据手指距离计算新的缩放比例
      const newScale = Math.max(0.5, Math.min(2, distance / 100));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 根据方向生成文字样式
  const getTextStyle = () => {
    const baseStyle = {
      whiteSpace: 'nowrap',
      transformOrigin: 'center center',
      fontFamily: customFont || 'inherit'
    };

    if (direction === 'vertical') {
      return {
        ...baseStyle,
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        letterSpacing: '0.1em'
      };
    }

    return baseStyle;
  };

  return (
    <div
      ref={textRef}
      className="text-editor"
      data-text-id={textId}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: `scale(${scale})`,
        touchAction: 'none',
        transformOrigin: 'center center',
        cursor: 'move',
        padding: '5px',
        maxWidth: '90%',
        willChange: 'transform'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="text-content"
        style={getTextStyle()}
      >
        {text}
      </div>
    </div>
  );
};

export default TextEditor;
