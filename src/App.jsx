import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
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
  const [exportTransparentBg, setExportTransparentBg] = useState(false);
  const [exportFileName, setExportFileName] = useState('画布导出');
  const [isScaling, setIsScaling] = useState(false);
  const [scaleStartDistance, setScaleStartDistance] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const presetFonts = [
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
  ];

  const handleExportTransparentBgChange = (e) => {
    setExportTransparentBg(e.target.checked);
  };

  const handleExportFileNameChange = (e) => {
    setExportFileName(e.target.value);
  };

  const handleFontChange = (e) => {
    setSelectedFont(e.target.value);
    if (selectedTextIndex !== null) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex ? { ...text, font: e.target.value } : text
        )
      );
    }
  };

  const handleCustomFontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fontName = file.name.split('.')[0];
        const newStyle = document.createElement('style');
        newStyle.appendChild(
          document.createTextNode(`
          @font-face {
            font-family: '${fontName}';
            src: url(${event.target.result}) format('truetype');
          }
        `)
        );
        document.head.appendChild(newStyle);

        setCustomFont(event.target.result);
        setCustomFontName(fontName);
        setSelectedFont(fontName);
        if (selectedTextIndex !== null) {
          setTexts(
            texts.map((text, i) =>
              i === selectedTextIndex ? { ...text, font: fontName } : text
            )
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    const newText = {
      content: '新文本',
      x: 150,
      y: 150,
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
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex
            ? { ...text, content: e.target.value }
            : text
        )
      );
    }
  };

  const handleTextSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (selectedTextIndex !== null) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex ? { ...text, size: newSize } : text
        )
      );
    }
  };

  const handleTextColorChange = (e) => {
    if (selectedTextIndex !== null) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex ? { ...text, color: e.target.value } : text
        )
      );
    }
  };

  const handleTextAlignChange = (e) => {
    if (selectedTextIndex !== null) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex ? { ...text, align: e.target.value } : text
        )
      );
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
                x: image.x - (newWidth - image.width) / 2,
                y: image.y - (newHeight - image.height) / 2,
              }
            : image
        )
      );
    }
  };

  const handleTextResize = (newSize) => {
    if (selectedTextIndex !== null) {
      setTexts(
        texts.map((text, i) =>
          i === selectedTextIndex ? { ...text, size: newSize } : text
        )
      );
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const initialWidth = img.width * scale;
          const initialHeight = img.height * scale;
          const x = canvas.width / 2 - initialWidth / 2;
          const y = canvas.height / 2 - initialHeight / 2;
          const newImage = {
            src: event.target.result,
            originalWidth: img.width,
            originalHeight: img.height,
            x,
            y,
            width: initialWidth,
            height: initialHeight,
          };
          setImages([newImage]);
          setSelectedImageIndex(0);
          setSelectedTextIndex(null);
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
    const x = touches ? touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = touches ? touches[0].clientY - rect.top : e.clientY - rect.top;
    let clickedOnText = false;

    for (let i = texts.length - 1; i >= 0; i--) {
      const text = texts[i];
      const textWidth = canvasRef.current
        .getContext('2d')
        .measureText(text.content).width;
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
      setIsScaling(true);
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
      const touch = e.touches ? e.touches[0] : e;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (selectedTextIndex !== null) {
        setTexts(
          texts.map((text, i) =>
            i === selectedTextIndex
              ? { ...text, x: x - dragStartPos.x, y: y - dragStartPos.y }
              : text
          )
        );
      } else if (selectedImageIndex !== null) {
        setImages(
          images.map((image, i) =>
            i === selectedImageIndex
              ? { ...image, x: x - dragStartPos.x, y: y - dragStartPos.y }
              : image
          )
        );
      }
    }

    if (
      isScaling &&
      e.touches &&
      e.touches.length === 2 &&
      selectedImageIndex !== null
    ) {
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
    setIsDragging(false);
    setIsScaling(false);
  };

  const handleCanvasCancel = () => {
    setIsDragging(false);
    setIsScaling(false);
  };

  const handleExportCanvas = () => {
    if (images.length === 0) {
      alert('请先上传图片');
      return;
    }

    const originalImage = images[0];
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.originalWidth;
    canvas.height = originalImage.originalHeight;
    const ctx = canvas.getContext('2d');

    const drawElements = () => {
      const img = new Image();
      img.onload = () => {
        const scaleX = canvas.width / canvasRef.current.width;
        const scaleY = canvas.height / canvasRef.current.height;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        texts.forEach((text) => {
          ctx.font = `${text.size * scaleY}px ${text.font}`;
          ctx.fillStyle = text.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            text.content,
            text.x * scaleX,
            text.y * scaleY
          );
        });

        const dataURL = canvas.toDataURL('image/png');
        downloadImage(dataURL, exportFileName);
      };
      img.onerror = () => {
        alert('图片加载失败');
      };
      img.src = originalImage.src;
    };

    if (!exportTransparentBg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawElements();
  };

  const downloadImage = (dataURL, filename) => {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteText = () => {
    if (selectedTextIndex !== null) {
      const newTexts = texts.filter(
        (_, index) => index !== selectedTextIndex
      );
      setTexts(newTexts);
      setSelectedTextIndex(null);
    }
  };

  const handleDeleteImage = () => {
    if (selectedImageIndex !== null) {
      const newImages = images.filter(
        (_, index) => index !== selectedImageIndex
      );
      setImages(newImages);
      setSelectedImageIndex(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    images.forEach((image) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, image.x, image.y, image.width, image.height);
        texts.forEach((text) => {
          ctx.font = `${text.size}px ${text.font}`;
          ctx.fillStyle = text.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text.content, text.x, text.y);
        });
      };
      img.src = image.src;
    });
  }, [texts, images]);

  return (
    <div className="app-container">
      <div className="edit-area">
        <canvas
          ref={canvasRef}
          width={375}
          height={600}
          onMouseDown={handleCanvasStart}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasEnd}
          onMouseOut={handleCanvasCancel}
          onTouchStart={handleCanvasStart}
          onTouchMove={handleCanvasMove}
          onTouchEnd={handleCanvasEnd}
          onTouchCancel={handleCanvasCancel}
        />
      </div>
      <button
        className="toolbar-toggle"
        onClick={() => setShowToolbar(!showToolbar)}
      >
        {showToolbar ? '隐藏工具栏' : '显示工具栏'}
      </button>
      {showToolbar ? (
        <div className="toolbar">
          <div className="toolbar-section">
            <h2 className="toolbar-title">图片工具</h2>
            <div className="toolbar-group">
              <button onClick={() => imageInputRef.current.click()}>
                添加图片
              </button>
              <input
                type="file"
                style={{ display: 'none' }}
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button
                onClick={handleDeleteImage}
                disabled={selectedImageIndex === null}
              >
                删除选中图片
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <h2 className="toolbar-title">文字工具</h2>
            <div className="toolbar-group">
              <button onClick={handleAddText}>添加文字</button>
              <button
                onClick={handleDeleteText}
                disabled={selectedTextIndex === null}
              >
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
                  {customFontName && (
                    <option value={customFontName}>{customFontName} (自定义)</option>
                  )}
                </select>
                <button onClick={() => fileInputRef.current.click()}>
                  上传自定义字体
                </button>
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
            <h2 className="toolbar-title">导出设置</h2>
            <div className="toolbar-group">
              <label>文件名:</label>
              <input
                type="text"
                value={exportFileName}
                onChange={handleExportFileNameChange}
              />
            </div>
            <div className="toolbar-group">
              <label>
                <input
                  type="checkbox"
                  checked={exportTransparentBg}
                  onChange={handleExportTransparentBgChange}
                />
                透明背景
              </label>
              <button onClick={handleExportCanvas}>导出画布</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
