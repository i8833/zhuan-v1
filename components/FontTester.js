import React, { useState } from 'react';

const FontTester = ({ font }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const loadFont = async () => {
      try {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        await fontFace.load();
        document.fonts.add(fontFace);
        setIsLoaded(true);
      } catch (err) {
        setError(err.message);
      }
    };

    loadFont();
  }, [font]);

  return (
    <div className="font-test">
      {isLoaded ? (
        <p style={{ fontFamily: font.name }}>
          测试文字 ABC 123
        </p>
      ) : error ? (
        <p className="error">字体加载失败: {error}</p>
      ) : (
        <p>加载中...</p>
      )}
    </div>
  );
};

export default FontTester;
