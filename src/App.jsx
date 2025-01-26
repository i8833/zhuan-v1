import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [canvasWidth, setCanvasWidth] = useState(300);
  const [canvasHeight, setCanvasHeight] = useState(300);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [customFont, setCustomFont] = useState(null);
  const [customFontName, setCustomFontName] = useState('');
  const [texts, setTexts] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(true);
  const [isScaling, setIsScaling] = useState(false);
  const [scaleStartDistance, setScaleStartDistance] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const presetFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];

  const handleCanvasWidthChange = (e) => {
    setCanvasWidth(parseInt(e.target.value, 10));
  };

  const handleCanvasHeightChange = (e) => {
    setCanvasHeight(parseInt(e.target.value, 10));
  };

  const handleBackgroundColorChange = (e) => {
    setBackgroundColor(e.target.value);
  };

  const handleFontChange = (e) => {
    setSelectedFont(e.target.value);
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, font: e.target.value } : text));
    }
  };

  const handleCustomFontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fontName = file.name.split('.')[0];
        const newStyle = document.createElement('style');
        newStyle.appendChild(document.createTextNode(`
          @font-face {
            font-family: '${fontName}';
            src: url(${event.target.result}) format('truetype');
          }
        `));
        document.head.appendChild(newStyle);

        setCustomFont(event.target.result);
        setCustomFontName(fontName);
        setSelectedFont(fontName);
        if (selectedTextIndex !== null) {
          setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, font: fontName } : text));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    const newText = {
      content: '新文本',
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      size: 30,
      color: '#000000',
      font: selectedFont,
      align: 'horizontal',
    };
    setTexts([...texts, newText]);
    setSelectedTextIndex(texts.length);
  };

  const handleTextChange = (e) => {
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, content: e.target.value } : text));
    }
  };

  const handleTextSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, size: newSize } : text));
    }
  };

  const handleTextColorChange = (e) => {
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, color: e.target.value } : text));
    }
  };

  const handleTextAlignChange = (e) => {
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, align: e.target.value } : text));
    }
  };

  const handleImageResize = (newWidth, newHeight) => {
    if (selectedImageIndex !== null) {
      setImages(
        images.map((image, i) =>
          i === selectedImageIndex
            ? {
                ...image,
                width: newWidth,
                height: newHeight,
                x: image.x - (newWidth - image.width) / 2, // 保持中心位置不变
                y: image.y - (newHeight - image.height) / 2, // 保持中心位置不变
              }
            : image
        )
      );
    }
  };

  const handleTextResize = (newSize) => {
    if (selectedTextIndex !== null) {
      setTexts(texts.map((text, i) => i === selectedTextIndex ? { ...text, size: newSize } : text));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
          const initialWidth = img.width * scale;
          const initialHeight = img.height * scale;
          const newImage = {
            src: event.target.result,
            originalWidth: img.width,
            originalHeight: img.height,
            x: canvasWidth / 2 - initialWidth / 2,
            y: canvasHeight / 2 - initialHeight / 2,
            width: initialWidth,
            height: initialHeight,
          };
          setImages([...images, newImage]);
          setSelectedImageIndex(images.length);
          setSelectedTextIndex(null); // Select image, deselect text
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasStart = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touches = e.touches;
    const x = touches ? touches[0].clientX - rect.left : e.clientX - rect.left; // 优先使用 touch，否则使用 mouse
    const y = touches ? touches[0].clientY - rect.top : e.clientY - rect.top;
    let clickedOnText = false;
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i];
      const textWidth = canvasRef.current.getContext('2d').measureText(text.content).width;
      const textHeight = text.size;

      if (
        x >= text.x - textWidth / 2 - 10 &&
        x <= text.x + textWidth / 2 + 10 &&
        y >= text.y - textHeight / 2 - 10 &&
        y <= text.y + textHeight / 2 + 10
      ) {
        setSelectedTextIndex(i);
        setSelectedImageIndex(null);
        setIsDragging(true);
        setDragStartPos({ x: x - text.x, y: y - text.y });
        clickedOnText = true;
        break;
      }
    }

    if (!clickedOnText) {
      let clickedOnImage = false;
      for (let i = images.length - 1; i >= 0; i--) {
        const image = images[i];
        if (
          x >= image.x - 10 &&
          x <= image.x + image.width + 10 &&
          y >= image.y - 10 &&
          y <= image.y + image.height + 10
        ) {
          setSelectedImageIndex(i);
          setSelectedTextIndex(null);
          setIsDragging(true);
          setDragStartPos({ x: x - image.x, y: y - image.y });
          clickedOnImage = true;
          break;
        }
      }
      if (!clickedOnImage) {
        setSelectedTextIndex(null);
        setSelectedImageIndex(null);
      }
    }

    if (touches && touches.length === 2 && selectedImageIndex !== null) {
      setIsScaling(true); // 标记开始缩放
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      setScaleStartDistance(dist);
    } else {
      setIsScaling(false);
    }
  };


  const handleCanvasMove = (e) => {
    if (isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e; // 优先使用 touch，否则使用 mouse
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (selectedTextIndex !== null) {
        setTexts(texts.map((text, i) =>
          i === selectedTextIndex
            ? { ...text, x: x - dragStartPos.x, y: y - dragStartPos.y }
            : text
        ));
      } else if (selectedImageIndex !== null) {
        setImages(images.map((image, i) =>
          i === selectedImageIndex
            ? { ...image, x: x - dragStartPos.x, y: y - dragStartPos.y }
            : image
        ));
      }
    }

    if (isScaling && e.touches && e.touches.length === 2 && selectedImageIndex !== null) {
      const touches = e.touches;
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const scaleFactor = dist / scaleStartDistance;
      const image = images[selectedImageIndex];
      const newWidth = image.originalWidth * scaleFactor;
      const newHeight = image.originalHeight * scaleFactor;
      handleImageResize(newWidth, newHeight);
    }
  };

  const handleCanvasEnd = () => {
    setIsDragging(false); // 停止拖拽
    setIsScaling(false);
  };

  const handleCanvasCancel = () => {
    setIsDragging(false);
    setIsScaling(false);
  };

  const handleDeleteText = () => {
    if (selectedTextIndex !== null) {
      const newTexts = texts.filter((_, index) => index !== selectedTextIndex);
      setTexts(newTexts);
      setSelectedTextIndex(null);
    }
  };

  const handleDeleteImage = () => {
    if (selectedImageIndex !== null) {
      const newImages = images.filter((_, index) => index !== selectedImageIndex);
      setImages(newImages);
      setSelectedImageIndex(null);
    }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    images.forEach((image) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, image.x, image.y, image.width, image.height);
      };
      img.src = image.src;
    });

    texts.forEach((text) => {
      ctx.font = `${text.size}px ${text.font}`;
      ctx.fillStyle = text.color;
      ctx.textAlign = 'center'; // 水平居中
      ctx.textBaseline = 'middle'; // 垂直居中
      ctx.fillText(text.content, text.x, text.y);
    });
  }, [canvasWidth, canvasHeight, backgroundColor, texts, images]);

  return (
    <div className="app-container">
      <div className="canvas-area">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleCanvasStart}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasEnd}
          onMouseOut={handleCanvasCancel}
          onTouchStart={handleCanvasStart}
          onTouchMove={handleCanvasMove}
          onTouchEnd={handleCanvasEnd}
          onTouchCancel={handleCanvasCancel} // 添加 touchCancel 事件处理
        />
      </div>
      <button className="toolbar-toggle" onClick={() => setShowToolbar(!showToolbar)}>
        {showToolbar ? '隐藏工具栏' : '显示工具栏'}
      </button>
      {showToolbar ? (
        <div className="toolbar">
          <div className="toolbar-section">
            <h2>画布设置</h2>
            <div className="toolbar-group">
              <label>宽度:</label>
              <input type="number" value={canvasWidth} onChange={handleCanvasWidthChange} />
              <label>高度:</label>
              <input type="number" value={canvasHeight} onChange={handleCanvasHeightChange} />
              <label>背景颜色:</label>
              <input type="color" value={backgroundColor} onChange={handleBackgroundColorChange} />
            </div>
          </div>

          <div className="toolbar-section">
            <h2>文字工具</h2>
            <div className="toolbar-group">
              <button onClick={handleAddText}>添加文字</button>
              <button onClick={handleDeleteText} disabled={selectedTextIndex === null}>
                删除选中文字
              </button>
            </div>
            {selectedTextIndex !== null ? (
              <div className="toolbar-group">
                <label>文字内容:</label>
                <input
                  type="text"
                  value={texts[selectedTextIndex].content}
                  onChange={handleTextChange}
                />
              </div>
            ) : null}
            {selectedTextIndex !== null ? (
              <div className="toolbar-group">
                <label>字体:</label>
                <select value={selectedFont} onChange={handleFontChange}>
                  {presetFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                  {customFontName && <option value={customFontName}>{customFontName} (自定义)</option>}
                </select>
                <button onClick={() => fileInputRef.current.click()}>上传自定义字体</button>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  accept=".ttf,.otf"
                  onChange={handleCustomFontUpload}
                />
              </div>
            ) : null}
            {selectedTextIndex !== null ? (
              <div className="toolbar-group">
                <label>大小:</label>
                <input
                  type="number"
                  value={texts[selectedTextIndex].size}
                  onChange={handleTextSizeChange}
                />
                <label>颜色:</label>
                <input
                  type="color"
                  value={texts[selectedTextIndex].color}
                  onChange={handleTextColorChange}
                />
                <label>对齐:</label>
                <select
                  value={texts[selectedTextIndex].align}
                  onChange={handleTextAlignChange}
                >
                  <option value="horizontal">水平</option>
                  <option value="vertical">垂直</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="toolbar-section">
            <h2>图片工具</h2>
            <div className="toolbar-group">
              <button onClick={() => imageInputRef.current.click()}>添加图片</button>
              <input
                type="file"
                style={{ display: 'none' }}
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button onClick={handleDeleteImage} disabled={selectedImageIndex === null}>
                删除选中图片
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
