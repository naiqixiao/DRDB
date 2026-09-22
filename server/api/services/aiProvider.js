class AiServiceError extends Error {
  constructor(message, statusCode = 503, code = "AI_UNAVAILABLE") {
    super(message);
    this.name = "AiServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanModelText(value, maxLength) {
  return limitText(stripHtml(value).replace(/[\r\n]+/g, " "), maxLength);
}

/**
 * fieldSpecs: [{ key, maxLength, allowedValues?, fallback?, preserveHtml? }]
 * allowedValues restricts a field to a fixed set (e.g. an enum-like
 * classification); a value outside that set is replaced with `fallback`
 * (default "") instead of trusting free-form model output.
 * preserveHtml skips HTML-stripping for fields that are meant to carry
 * markup (e.g. a polished email body); the caller is responsible for
 * sanitizing that HTML before it is rendered or persisted.
 */
function parseModelJson(content, fieldSpecs) {
  const text = String(content || "").trim();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new AiServiceError("The AI provider returned an invalid draft.", 502, "AI_INVALID_RESPONSE");
  }

  const result = {};
  for (const spec of fieldSpecs) {
    const raw = parsed && parsed[spec.key];
    let value = spec.preserveHtml
      ? limitText(String(raw || ""), spec.maxLength)
      : cleanModelText(raw, spec.maxLength);
    if (spec.allowedValues && !spec.allowedValues.includes(value)) {
      value = spec.fallback !== undefined ? spec.fallback : "";
    }
    result[spec.key] = value;
  }
  return result;
}

// Node 18+ provides fetch as a global; older runtimes (e.g. Node 16 on
// locked-down deployment hosts where upgrading Node isn't an option) fall
// back to node-fetch, which implements the same interface.
const fetchImpl = typeof fetch === "function" ? fetch : require("node-fetch");

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AiServiceError("The AI provider timed out.", 504, "AI_TIMEOUT");
    }
    throw new AiServiceError("The AI provider could not be reached.", 503, "AI_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

function resolveTimeoutMs() {
  return Math.max(1000, Number(process.env.AI_TIMEOUT_MS || process.env.AI_EMAIL_TIMEOUT_MS || 15000));
}

function resolveProvider(explicitProvider) {
  return (explicitProvider || process.env.AI_PROVIDER || "local").toLowerCase();
}

function openAICompatibleUrl(baseUrl) {
  return String(baseUrl || "").replace(/\/+$/, "") + "/chat/completions";
}

async function callOpenAICompatibleProvider({ baseUrl, apiKey, modelName, messages, timeoutMs, providerName, jsonMode, maxTokens, extraBody, fieldSpecs }) {
  if (!baseUrl || !modelName) {
    throw new AiServiceError(
      providerName + " is not configured. Set its base URL and model name on the server.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = "Bearer " + apiKey;
  const body = {
    model: modelName,
    temperature: 0.4,
    max_tokens: maxTokens,
    messages,
    ...(extraBody || {}),
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetchWithTimeout(
    openAICompatibleUrl(baseUrl),
    { method: "POST", headers, body: JSON.stringify(body) },
    timeoutMs
  );
  if (response.status === 429) {
    throw new AiServiceError(providerName + " is busy or rate-limited. Try again later.", 429, "AI_RATE_LIMITED");
  }
  if (!response.ok) {
    throw new AiServiceError(providerName + " returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
  }
  const data = await response.json();
  return parseModelJson(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content, fieldSpecs);
}

/**
 * Calls the configured LLM provider with a strict-JSON prompt and parses the
 * response against fieldSpecs. `messages` is a full chat messages array
 * (system + user); callers own their own system prompt. Supported providers:
 *  - local:  lab-hosted, OpenAI-compatible endpoint (default/priority) —
 *            defaults to the lab's NInfer server so it works out of the box,
 *            but LOCAL_LLM_* env vars can point it at any OpenAI-compatible
 *            server.
 *  - ollama: local Ollama chat endpoint
 *  - groq:   cloud provider, kept available for training-set testing
 */
async function callProvider(messages, fieldSpecs, explicitProvider, options = {}) {
  const provider = resolveProvider(explicitProvider);
  const timeoutMs = resolveTimeoutMs();
  const maxTokens = options.maxTokens || 400;

  if (provider === "local") {
    return callOpenAICompatibleProvider({
      baseUrl: process.env.LOCAL_LLM_BASE_URL || "http://130.113.218.247:8080/v1",
      apiKey: process.env.LOCAL_LLM_API_KEY,
      modelName: process.env.LOCAL_LLM_MODEL || "Qwen3.8-27B",
      messages,
      timeoutMs,
      providerName: "Local LLM",
      jsonMode: process.env.LOCAL_LLM_JSON_MODE === "true",
      maxTokens,
      // Qwen3-style servers (e.g. vLLM) accept this to disable chain-of-thought
      // output; harmless extra field for servers that don't recognize it.
      extraBody: { chat_template_kwargs: { enable_thinking: process.env.LOCAL_LLM_ENABLE_THINKING === "true" } },
      fieldSpecs,
    });
  }

  if (provider === "ollama") {
    const response = await fetchWithTimeout(
      process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "gemma3",
          stream: false,
          format: "json",
          messages,
          options: { temperature: 0.4, num_predict: maxTokens },
        }),
      },
      timeoutMs
    );
    if (!response.ok) throw new AiServiceError("Ollama returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
    const data = await response.json();
    return parseModelJson(data.message && data.message.content, fieldSpecs);
  }

  if (provider !== "groq") {
    throw new AiServiceError("Unsupported AI provider: " + provider + ".", 500, "AI_CONFIGURATION_ERROR");
  }
  if (!process.env.GROQ_API_KEY) {
    throw new AiServiceError("AI features are not configured. Set GROQ_API_KEY on the server.", 503, "AI_NOT_CONFIGURED");
  }

  return callOpenAICompatibleProvider({
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
    modelName: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    messages,
    timeoutMs,
    providerName: "Groq",
    jsonMode: true,
    maxTokens,
    fieldSpecs,
  });
}

function currentProviderInfo(explicitProvider) {
  const provider = resolveProvider(explicitProvider);
  const modelEnvByProvider = { local: "LOCAL_LLM_MODEL", ollama: "OLLAMA_MODEL", groq: "GROQ_MODEL" };
  const defaultModelByProvider = { local: "Qwen3.8-27B", ollama: "gemma3", groq: "openai/gpt-oss-20b" };
  return {
    provider,
    model: process.env[modelEnvByProvider[provider]] || defaultModelByProvider[provider] || "unknown",
  };
}

module.exports = {
  AiServiceError,
  stripHtml,
  limitText,
  cleanModelText,
  parseModelJson,
  fetchWithTimeout,
  callProvider,
  currentProviderInfo,
};
