"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLLMConfig = getLLMConfig;
function env(key, fallback = '') {
    return process.env[key] || fallback;
}
function getLLMConfig() {
    const apiKey = env('LLM_API_KEY');
    return {
        enabled: !!apiKey,
        provider: env('LLM_PROVIDER', 'deepseek'),
        model: env('LLM_MODEL', 'deepseek-chat'),
        apiKey,
        baseURL: env('LLM_BASE_URL', 'https://api.deepseek.com/v1'),
        timeout: 3000,
        maxTokens: 200,
        temperature: 0.1,
    };
}
//# sourceMappingURL=llm-mapper.config.js.map