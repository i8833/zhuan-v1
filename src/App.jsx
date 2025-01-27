import React, { useState, useRef, useEffect } from 'react';
    import './App.css';

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

      // 模拟字体上传和保存
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
          ctx.font = `${scaledFontSize}px ${text.fontFamily}`;
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
        const scale = images[0] ? canvas.width / images[0].width : 1;

        // 临时画布用于处理原始尺寸和透明背景
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = images[0]?.width || canvas.width;
        tempCanvas.height = images[0]?.height || canvas.height;

        if (!exportTransparentBg) {
          // 填充背景色
          tempCtx.fillStyle = '#FFFFFF'; // 白色背景
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // 绘制原始尺寸的图片
        images.forEach((image) => {
          tempCtx.drawImage(image.imageData, 0, 0, image.width, image.height);
        });

        // 绘制文字
        texts.forEach((text) => {
          const scaledFontSize = text.fontSize;
          tempCtx.font = `${scaledFontSize}px ${text.fontFamily}`;
          tempCtx.fillStyle = text.color;
          tempCtx.fillText(
            text.content,
            text.x * scale,
            text.y * scale + scaledFontSize
          );
        });

        // 导出图片
        const dataURL = tempCanvas.toDataURL(`image/${exportFormat}`);
        const link = document.createElement('a');
        link.download = `导出图片.${exportFormat}`;
        link.href = dataURL;
        link.click();
      };

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 绘制缩放后的图片
          images.forEach((image) => {
            ctx.drawImage(
              image.imageData,
              image.x,
              image.y,
              image.scaledWidth,
              image.scaledHeight
            );
          });

          // 绘制文字
          texts.forEach((text, index) => {
            const scale = images[0] ? canvas.width / images[0].width : 1;
            const scaledFontSize = text.fontSize * scale;
            ctx.font = `${scaledFontSize}px ${text.fontFamily}`;
            ctx.fillStyle = text.color;
            ctx.fillText(text.content, text.x, text.y + scaledFontSize);

            if (index === selectedTextIndex) {
              ctx.strokeStyle = 'blue';
              ctx.strokeRect(
                text.x,
                text.y,
                ctx.measureText(text.content).width,
                scaledFontSize
              );
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
