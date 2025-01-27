import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const fontsDir = path.join(process.cwd(), 'public/fonts');
    
    // 确保目录存在
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }

    // 读取字体文件列表
    const files = fs.readdirSync(fontsDir);
    
    // 过滤并格式化字体信息
    const fonts = files
      .filter(file => /\.(ttf|otf|woff|woff2)$/i.test(file))
      .map(file => ({
        id: path.parse(file).name,
        name: path.parse(file).name,
        url: `/fonts/${file}`,
        format: path.extname(file).slice(1)
      }));

    return res.status(200).json(fonts);
  } catch (error) {
    console.error('Error reading fonts:', error);
    return res.status(500).json({ message: 'Failed to load fonts' });
  }
}
