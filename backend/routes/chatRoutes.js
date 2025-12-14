const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const createClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
};

const normalizeMessages = (messages = []) => messages
  .filter((msg) => typeof msg?.content === 'string' && msg.content.trim().length > 0)
  .map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content.trim(),
  }));

const usesResponsesApi = (model) => /(^gpt-4o|^o-|^gpt-4\.1|^gpt-4\.1)/i.test(model);

const toResponsesInput = (messages) => messages.map((message) => ({
  role: message.role,
  content: [{
    type: message.role === 'assistant' ? 'output_text' : 'input_text',
    text: message.content,
  }],
}));

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    const normalized = normalizeMessages(messages);
    if (!normalized.length) {
      return res.status(400).json({ message: 'messages must contain text content' });
    }

    const client = createClient();
    const model = (process.env.OPENAI_MODEL && process.env.OPENAI_MODEL.trim()) || 'gpt-4o-mini';

    let reply = '';
    if (usesResponsesApi(model)) {
      try {
        const response = await client.responses.create({
          model,
          input: toResponsesInput(normalized),
          temperature: 0.7,
        });

        reply = (response?.output_text || '').trim();
        if (!reply) {
          const messageNode = response?.output?.find((entry) => entry.type === 'message' && entry.role === 'assistant');
          reply = messageNode?.content?.map((part) => part.text).join(' ').trim() || '';
        }
      } catch (responsesErr) {
        console.warn('Responses API failed, attempting chat completions fallback:', responsesErr.response?.data || responsesErr.message || responsesErr);
        const fallbackMessages = [
          { role: 'system', content: 'You are Pickzi, a helpful shopping assistant.' },
          ...normalized,
        ];
        const completion = await client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: fallbackMessages,
          temperature: 0.7,
        });
        reply = completion?.choices?.[0]?.message?.content?.trim?.() || '';
      }
    } else {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: 'You are Pickzi, a helpful shopping assistant.' }, ...normalized],
        temperature: 0.7,
      });
      reply = completion?.choices?.[0]?.message?.content?.trim?.() || '';
    }

    if (!reply) {
      reply = "I'm not sure about that yet, but I'm still learning.";
    }

    return res.json({ reply });
  } catch (err) {
    if (err.message === 'OPENAI_API_KEY is not configured') {
      return res.status(500).json({ message: 'OpenAI API key is missing on the server' });
    }
    const status = err?.status || err?.statusCode || err?.response?.status;
    const errorPayload = err?.response?.data || err?.response || err;
    console.error('OpenAI chat error:', errorPayload);

    if (status === 429) {
      return res.status(503).json({ message: 'Assistant is temporarily unavailable (OpenAI quota exceeded). Please try again later.' });
    }

    return res.status(500).json({ message: 'Failed to generate response from assistant', error: err.message });
  }
});

module.exports = router;
