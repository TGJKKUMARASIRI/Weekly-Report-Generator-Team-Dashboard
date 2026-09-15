import { Router } from 'express';
import OpenAI from 'openai';
import { authenticateJWT, requireRoles } from '../middleware/auth.js';
import { Report } from '../models/Report.js';
const router = Router();

router.post('/chat', authenticateJWT, requireRoles('MANAGER'), async (req, res) => {
  try {
    // Check key inside the request handler so it reads process.env at runtime
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ message: 'OPENAI_API_KEY is not configured on the server.' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { message, weekIdentifier } = req.body;

    // 1. Fetch relevant report context directly from DB
    const filter: any = { status: { $ne: 'DRAFT' } };
    if (weekIdentifier) filter.weekIdentifier = weekIdentifier;

    const reports = await Report.find(filter)
      .populate('userId', 'name department')
      .populate('projectId', 'name')
      .select('userId projectId blockers achievements tasks nextWeekTasks weekIdentifier');

    // 2. Prepare structured data context for LLM
    const systemPrompt = `
      You are an executive AI assistant for project managers.
      Analyze the following team weekly reports and answer the user's question clearly and concisely.
      Highlight completed work, recurring blockers, or workload imbalances when asked.

      Weekly Reports Context Data:
      ${JSON.stringify(reports, null, 2)}
    `;

    // 3. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
    });

    return res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({ message: 'Failed to process AI chat request' });
  }
});

export default router;