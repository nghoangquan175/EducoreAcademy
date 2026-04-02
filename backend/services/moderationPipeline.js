const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load badwords and whitelist
const dataPath = path.join(__dirname, '../data/badwords.json');
let badwordsData = { badwords: [], linkWhitelist: [] };
try {
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(fileContent);
  badwordsData.badwords = (data.badwords || []).map(word =>
    word.normalize('NFC').toLowerCase()
  );
  badwordsData.linkWhitelist = data.linkWhitelist || [];
} catch (error) {
  console.error('Error loading badwords.json:', error);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function checkRegex(text) {
  const content = text.normalize('NFC').toLowerCase();

  // 1. Check Bad Words
  for (const word of badwordsData.badwords) {
    // Using Unicode property escapes for better word boundary handling
    // This correctly identifies boundaries for Vietnamese diacritics
    const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${word}(?=$|[^\\p{L}\\p{N}])`, 'gu');
    if (regex.test(content)) {
      return {
        isToxic: true,
        source: 'BLACKLIST',
        reason: `Chứa từ ngữ không phù hợp: "${word}"`
      };
    }
  }

  // 2. Check Links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);
  if (urls) {
    for (const url of urls) {
      const domain = new URL(url).hostname.replace('www.', '');
      const isWhitelisted = badwordsData.linkWhitelist.some(white => domain === white || domain.endsWith('.' + white));

      if (!isWhitelisted) {
        return {
          isToxic: true,
          source: 'LINK_FILTER',
          reason: `Chứa liên kết lạ không được phép: ${domain}`
        };
      }
    }
  }

  return { isToxic: false };
}

/**
 * Layer 2: Gemini AI Content Analysis (Deep)
 */
async function checkAI(text) {
  try {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Bạn là một chuyên gia kiểm duyệt nội dung cộng đồng. 
      Hãy phân tích bình luận dưới đây và xác định xem nó có vi phạm quy chuẩn (xúc phạm, thù ghét, gây hấn, thô tục, hoặc spam quảng cáo) hay không.
      
      Quy tắc:
      - Trả về kết quả dưới dạng JSON duy nhất với cấu trúc: { "isToxic": boolean, "reason": "string (giải thích ngắn gọn bằng tiếng Việt)" }
      - Nếu nội dung an toàn, isToxic là false.
      - Nếu nội dung vi phạm, isToxic là true và nêu rõ lý do.
      
      Nội dung bình luận: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean JSON response (sometimes Gemini adds markdown blocks)
    const jsonStr = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Gemini Moderation Error:', error);
    // Silent fail for AI - if AI fails, we default to safe or log only
    return { isToxic: false, error: 'AI_UNAVAILABLE' };
  }
}

/**
 * Main Pipeline
 */
async function runModerationPipeline(text) {
  // 1. Sanity check
  if (!text || text.trim().length === 0) {
    return { isToxic: false };
  }

  // 2. Tầng 1: Regex
  const regexResult = checkRegex(text);
  if (regexResult.isToxic) {
    return regexResult;
  }

  // 3. Tầng 2: Gemini
  const aiResult = await checkAI(text);
  if (aiResult.isToxic) {
    return {
      isToxic: true,
      source: 'AI_TOXIC',
      reason: aiResult.reason
    };
  }

  return { isToxic: false };
}

module.exports = {
  runModerationPipeline
};
