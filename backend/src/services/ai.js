async function chatWithParent(message, childrenContext) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("AI service not configured — ANTHROPIC_API_KEY is missing");
  }

  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are Axion, a warm and friendly AI school assistant for Sunrise Montessori school.
You help parents understand how their children are doing at school.

Here is the real data about this parent's children:
${JSON.stringify(childrenContext, null, 2)}

Guidelines:
- Be warm, supportive, and encouraging
- Reference actual data: attendance records, fee status, teacher observations, behavior points
- If asked about eating habits or activities, use the teacher observation tags and notes
- Common observation tags include: focused, social, eating well, creative, active, needs support, good listener, energetic, curious, helpful
- If you don't have specific data for a question, say so honestly but stay encouraging
- Keep responses concise but helpful (2-4 paragraphs max)
- Use emoji sparingly for warmth 🌱
- Format fees as currency amounts
- Calculate attendance percentages when discussing attendance
- If a child has been absent recently, gently mention it
- Never make up data — only reference what's in the context`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  return response.content[0]?.text || "I'm sorry, I couldn't generate a response.";
}

module.exports = { chatWithParent };
