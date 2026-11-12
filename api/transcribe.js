const formidable = require('formidable');
const fs = require('node:fs');
const OpenAI = require('openai');

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Chỉ hỗ trợ gửi bản ghi bằng POST.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY chưa được cấu hình trên Vercel.' });
  }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: 'Bạn đã gửi quá nhiều bản ghi. Vui lòng đợi một phút rồi thử lại.' });

  const form = formidable({
    uploadDir: '/tmp',
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: 4 * 1024 * 1024,
    filter: ({ mimetype }) => Boolean(mimetype && (mimetype.startsWith('audio/') || mimetype === 'application/octet-stream'))
  });

  try {
    const [fields, files] = await form.parse(req);
    const audio = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!audio || !audio.filepath) return res.status(400).json({ error: 'Không tìm thấy tệp âm thanh.' });
    if (!audio.mimetype || !(audio.mimetype.startsWith('audio/') || audio.mimetype === 'application/octet-stream')) {
      fs.unlink(audio.filepath, () => {});
      return res.status(415).json({ error: 'Định dạng âm thanh chưa được hỗ trợ.' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
      const transcript = await client.audio.transcriptions.create({
        file: fs.createReadStream(audio.filepath),
        model: 'gpt-transcribe',
        languages: ['vi'],
        prompt: 'Đây là tiếng Việt phổ thông do trẻ em đọc một từ hoặc cụm từ ngắn trong bài tập học tiếng Việt. Hãy chép lại đúng những gì nghe được, không tự sửa, không thêm từ.'
      });
      return res.status(200).json({ text: transcript.text || '' });
    } finally {
      fs.unlink(audio.filepath, () => {});
    }
  } catch (error) {
    console.error('Transcription error:', error?.message || error);
    const status = error?.httpCode === 413 ? 413 : 502;
    return res.status(status).json({ error: status === 413 ? 'Bản ghi quá lớn. Hãy đọc ngắn hơn.' : 'Dịch vụ chưa nhận dạng được bản ghi. Vui lòng thử lại.' });
  }
};

module.exports.config = { api: { bodyParser: false }, maxDuration: 30 };
