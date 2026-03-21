function toChatMessages(bodyMessages) {
  return (Array.isArray(bodyMessages) ? bodyMessages : [])
    .filter((message) => typeof message?.text === "string" && message.text.trim())
    .map((message) => ({
      role: message.role || "user",
      content: message.text,
    }));
}

function extractAssistantText(payload) {
  if (typeof payload?.choices?.[0]?.message?.content === "string") {
    return payload.choices[0].message.content;
  }

  if (Array.isArray(payload?.choices?.[0]?.message?.content)) {
    return payload.choices[0].message.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  return "";
}

export async function callOpenClaw({
  baseUrl,
  agentId,
  sessionKey,
  systemPrompt,
  bodyMessages,
}) {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-openclaw-agent-id": agentId,
      "x-openclaw-session-key": sessionKey,
    },
    body: JSON.stringify({
      model: "openclaw",
      stream: false,
      user: sessionKey,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...toChatMessages(bodyMessages),
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`openclaw upstream failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return {
    payload,
    text: extractAssistantText(payload),
  };
}
