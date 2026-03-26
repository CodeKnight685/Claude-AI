import Anthropic from "@anthropic-ai/sdk";
import { ZOHO_TOOLS, handleZohoTool } from "../../../lib/zoho-tools.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a smart customer support agent with direct access to Zoho CRM.

Your capabilities:
1. **Contact Lookup** — When a user mentions their email, immediately look them up in CRM to personalize your response
2. **Deal Awareness** — Fetch their linked deals to understand their purchase context
3. **Lead Creation** — If a new user isn't in CRM yet, create a lead after getting their details
4. **CRM Updates** — Update contact info or deal fields when users share new information
5. **Activity Logging** — At the end of every conversation, log a summary back into CRM
6. **Pipeline Analysis** — Answer questions about the sales pipeline using live CRM data

Behavior rules:
- Always greet returning contacts by name once you've looked them up
- Never hallucinate CRM data — only state what the tools return
- Before creating or updating a CRM record, briefly confirm with the user
- Always log the conversation at the end of the session
- Be concise, professional, and empathetic
- If a user asks about their orders or deals, fetch their deals proactively

Respond in JSON with this structure:
{
  "thinking": "Brief reasoning about what to do",
  "response": "Your message to the user",
  "user_mood": "positive|neutral|negative|curious|frustrated|confused",
  "suggested_questions": ["Up to 3 follow-up questions"],
  "crm_context": {
    "contact_found": true,
    "contact_name": "Name if found",
    "contact_id": "ID if found",
    "record_type": "Contact|Lead|null"
  },
  "requires_human": false
}`;

export async function POST(request) {
  try {
    const { messages, sessionEmail } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const systemWithContext = sessionEmail
      ? `${SYSTEM_PROMPT}\n\nSession email hint: ${sessionEmail} — look this up proactively.`
      : SYSTEM_PROMPT;

    let currentMessages = [...messages];
    let finalResponse = null;
    const toolCallLog = [];

    for (let iteration = 0; iteration < 10; iteration++) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemWithContext,
        tools: ZOHO_TOOLS,
        messages: currentMessages,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        finalResponse = textBlock?.text || "";
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

        currentMessages.push({
          role: "assistant",
          content: response.content,
        });

        const toolResults = [];
        for (const toolBlock of toolUseBlocks) {
          let result;
          let isError = false;

          try {
            result = await handleZohoTool(toolBlock.name, toolBlock.input);
            toolCallLog.push({ tool: toolBlock.name, input: toolBlock.input, result });
          } catch (err) {
            result = { error: err.message };
            isError = true;
            toolCallLog.push({ tool: toolBlock.name, input: toolBlock.input, error: err.message });
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: JSON.stringify(result),
            ...(isError && { is_error: true }),
          });
        }

        currentMessages.push({
          role: "user",
          content: toolResults,
        });

        continue;
      }

      break;
    }

    let parsed = {};
    try {
      const jsonMatch = finalResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = { response: finalResponse };
    }

    return Response.json({
      ...parsed,
      tool_calls: toolCallLog,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
