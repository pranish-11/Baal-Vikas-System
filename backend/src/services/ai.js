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
- Keep responses extremely simple, short, and easy for parents to read.
- Use simple, friendly, and brief phrases/sentences rather than long paragraphs.
- Provide ONLY the required data relevant to the parent's specific question. Do not dump all categories of information (e.g. do not volunteer detailed fee statuses, medical notes, or long observation lists unless the parent specifically asks about them).
- For general questions like "How is my child doing", give a simple 2-3 sentence summary highlighting how they are doing overall and any single key update, rather than a full breakdown of every data point.
- Limit the total response to 1-2 short paragraphs or a few brief bullet points max.
- Reference actual data accurately when answering, but keep it minimal and easy to digest.
- Use NPR (Nepali Rupees) as the currency symbol (e.g. NPR 12,000) when answering questions about fees.
- Common observation tags include: focused, social, eating well, creative, active, needs support, good listener, energetic, curious, helpful
- If you don't have specific data for a question, say so honestly but stay encouraging
- Use emoji sparingly for warmth 🌱
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
