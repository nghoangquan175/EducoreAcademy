const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Op } = require('sequelize');
const { Conversation, Message, Course, Article, Category } = require('../models');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là trợ lý AI của EducoreAcademy — nền tảng học trực tuyến.
Nhiệm vụ: tư vấn khóa học, giải đáp thắc mắc, hỗ trợ học viên.
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện.
Nếu được cung cấp thông tin khóa học/bài viết, hãy sử dụng để trả lời chính xác.
Nếu không biết, hãy nói rằng bạn không có thông tin và đề nghị liên hệ hỗ trợ.`;

// ── Helper: Extract keywords from message ──
function extractKeywords(message) {
  const stopWords = ['là', 'của', 'và', 'có', 'cho', 'với', 'trong', 'được', 'này', 'đó', 'một', 'các', 'những', 'để', 'từ', 'theo', 'về', 'hay', 'hoặc', 'không', 'tôi', 'mình', 'bạn', 'muốn', 'cần', 'hỏi', 'xin', 'ơi', 'nhé', 'nha', 'ạ', 'vậy', 'thì', 'mà', 'nào', 'gì', 'sao', 'thế'];
  const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));
  return words.slice(0, 5);
}

// ── Helper: Get relevant context from DB (RAG) ──
async function getRelevantContext(message) {
  const keywords = extractKeywords(message);
  if (keywords.length === 0) return '';

  try {
    // Search courses
    const courses = await Course.findAll({
      where: {
        published: 2,
        [Op.or]: [
          ...keywords.map(kw => ({ title: { [Op.like]: `%${kw}%` } })),
          ...keywords.map(kw => ({ description: { [Op.like]: `%${kw}%` } })),
        ]
      },
      attributes: ['id', 'title', 'description', 'price', 'category', 'level', 'rating', 'isPro'],
      limit: 3,
      order: [['rating', 'DESC']]
    });

    // Search articles
    const articles = await Article.findAll({
      where: {
        articleStatus: 2,
        [Op.or]: [
          ...keywords.map(kw => ({ title: { [Op.like]: `%${kw}%` } })),
          ...keywords.map(kw => ({ content: { [Op.like]: `%${kw}%` } })),
        ]
      },
      attributes: ['id', 'title', 'excerpt', 'category'],
      limit: 3
    });

    // Get all categories
    const categories = await Category.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']]
    });

    let context = '';

    if (courses.length > 0) {
      context += 'Các khóa học liên quan:\n';
      courses.forEach(c => {
        context += `- "${c.title}" (${c.isPro ? 'Pro' : 'Miễn phí'}, ${c.category || 'Chưa phân loại'}, ${c.level}, Rating: ${c.rating})\n`;
        if (c.description) context += `  Mô tả: ${c.description.substring(0, 150)}...\n`;
      });
    }

    if (articles.length > 0) {
      context += '\nCác bài viết liên quan:\n';
      articles.forEach(a => {
        context += `- "${a.title}" (${a.category || 'Chưa phân loại'})\n`;
        if (a.excerpt) context += `  Tóm tắt: ${a.excerpt.substring(0, 150)}...\n`;
      });
    }

    if (categories.length > 0) {
      context += `\nDanh mục trên hệ thống: ${categories.map(c => c.name).join(', ')}\n`;
    }

    return context;
  } catch (error) {
    console.error('RAG context error:', error);
    return '';
  }
}

// ── POST /api/chat/send ──
exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      conversation = await Conversation.create({
        userId,
        title: message.substring(0, 100)
      });
    }

    // 2. Save user message
    await Message.create({
      conversationId: conversation.id,
      role: 'user',
      content: message
    });

    // 3. Get history (last 10 messages)
    const history = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 10
    });

    // 4. RAG: get relevant context
    const context = await getRelevantContext(message);

    // 5. Build system instruction with context
    let systemInstruction = SYSTEM_PROMPT;
    if (context) {
      systemInstruction += `\n\nThông tin từ hệ thống EducoreAcademy:\n${context}`;
    }

    // 6. Initialize Gemini model
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    // 7. Build Gemini chat history (exclude the last user message, as we send it via sendMessage)
    const geminiHistory = [];
    const historyWithoutLast = history.slice(0, -1); // remove the latest user message

    for (const msg of historyWithoutLast) {
      geminiHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // 8. Start chat and send message
    const chat = model.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(message);
    const assistantContent = result.response.text();

    // 9. Save assistant response
    await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantContent
    });

    // 10. Return response
    res.json({
      conversationId: conversation.id,
      message: assistantContent
    });

  } catch (error) {
    console.error('Chat error detail:', error);

    // Handle Gemini specific errors
    const statusCode = error.status || (error.response && error.response.status) || 500;
    
    if (statusCode === 429) {
      return res.status(429).json({ 
        error: 'Bạn đã hết giới hạn sử dụng (Quota) của Gemini API. Hãy kiểm tra lại gói cước hoặc thử lại sau 1 phút.' 
      });
    }

    if (statusCode === 400) {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ. Vui lòng thử lại.' });
    }

    res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại.' });
  }
};

// ── GET /api/chat/conversations ──
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'createdAt', 'updatedAt']
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/chat/conversations/:id ──
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByPk(id, {
      include: [{
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }]
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/chat/conversations/:id ──
exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findByPk(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (req.user && conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.destroy({ where: { conversationId: id } });
    await conversation.destroy();

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
