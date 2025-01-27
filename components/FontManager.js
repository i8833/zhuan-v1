import React, { useState, useEffect } from 'react';

const FontManager = ({ onFontSelect, selectedFont }) => {
  const [customFonts, setCustomFonts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // 加载已保存的字体
  useEffect(() => {
    fetchSavedFonts();
  }, []);

  // 获取保存的字体列表
  const fetchSavedFonts = async () => {
    try {
      const response = await fetch('/api/fonts');
      const fonts = await response.json();
      setCustomFonts(fonts);
    } catch (error) {
      setError('加载字体失败');
      console.error('Failed to load fonts:', error);
    }
  };

  // 处理字体文件上传
  const handleFontUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('开始上传字体:', file.name);

    try {
      setIsUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('font', file);

      console.log('正在发送请求...');

      const response = await fetch('/api/fonts/upload', {
        method: 'POST',
        body: formData
      });

      console.log('服务器响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('上传失败:', errorText);
        throw new Error(errorText);
      }

      const newFont = await response.json();
      console.log('上传成功:', newFont);

      setCustomFonts(prev => [...prev, newFont]);
      
      // 创建并加载字体
      const fontFace = new FontFace(newFont.name, `url(${newFont.url})`);
      await fontFace.load();
      document.fonts.add(fontFace);
      
      onFontSelect(newFont.name);
    } catch (error) {
      console.error('详细错误信息:', error);
      setError('上传失败：' + error.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="font-manager">
      <div className="font-upload">
        <label htmlFor="font-upload">
          {isUploading ? '上传中...' : '上传字体'}
        </label>
        <input
          id="font-upload"
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFontUpload}
          disabled={isUploading}
        />
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <div className="font-list">
        <button
          className={!selectedFont ? 'active' : ''}
          onClick={() => onFontSelect('')}
        >
          默认字体
        </button>
        {customFonts.map((font) => (
          <button
            key={font.id}
            className={selectedFont === font.name ? 'active' : ''}
            onClick={() => onFontSelect(font.name)}
            style={{ fontFamily: font.name }}
          >
            {font.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontManager;
