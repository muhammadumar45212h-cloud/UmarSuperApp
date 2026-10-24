export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2
  ].filter(Boolean);

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  if (!keys.length) {
    return res.status(503).json({
      error: "Groq server keys are not configured."
    });
  }

  const question = String(req.body?.question || "").trim();

  if (!question || question.length > 6000) {
    return res.status(400).json({
      error: "Question is empty or too long."
    });
  }

  const history = Array.isArray(req.body?.history)
    ? req.body.history.slice(-8)
        .filter(m => m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string")
        .map(m => ({
          role: m.role,
          content: m.content.slice(0, 3000)
        }))
    : [];

  const messages = [
    {
      role: "system",
      content:
        "You are Super AI, the AI assistant for Muhammad Umar's Super App. " +
        "Understand English, Urdu, and Roman Urdu. Reply in the language " +
        "the user uses, with clear, friendly, well-organized answers. " +
        "For questions about your creator, say Muhammad Umar created you. " +
        "If asked about your creator's father's name, answer Ghulam Hussain. " +
        "If asked where your creator is from, answer Thull, Sindh, Pakistan. " +
        "These identity details are configured by the app owner; do not " +
        "pretend they are independently verified biographical facts. " +
        "Explain knowledge clearly with examples when useful. For coding, " +
        "give practical steps and working code where possible. " +
        "Never invent facts, sources, live information, or capabilities. " +
        "Do not claim live internet access without actually searching. " +
        "Say when you are unsure. Chatting does not automatically train " +
        "your underlying model."
    },
    ...history,
    { role: "user", content: question }
  ];

  for (const key of keys) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.4,
            max_completion_tokens: 1200
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        continue;
      }

      if (!response.ok) {
        console.error("Groq status:", response.status);
        return res.status(response.status === 429 ? 429 : 502).json({
          error: response.status === 429
            ? "Groq rate limit or quota reached."
            : "Groq request failed."
        });
      }

      const answer = data.choices?.[0]?.message?.content;

      if (!answer) {
        return res.status(502).json({ error: "Empty AI response." });
      }

      return res.status(200).json({
        answer,
        model: data.model || model
      });
    } catch (error) {
      console.error("Groq connection error:", error.message);
      return res.status(502).json({ error: "Could not reach Groq." });
    }
  }

  return res.status(401).json({
    error: "Both configured Groq keys were rejected. Check server settings."
  });
}
