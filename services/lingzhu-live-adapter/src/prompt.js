import { readFileSync } from "node:fs";

export function loadBasePrompt(systemPromptPath) {
  return readFileSync(systemPromptPath, "utf8").trim();
}

export function buildSystemPrompt(basePrompt, memoryItems) {
  if (!memoryItems || memoryItems.length === 0) {
    return basePrompt;
  }

  const memoryBlock = memoryItems
    .map((item, index) => `${index + 1}. [${item.kind}] ${item.content}`)
    .join("\n");

  return `${basePrompt}\n\n已知的用户长期记忆（仅供参考，优先使用最新上下文）：\n${memoryBlock}`;
}
