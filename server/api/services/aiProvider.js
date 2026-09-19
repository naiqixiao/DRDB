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

async function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof fetch !== "function") {
    throw new AiServiceError("This Node.js runtime does not provide fetch; upgrade Node.js to use AI features.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
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
  return (explicitProvider || process.env.AI_PROVIDER || "ninfer").toLowerCase();
}

/**
 * Calls the configured LLM provider with a strict-JSON prompt and parses the
 * response against fieldSpecs. Supported providers:
 *  - ninfer: local, OpenAI-compatible inference server (default/priority)
 *  - ollama: local Ollama chat endpoint
 *  - groq:   cloud provider, kept available for training-set testing
 */
async function callProvider(prompt, fieldSpecs, explicitProvider, options = {}) {
  const provider = resolveProvider(explicitProvider);
  const timeoutMs = resolveTimeoutMs();
  const maxTokens = options.maxTokens || 400;
  const systemMessage = { role: "system", content: "You return strict JSON and follow safety instructions." };
  const userMessage = { role: "user", content: prompt };

  if (provider === "ninfer") {
    const url = process.env.NINFER_URL || "http://130.113.218.247:8080/v1/chat/completions";
    const enableThinking = process.env.NINFER_ENABLE_THINKING === "true";
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.NINFER_MODEL || "Qwen3.8-27B",
          temperature: 0.4,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
          chat_template_kwargs: { enable_thinking: enableThinking },
          messages: [systemMessage, userMessage],
        }),
      },
      timeoutMs
    );
    if (!response.ok) throw new AiServiceError("The local AI server returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
    const data = await response.json();
    return parseModelJson(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content, fieldSpecs);
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
          messages: [systemMessage, userMessage],
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

  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0.4,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [systemMessage, userMessage],
      }),
    },
    timeoutMs
  );
  if (response.status === 429) throw new AiServiceError("The AI provider quota was reached. Try again later.", 429, "AI_RATE_LIMITED");
  if (!response.ok) throw new AiServiceError("Groq returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
  const data = await response.json();
  return parseModelJson(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content, fieldSpecs);
}

function currentProviderInfo(explicitProvider) {
  const provider = resolveProvider(explicitProvider);
  const modelEnvKey = provider === "ollama" ? "OLLAMA_MODEL" : provider === "groq" ? "GROQ_MODEL" : "NINFER_MODEL";
  const modelDefault = provider === "ollama" ? "gemma3" : provider === "groq" ? "openai/gpt-oss-20b" : "Qwen3.8-27B";
  return { provider, model: process.env[modelEnvKey] || modelDefault };
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
