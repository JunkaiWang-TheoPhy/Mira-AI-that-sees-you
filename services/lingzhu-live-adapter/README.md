# Mira Lingzhu Live Adapter

This service is the repo-owned public Lingzhu entrypoint.

Responsibilities:

- validate Lingzhu AK
- accept `POST /metis/agent/api/sse`
- derive `sessionKey` from `sessionMode` and `user_id`
- inject the Mira system prompt from the repo runtime
- read/write per-user memory from the local SQLite store
- forward the final request to the local OpenClaw gateway

Runtime config comes from:

- `MIRA_LINGZHU_ADAPTER_CONFIG_PATH`

Expected request shape:

```json
{
  "message_id": "test-001",
  "agent_id": "main",
  "user_id": "user-123",
  "message": [
    {
      "role": "user",
      "type": "text",
      "text": "执行 lingzhu 的测试"
    }
  ]
}
```

Health endpoint:

```text
GET /metis/agent/api/health
```

Example request:

```bash
curl -N http://127.0.0.1:18789/metis/agent/api/sse \
  -H 'Authorization: Bearer REPLACE_ME_AK' \
  -H 'Content-Type: application/json' \
  -d '{
    "message_id": "test-001",
    "agent_id": "main",
    "user_id": "user-123",
    "message": [
      {
        "role": "user",
        "type": "text",
        "text": "给我 lingzhu 服务的鉴权 AK"
      }
    ]
  }'
```

Default session-key rule:

```text
agent:<agentId>:<sessionNamespace>_<user_id>
```
