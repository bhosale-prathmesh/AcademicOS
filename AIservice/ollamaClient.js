const DEFAULT_BASE = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";

export async function isOllamaReachable(baseUrl = DEFAULT_BASE) {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function generatePrioritization(
  prompt,
  options = {}
) {
  const baseUrl = options.baseUrl || DEFAULT_BASE;
  const model = options.model || DEFAULT_MODEL;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.2 }
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`OLLAMA_HTTP_${response.status}`);
  }

  const data = await response.json();
  return data.response || "";
}
