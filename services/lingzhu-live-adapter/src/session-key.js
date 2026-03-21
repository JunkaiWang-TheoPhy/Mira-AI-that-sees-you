export function buildSessionKey(config, body) {
  const namespace = config.sessionNamespace || "mira-lingzhu-prod";
  const targetAgentId = config.agentId || body.agent_id || "main";
  const userId = body.user_id || body.agent_id || "anonymous";

  if (config.sessionMode === "shared_agent") {
    return `agent:${targetAgentId}:${namespace}_shared`;
  }

  if (config.sessionMode === "per_message") {
    return `agent:${targetAgentId}:${namespace}_${body.message_id || "unknown"}`;
  }

  return `agent:${targetAgentId}:${namespace}_${userId}`;
}
