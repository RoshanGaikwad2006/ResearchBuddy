import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export interface OpenRouterCallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenRouterService {
  /**
   * Retrieves server-side OpenRouter ChatOpenAI instance
   */
  static getModel(options?: OpenRouterCallOptions): ChatOpenAI {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
    let modelName = options?.model || process.env.OPENROUTER_MODEL || process.env.LLM_MODEL_NAME || "meta-llama/llama-3.3-70b-instruct:free";

    // Map openrouter/free alias to popular free tier model
    if (modelName === "openrouter/free" || modelName === "free") {
      modelName = "meta-llama/llama-3.3-70b-instruct:free";
    }

    const baseURL = process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1";

    if (!apiKey) {
      console.warn("⚠️ OpenRouter API Key is missing. Using heuristic AI fallback.");
    }

    return new ChatOpenAI({
      openAIApiKey: apiKey || "dummy-key-for-heuristic-fallback",
      configuration: {
        baseURL,
        defaultHeaders: {
          "HTTP-Referer": "https://kriya.institution.edu",
          "X-Title": "KRIYA AI Research Intelligence Engine",
        },
      },
      modelName,
      temperature: options?.temperature ?? 0.2,
      maxTokens: options?.maxTokens || 1500,
    });
  }

  /**
   * Safe LLM invocation wrapper with timeout protection & graceful fallback
   */
  static async invokeSafe(prompt: string, options?: OpenRouterCallOptions): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return JSON.stringify({
        status: "FALLBACK",
        message: "AI analysis server-side key not configured. Using deterministic KRIYA engine analysis.",
      });
    }

    try {
      const model = this.getModel(options);
      const response = await model.invoke(prompt);
      return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    } catch (error: any) {
      console.error("OpenRouter API Call Error:", error.message || error);
      return JSON.stringify({
        status: "ERROR",
        message: "AI analysis service is temporarily unavailable. Deterministic evidence scoring remains active.",
      });
    }
  }
}
