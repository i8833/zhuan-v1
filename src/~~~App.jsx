import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import TextEditor from './components/TextEditor';
import { localFonts } from './config/fonts';

const App = () => {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(true);
  const [exportFormat, setExportFormat] = useState('jpeg');
  const [exportTransparentBg, setExportTransparentBg] = useState(false);
  const [availableFonts, setAvailableFonts] = useState([
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
  ]);
  const [isPinching, setIsPinching] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialFontSize, setInitialFontSize] = useState(0);
  const [textDirection, setTextDirection] = useState('horizontal');

  // 添加文字方向状态
  const handleFontUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fontName = file.name.split('.')[0];
      const newFont = {
        name: fontName,
        url: e.target.result,
      };

      // 模拟保存字体到 /fonts 目录
      // 实际应用中，你需要将字体文件上传到服务器
      const updatedFonts = [...availableFonts, fontName];
      setAvailableFonts(updatedFonts);

      // 将新字体添加到页面中
      const newStyle = document.createElement('style');
      newStyle.appendChild(
        document.createTextNode(`
    @font-face {
      font-family: '${fontName}';
      src: url('${newFont.url}') format('truetype');
    }
  `)
      );
      document.head.appendChild(newStyle);

      // 更新字体选择列表
      setTexts(
        texts.map((text) => ({
          ...text,
          fontFamily: updatedFonts.includes(text.fontFamily)
            ? text.fontFamily
            : availableFonts[0],
        }))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const scale = canvas.width / img.width;
        setImages([
          {
            imageData: img,
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            scaledWidth: img.width * scale,
            scaledHeight: img.height * scale,
          },
        ]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (index, newText) => {
    setTexts(
      texts.map((text, i) =>
        i === index ? { ...text, content: newText } : text
      )
    );
  };

  const handleTextResize = (index, newSize) => {
    setTexts(
      texts.map((text, i) =>
        i === index ? { ...text, fontSize: newSize } : text
      )
    );
  };

  const handleTextDelete = (index) => {
    setTexts(texts.filter((_, i) => i !== index));
    setSelectedTextIndex(null);
  };

  const addText = () => {
    const canvas = canvasRef.current;
    setTexts([
      ...texts,
      {
        content: '新文本',
        x: canvas.width / 2,
        y: canvas.height / 2,
        fontSize: 50,
        color: '#000000',
        fontFamily: 'Arial',
        direction: 'horizontal' // 默认横排
      },
    ]);
  };

  const handleCanvasMouseDown = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    let clickedTextIndex = null;
    texts.forEach((text, index) => {
      const ctx = canvas.getContext('2d');
      const scale = images[0] ? canvas.width / images[0].width : 1;
      const scaledFontSize = text.fontSize * scale;
      
      if (text.direction === 'vertical') {
        // 竖排文字的点击检测
        const chars = text.content.split('');
        const textHeight = chars.length * scaledFontSize * 1.2; // 1.2为行距系数
        const textWidth = scaledFontSize * 1.2;
        
        if (
          x >= text.x - scaledFontSize * 0.1 &&
          x <= text.x + textWidth &&
          y >= text.y &&
          y <= text.y + textHeight
        ) {
          clickedTextIndex = index;
        }
      } else {
        // 横排文字的点击检测
        const textWidth = ctx.measureText(text.content).width;
        const textHeight = scaledFontSize;

        if (
          x >= text.x &&
          x <= text.x + textWidth &&
          y >= text.y &&
          y <= text.y + textHeight
        ) {
          clickedTextIndex = index;
        }
      }
    });

    if (clickedTextIndex !== null) {
      setSelectedTextIndex(clickedTextIndex);
      setIsDragging(true);
      setDragStartPos({
        x: x - texts[clickedTextIndex].x,
        y: y - texts[clickedTextIndex].y,
      });
    } else {
      setSelectedTextIndex(null);
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (!isDragging || selectedTextIndex === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    setTexts(
      texts.map((text, i) =>
        i === selectedTextIndex
          ? { ...text, x: x - dragStartPos.x, y: y - dragStartPos.y }
          : text
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseOut = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touches = Array.from(event.touches).map((touch) => ({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }));

    let clickedTextIndex = null;
    texts.forEach((text, index) => {
      const ctx = canvas.getContext('2d');
      const scale = images[0] ? canvas.width / images[0].width : 1;
      const scaledFontSize = text.fontSize * scale;
      ctx.font = `${scaledFontSize}px ${text.fontFamily}`;
      const textWidth = ctx.measureText(text.content).width;
      const textHeight = scaledFontSize;

      if (
        touches[0].x >= text.x &&
        touches[0].x <= text.x + textWidth &&
        touches[0].y >= text.y &&
        touches[0].y <= text.y + textHeight
      ) {
        clickedTextIndex = index;
      }
    });

    if (clickedTextIndex !== null) {
      setSelectedTextIndex(clickedTextIndex);
      if (touches.length === 1) {
        setIsDragging(true);
        setDragStartPos({
          x: touches[0].x - texts[clickedTextIndex].x,
          y: touches[0].y - texts[clickedTextIndex].y,
        });
      } else if (touches.length === 2) {
        setIsPinching(true);
        const dist = Math.hypot(
          touches[1].x - touches[0].x,
          touches[1].y - touches[0].y
        );
        setInitialPinchDistance(dist);
        setInitialFontSize(texts[clickedTextIndex].fontSize);
      }
    } else {
      setSelectedTextIndex(null);
    }
  };

  const handleTouchMove = (event) => {
    if (selectedTextIndex === null) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touches = Array.from(event.touches).map((touch) => ({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }));

    if (isDragging && touches.length === 1) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex
            ? {
                ...text,
                x: touches[0].x - dragStartPos.x,
                y: touches[0].y - dragStartPos.y,
              }
            : text
        )
      );
    } else if (isPinching && touches.length === 2) {
      const dist = Math.hypot(
        touches[1].x - touches[0].x,
        touches[1].y - touches[0].y
      );
      const scaleFactor = dist / initialPinchDistance;
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex
            ? { ...text, fontSize: initialFontSize * scaleFactor }
            : text
        )
      );
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    
    // 获取原始图片的尺寸
    const originalWidth = images[0]?.width || canvas.width;
    const originalHeight = images[0]?.height || canvas.height;
    
    // 计算缩放比例
    const displayScale = canvas.width / originalWidth;
    
    // 创建导出画布
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // 设置导出画布尺寸为原始图片尺寸
    exportCanvas.width = originalWidth;
    exportCanvas.height = originalHeight;

    // 设置背景
    if (!exportTransparentBg) {
      exportCtx.fillStyle = '#FFFFFF';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // 绘制原始图片
    if (images[0]) {
      exportCtx.drawImage(
        images[0].imageData,
        0,
        0,
        originalWidth,
        originalHeight
      );
    }

    // 绘制文字，需要将画布上的坐标和字体大小转换为原始尺寸
    texts.forEach((text) => {
      // 计算原始尺寸下的字体大小和位置
      const originalFontSize = Math.round(text.fontSize / displayScale);
      const originalX = Math.round(text.x / displayScale);
      const originalY = Math.round(text.y / displayScale);

      exportCtx.font = `${originalFontSize}px ${text.fontFamily}`;
      exportCtx.fillStyle = text.color;

      if (text.direction === 'vertical') {
        // 竖排文字处理
        const chars = text.content.split('');
        let currentY = originalY;
        
        chars.forEach((char) => {
          exportCtx.fillText(
            char,
            originalX,
            currentY + originalFontSize
          );
          // 使用与显示相同的间距比例
          currentY += originalFontSize * 1.2;
        });
      } else {
        // 横排文字处理
        exportCtx.fillText(
          text.content,
          originalX,
          originalY + originalFontSize
        );
      }
    });

    // 导出图片
    const dataURL = exportCanvas.toDataURL(`image/${exportFormat}`, 1.0);
    const link = document.createElement('a');
    link.download = `导出图片.${exportFormat}`;
    link.href = dataURL;
    link.click();
  };

  // 修改 useEffect 中加载本地字体的方法
  useEffect(() => {
    const loadFonts = () => {
      localFonts.forEach(font => {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: '${font.name}';
            src: url('${font.path}') format('truetype');
          }
        `;
        document.head.appendChild(style);
        
        // 添加到可用字体列表
        setAvailableFonts(prevFonts => 
          prevFonts.includes(font.name) 
            ? prevFonts 
            : [...prevFonts, font.name]
        );
      });
    };

    loadFonts();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制图片
      images.forEach((image) => {
        ctx.drawImage(
          image.imageData,
          image.x,
          image.y,
          image.scaledWidth,
          image.scaledHeight
        );
      });

      // 计算显示比例
      const displayScale = canvas.width / (images[0]?.width || canvas.width);

      // 绘制文字
      texts.forEach((text, index) => {
        // 使用与导出相同的字体大小计算方式
        const scaledFontSize = Math.round(text.fontSize);
        ctx.font = `${scaledFontSize}px ${text.fontFamily}`;
        ctx.fillStyle = text.color;
        
        if (text.direction === 'vertical') {
          // 竖排文字处理
          const chars = text.content.split('');
          let currentY = text.y;
          
          // 绘制选中框
          if (index === selectedTextIndex) {
            ctx.strokeStyle = 'blue';
            const totalHeight = chars.length * scaledFontSize * 1.2;
            const boxWidth = scaledFontSize * 1.2;
            
            ctx.beginPath();
            ctx.rect(
              text.x - scaledFontSize * 0.1,
              text.y,
              boxWidth,
              totalHeight
            );
            ctx.stroke();
          }
          
          // 绘制文字
          chars.forEach((char) => {
            ctx.fillText(
              char,
              text.x,
              currentY + scaledFontSize
            );
            currentY += scaledFontSize * 1.2;
          });
        } else {
          // 横排文字处理
          ctx.fillText(
            text.content,
            text.x,
            text.y + scaledFontSize
          );
          
          // 绘制选中框
          if (index === selectedTextIndex) {
            ctx.strokeStyle = 'blue';
            const textWidth = ctx.measureText(text.content).width;
            ctx.beginPath();
            ctx.rect(
              text.x,
              text.y,
              textWidth,
              scaledFontSize
            );
            ctx.stroke();
          }
        }
      });
    };

    draw();
  }, [images, texts, selectedTextIndex]);

  return (
    <div className="app-container">
      <div className="edit-area">
        <canvas
          ref={canvasRef}
          width={375}
          height={600}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseOut={handleCanvasMouseOut}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <button
        className="toolbar-toggle"
        onClick={() => setShowToolbar(!showToolbar)}
      >
        {showToolbar ? '隐藏工具栏' : '显示工具栏'}
      </button>

      {showToolbar && (
        <div className="toolbar">
          <div className="toolbar-section">
            <div className="toolbar-group">
              <label htmlFor="fontUpload">上传字体:</label>
              <input
                type="file"
                id="fontUpload"
                accept=".ttf,.otf"
                onChange={handleFontUpload}
              />
            </div>
          </div>
          <div className="toolbar-section">
            <div className="toolbar-group">
              <label htmlFor="imageUpload">上传图片:</label>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="toolbar-section">
            <div className="toolbar-group">
              <button onClick={addText}>添加文本</button>
            </div>
          </div>

          {texts.map((text, index) => (
            <div key={index} className="toolbar-section">
              <div className="toolbar-title">编辑文本 {index + 1}</div>
              <div className="toolbar-group">
                <label htmlFor={`text-content-${index}`}>内容:</label>
                <input
                  type="text"
                  id={`text-content-${index}`}
                  value={text.content}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextIndex(index);
                  }}
                />
              </div>
              
              {/* 添加文字方向切换控制 */}
              <div className="toolbar-group">
                <label>文字方向:</label>
                <select
                  value={text.direction || 'horizontal'}
                  onChange={(e) => {
                    setTexts(
                      texts.map((t, i) =>
                        i === index ? { ...t, direction: e.target.value } : t
                      )
                    );
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextIndex(index);
                  }}
                >
                  <option value="horizontal">横排</option>
                  <option value="vertical">竖排</option>
                </select>
              </div>

              <div className="toolbar-group text-controls">
                <label htmlFor={`text-size-${index}`}>大小:</label>
                <input
                  type="number"
                  id={`text-size-${index}`}
                  value={text.fontSize}
                  min="1"
                  onChange={(e) =>
                    handleTextResize(index, parseInt(e.target.value, 10))
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextIndex(index);
                  }}
                />
                <label htmlFor={`text-color-${index}`}>颜色:</label>
                <input
                  type="color"
                  id={`text-color-${index}`}
                  value={text.color}
                  onChange={(e) =>
                    setTexts(
                      texts.map((t, i) =>
                        i === index ? { ...t, color: e.target.value } : t
                      )
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextIndex(index);
                  }}
                />
                <label htmlFor={`text-font-${index}`}>字体:</label>
                <select
                  id={`text-font-${index}`}
                  value={text.fontFamily}
                  onChange={(e) =>
                    setTexts(
                      texts.map((t, i) =>
                        i === index ? { ...t, fontFamily: e.target.value } : t
                      )
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextIndex(index);
                  }}
                >
                  {availableFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="toolbar-group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextDelete(index);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}

          <div className="toolbar-section">
            <div className="toolbar-title">导出设置</div>
            <div className="toolbar-group export-controls">
              <label htmlFor="export-format">格式:</label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
              <label htmlFor="export-transparent-bg">透明背景:</label>
              <input
                type="checkbox"
                id="export-transparent-bg"
                checked={exportTransparentBg}
                onChange={(e) => setExportTransparentBg(e.target.checked)}
              />
            </div>
            <div className="toolbar-group">
              <button onClick={handleExport}>导出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
