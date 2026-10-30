const { Anthropic } = require("@anthropic-ai/sdk");
const { MODEL } = require("../config");

// Ask Claude for a structured answer. We force a "tool call" whose input must match
// `schema`, so we always get clean JSON back instead of free text we have to parse.
async function askStructured({ apiKey, system, user, schema, toolName = "answer", maxTokens = 1024 }) {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
    tools: [
      {
        name: toolName,
        description: "Return the final structured answer.",
        input_schema: schema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block) throw new Error("The AI did not return a structured answer.");
  return block.input;
}

module.exports = { askStructured };