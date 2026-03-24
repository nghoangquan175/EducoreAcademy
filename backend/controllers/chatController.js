const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Op, fn, col, literal } = require('sequelize');
const { Conversation, Message, Course, Article, Category, Chapter, Lesson, User, Enrollment } = require('../models');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là trợ lý AI của EducoreAcademy — nền tảng học trực tuyến hàng đầu.
Nhiệm vụ: tư vấn khóa học, giải đáp thắc mắc, hỗ trợ học viên tìm khóa học phù hợp.
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, chuyên nghiệp.
QUAN TRỌNG: Không sử dụng markdown formatting. Không dùng **, *, ##, \`\`\`, etc. Trả lời bằng text thuần túy.
Khi liệt kê, dùng dấu gạch ngang (-) hoặc số thứ tự (1. 2. 3.).
Nếu được cung cấp thông tin khóa học, bài viết, hãy sử dụng để trả lời chính xác và chi tiết.
Khi giới thiệu khóa học, nêu rõ: tên khóa, giảng viên, cấp độ, số học viên, rating, giá.
Nếu không biết hoặc không có thông tin, hãy nói rằng bạn không có thông tin và đề nghị liên hệ hỗ trợ.`;

// ── Helper: Strip markdown from text ──
function stripMarkdown(text) {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')  // ***bold italic***
    .replace(/\*\*(.*?)\*\*/g, '$1')       // **bold**
    .replace(/\*(.*?)\*/g, '$1')           // *italic*
    .replace(/^#{1,6}\s+/gm, '')           // # headings
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').replace(/```/g, '')) // code blocks
    .replace(/`([^`]+)`/g, '$1')           // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .trim();
}

// ── Helper: Detect user intent ──
function detectIntent(message) {
  const msg = message.toLowerCase();

  if (/xin chào|hello|hi |chào|hey/i.test(msg)) return 'greeting';
  if (/giá|bao nhiêu|phí|miễn phí|free|trả phí|pro/i.test(msg)) return 'pricing';
  if (/danh mục|thể loại|chủ đề|lĩnh vực|category/i.test(msg)) return 'categories';
  if (/bài viết|article|blog|tin tức/i.test(msg)) return 'articles';
  if (/chi tiết|nội dung|chương trình|curriculum|gồm|bao gồm|học gì|dạy gì/i.test(msg)) return 'course_detail';
  if (/khóa học|course|học|đăng ký|tìm/i.test(msg)) return 'course_search';
  if (/giảng viên|instructor|thầy|cô|người dạy/i.test(msg)) return 'instructor';

  return 'general';
}

// ── Helper: Extract keywords from message ──
function extractKeywords(message) {
  const stopWords = ['là', 'của', 'và', 'có', 'cho', 'với', 'trong', 'được', 'này', 'đó', 'một', 'các', 'những', 'để', 'từ', 'theo', 'về', 'hay', 'hoặc', 'không', 'tôi', 'mình', 'bạn', 'muốn', 'cần', 'hỏi', 'xin', 'ơi', 'nhé', 'nha', 'ạ', 'vậy', 'thì', 'mà', 'nào', 'gì', 'sao', 'thế', 'khóa', 'học', 'bài', 'viết', 'tìm', 'cho', 'xem', 'giới', 'thiệu', 'đăng', 'ký'];
  const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));
  return words.slice(0, 5);
}

// ── Helper: Get relevant context from DB (Enhanced RAG) ──
async function getRelevantContext(message) {
  const intent = detectIntent(message);
  const keywords = extractKeywords(message);

  try {
    let context = '';

    // ── Platform stats (always include for non-greeting) ──
    if (intent !== 'greeting') {
      const [courseCount, articleCount, userCount, categoryList] = await Promise.all([
        Course.count({ where: { published: 2 } }),
        Article.count({ where: { articleStatus: 2 } }),
        User.count({ where: { role: 'student' } }),
        Category.findAll({ attributes: ['name'], order: [['name', 'ASC']] })
      ]);

      context += `📊 Thống kê nền tảng EducoreAcademy:\n`;
      context += `- Tổng: ${courseCount} khóa học, ${articleCount} bài viết, ${userCount} học viên\n`;
      context += `- Danh mục: ${categoryList.map(c => c.name).join(', ')}\n\n`;
    }

    // ── Categories detail ──
    if (intent === 'categories') {
      const categories = await Category.findAll({
        attributes: ['name'],
        order: [['name', 'ASC']]
      });
      const categoryCourseCount = await Promise.all(
        categories.map(async (cat) => {
          const count = await Course.count({ where: { published: 2, category: cat.name } });
          return { name: cat.name, count };
        })
      );
      context += `📂 Chi tiết danh mục:\n`;
      categoryCourseCount.forEach(c => {
        context += `- ${c.name}: ${c.count} khóa học\n`;
      });
      context += '\n';
    }

    // ── Course search ──
    if (['course_search', 'course_detail', 'pricing', 'instructor', 'general'].includes(intent) && keywords.length > 0) {
      const courseWhere = {
        published: 2,
        [Op.or]: [
          ...keywords.map(kw => ({ title: { [Op.like]: `%${kw}%` } })),
          ...keywords.map(kw => ({ description: { [Op.like]: `%${kw}%` } })),
          ...keywords.map(kw => ({ category: { [Op.like]: `%${kw}%` } })),
        ]
      };

      const courses = await Course.findAll({
        where: courseWhere,
        attributes: ['id', 'title', 'description', 'price', 'category', 'level', 'rating', 'isPro', 'studentsCount', 'duration', 'videoCount', 'quizCount'],
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['name']
          }
        ],
        limit: 5,
        order: [['rating', 'DESC']]
      });

      if (courses.length > 0) {
        context += `📚 Khóa học liên quan:\n`;
        for (const c of courses) {
          const priceLabel = c.isPro ? `${c.price?.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí';
          context += `- "${c.title}" (${priceLabel}, ${c.category || 'Chưa phân loại'}, ${c.level})\n`;
          context += `  Giảng viên: ${c.instructor?.name || 'N/A'} | ${c.studentsCount || 0} học viên | Rating: ${c.rating || 'N/A'}\n`;
          context += `  ${c.duration || 'N/A'} | ${c.videoCount || 0} videos | ${c.quizCount || 0} quizzes\n`;
          if (c.description) {
            context += `  Mô tả: ${c.description.substring(0, 200)}\n`;
          }

          // Include curriculum for course_detail intent
          if (intent === 'course_detail') {
            const chapters = await Chapter.findAll({
              where: { courseId: c.id },
              attributes: ['id', 'title', 'chapterOrder'],
              include: [{
                model: Lesson,
                as: 'lessons',
                attributes: ['title', 'lessonOrder', 'duration', 'isFree'],
                order: [['lessonOrder', 'ASC']]
              }],
              order: [['chapterOrder', 'ASC']],
              limit: 5
            });

            if (chapters.length > 0) {
              context += `  Chương trình học:\n`;
              chapters.forEach(ch => {
                context += `    Chương ${ch.chapterOrder}: ${ch.title}\n`;
                if (ch.lessons) {
                  ch.lessons.forEach(l => {
                    const freeLabel = l.isFree ? ' (Miễn phí)' : '';
                    context += `      - ${l.title} (${l.duration || 'N/A'})${freeLabel}\n`;
                  });
                }
              });
            }
          }
          context += '\n';
        }
      }

      // If no keyword match, show popular courses
      if (courses.length === 0 && ['course_search', 'general'].includes(intent)) {
        const popularCourses = await Course.findAll({
          where: { published: 2 },
          attributes: ['title', 'category', 'level', 'rating', 'isPro', 'price', 'studentsCount'],
          include: [{ model: User, as: 'instructor', attributes: ['name'] }],
          order: [['studentsCount', 'DESC']],
          limit: 5
        });
        if (popularCourses.length > 0) {
          context += `📚 Khóa học phổ biến nhất:\n`;
          popularCourses.forEach(c => {
            const priceLabel = c.isPro ? `${c.price?.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí';
            context += `- "${c.title}" (${priceLabel}, ${c.category || 'N/A'}, ${c.level}) - ${c.instructor?.name || 'N/A'} | ${c.studentsCount || 0} học viên | Rating: ${c.rating || 'N/A'}\n`;
          });
          context += '\n';
        }
      }
    }

    // ── Article search ──
    if (['articles', 'general'].includes(intent) && keywords.length > 0) {
      const articles = await Article.findAll({
        where: {
          articleStatus: 2,
          [Op.or]: [
            ...keywords.map(kw => ({ title: { [Op.like]: `%${kw}%` } })),
            ...keywords.map(kw => ({ content: { [Op.like]: `%${kw}%` } })),
            ...keywords.map(kw => ({ category: { [Op.like]: `%${kw}%` } })),
          ]
        },
        attributes: ['id', 'title', 'excerpt', 'category'],
        include: [{ model: User, as: 'author', attributes: ['name'] }],
        limit: 5
      });

      if (articles.length > 0) {
        context += `📰 Bài viết liên quan:\n`;
        articles.forEach(a => {
          context += `- "${a.title}" bởi ${a.author?.name || 'N/A'} (${a.category || 'Chưa phân loại'})\n`;
          if (a.excerpt) context += `  Tóm tắt: ${a.excerpt.substring(0, 200)}\n`;
        });
        context += '\n';
      }
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
    const { message, conversationId, sessionId } = req.body;
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
    } else if (!userId && sessionId) {
      // Guest: find existing conversation by sessionId or create new
      conversation = await Conversation.findOne({
        where: { sessionId, userId: null },
        order: [['updatedAt', 'DESC']]
      });
      if (!conversation) {
        conversation = await Conversation.create({
          userId: null,
          sessionId,
          title: message.substring(0, 100)
        });
      }
    } else {
      conversation = await Conversation.create({
        userId,
        sessionId: null,
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
    const historyWithoutLast = history.slice(0, -1);

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
    let assistantContent = result.response.text();

    // 9. Strip markdown from response
    assistantContent = stripMarkdown(assistantContent);

    // 10. Save assistant response
    await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: assistantContent
    });

    // 11. Return response
    res.json({
      conversationId: conversation.id,
      message: assistantContent
    });

  } catch (error) {
    console.error('Chat error detail:', error);

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

// ── GET /api/chat/latest ── (logged-in user: get latest conversation with last 10 messages)
exports.getLatestConversation = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'createdAt', 'updatedAt']
    });

    if (!conversation) {
      return res.json({ conversation: null, messages: [], hasMore: false });
    }

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const totalCount = await Message.count({ where: { conversationId: conversation.id } });

    res.json({
      conversation,
      messages: messages.reverse(), // return in chronological order
      hasMore: totalCount > 10
    });
  } catch (error) {
    console.error('Get latest conversation error:', error);
    res.status(500).json({ error: error.message });
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

// ── GET /api/chat/conversations/:id ── (with cursor-based pagination)
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 10 } = req.query;

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Build where clause for pagination
    const where = { conversationId: parseInt(id) };
    if (before) {
      where.id = { [Op.lt]: parseInt(before) };
    }

    const messages = await Message.findAll({
      where,
      order: [['id', 'DESC']],
      limit: parseInt(limit)
    });

    // Check if there are more messages
    const hasMore = messages.length === parseInt(limit) && await Message.count({
      where: {
        conversationId: parseInt(id),
        id: { [Op.lt]: messages[messages.length - 1]?.id || 0 }
      }
    }) > 0;

    res.json({
      messages: messages.reverse(), // return in chronological order
      hasMore
    });
  } catch (error) {
    console.error('Get messages error:', error);
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
