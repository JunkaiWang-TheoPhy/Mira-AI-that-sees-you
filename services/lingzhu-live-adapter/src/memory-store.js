import Database from "better-sqlite3";

function isExplicitMemoryText(text) {
  if (typeof text !== "string") {
    return false;
  }

  return [
    "记住",
    "我叫",
    "我是",
    "我喜欢",
    "我不喜欢",
    "我的偏好",
    "请记下",
  ].some((token) => text.includes(token));
}

function classifyMemoryKind(text) {
  if (text.includes("我喜欢") || text.includes("我不喜欢") || text.includes("偏好")) {
    return "preference";
  }
  if (text.includes("我叫") || text.includes("我是")) {
    return "identity";
  }
  return "explicit_memory";
}

export function createMemoryStore(storePath) {
  const db = new Database(storePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      namespace TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      source_message_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const insertStmt = db.prepare(`
    INSERT INTO memory_items (
      namespace,
      agent_id,
      user_id,
      kind,
      content,
      source_message_id,
      created_at,
      updated_at
    ) VALUES (
      @namespace,
      @agent_id,
      @user_id,
      @kind,
      @content,
      @source_message_id,
      @created_at,
      @updated_at
    );
  `);

  const selectStmt = db.prepare(`
    SELECT kind, content, updated_at
    FROM memory_items
    WHERE namespace = ? AND agent_id = ? AND user_id = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `);

  return {
    read(namespace, agentId, userId, limit = 8) {
      return selectStmt.all(namespace, agentId, userId, limit);
    },
    writeExplicitMemories({ namespace, agentId, userId, messageId, messages }) {
      const now = new Date().toISOString();
      for (const message of messages) {
        if (message.role !== "user" || typeof message.text !== "string") {
          continue;
        }
        if (!isExplicitMemoryText(message.text)) {
          continue;
        }
        insertStmt.run({
          namespace,
          agent_id: agentId,
          user_id: userId,
          kind: classifyMemoryKind(message.text),
          content: message.text.trim(),
          source_message_id: messageId || null,
          created_at: now,
          updated_at: now,
        });
      }
    },
  };
}
