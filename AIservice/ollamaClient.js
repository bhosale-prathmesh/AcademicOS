const DEFAULT_BASE = "http://127.0.0.1:11434";

// Models we prefer for short JSON answers (first match wins). Anything else
// installed is used as a fallback; embedding models are never used.
const PREFERRED = [
  "qwen2.5", "llama3", "mistral", "gemma", "phi3", "phi4", "qwen3", "deepseek"
];
const NOT_CHAT_MODELS = /embed|bge-|minilm|rerank/i;

function sameModel(installed, wanted) {
  return installed === wanted || installed === `${wanted}:latest`;
}

// Asks Ollama which models are installed. Never throws.
export async function checkOllama(baseUrl = DEFAULT_BASE) {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) {
      return { ok: false, models: [], error: `http_${response.status}` };
    }

    const data = await response.json();
    const models = (data.models || []).map(model => model.name).filter(Boolean);
    return { ok: true, models, error: null };
  } catch (error) {
    // Ollama is stopped, or the browser blocked the request (CORS / file://).
    return { ok: false, models: [], error: "unreachable" };
  }
}

export async function isOllamaReachable(baseUrl = DEFAULT_BASE) {
  return (await checkOllama(baseUrl)).ok;
}

export function pickModel(models, wanted = null) {
  const chatModels = models.filter(name => !NOT_CHAT_MODELS.test(name));
  if (!chatModels.length) return null;

  if (wanted) {
    const exact = chatModels.find(name => sameModel(name, wanted));
    if (exact) return exact;
  }

  const rank = name => {
    const index = PREFERRED.findIndex(prefix => name.startsWith(prefix));
    if (index === -1) return 99;
    // Coder variants are fine, but general models are a better fit here.
    return index + (name.includes("coder") ? 0.5 : 0);
  };

  return [...chatModels].sort((a, b) => rank(a) - rank(b))[0];
}

export async function generatePrioritization(prompt, options = {}) {
  const baseUrl = options.baseUrl || DEFAULT_BASE;

  if (!options.model) throw new Error("OLLAMA_NO_MODEL");

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model,
      prompt,
      stream: false,
      format: "json",
      keep_alive: "10m",
      options: { temperature: 0.2, num_predict: 200 }
    }),
    // The first request after starting Ollama loads the model into memory.
    signal: AbortSignal.timeout(options.timeoutMs || 120000)
  });

  if (!response.ok) {
    throw new Error(`OLLAMA_HTTP_${response.status}`);
  }

  const data = await response.json();
  return data.response || "";
}