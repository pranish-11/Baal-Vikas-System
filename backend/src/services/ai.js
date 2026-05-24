async function chatWithParent(message, childrenContext) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("AI service not configured — ANTHROPIC_API_KEY is missing");
  }

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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
}

module.exports = { chatWithParent };
