import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// 允许的字体格式
const ALLOWED_FORMATS = ['.ttf', '.otf', '.woff', '.woff2'];
// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({
    maxFileSize: MAX_FILE_SIZE,
    uploadDir: path.join(process.cwd(), 'public/fonts'),
    keepExtensions: true,
  });

  try {
    // 确保上传目录存在
    if (!fs.existsSync(form.uploadDir)) {
      fs.mkdirSync(form.uploadDir, { recursive: true });
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const font = files.font;
    
    // 验证文件格式
    const ext = path.extname(font.originalFilename).toLowerCase();
    if (!ALLOWED_FORMATS.includes(ext)) {
      fs.unlinkSync(font.filepath);
      return res.status(400).json({ 
        message: '不支持的字体格式。请上传 TTF、OTF、WOFF 或 WOFF2 格式的字体文件。' 
      });
    }

    // 生成安全的文件名
    const safeName = `${Date.now()}-${path.parse(font.originalFilename).name}${ext}`
      .replace(/[^a-zA-Z0-9-_.]/g, '');
    const newPath = path.join(form.uploadDir, safeName);

    // 移动文件到最终位置
    await fs.promises.rename(font.filepath, newPath);

    // 返回字体信息
    return res.status(200).json({
      id: path.parse(safeName).name,
      name: path.parse(font.originalFilename).name,
      url: `/fonts/${safeName}`,
      format: ext.slice(1)
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: '上传失败，请重试' });
  }
}
