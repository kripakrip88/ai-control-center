import { Injectable, Logger } from '@nestjs/common';
import { MemoryService } from './memory.service';
import Anthropic from '@anthropic-ai/sdk';

export interface AIWithMemoryOptions {
  projectId: string;
  orderId?: string;
  includeMemoryContext?: boolean;
  memoryLimit?: number;
  contextPrefix?: string;
}

export interface EnrichedPromptResult {
  enrichedPrompt: string;
  originalPrompt: string;
  memories: any[];
  contextAdded: boolean;
}

@Injectable()
export class AIWithMemoryProvider {
  private readonly logger = new Logger(AIWithMemoryProvider.name);
  private anthropic: Anthropic;

  constructor(private readonly memoryService: MemoryService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async enrichPromptWithMemory(
    prompt: string,
    options: AIWithMemoryOptions,
  ): Promise<EnrichedPromptResult> {
    if (!options.includeMemoryContext) {
      return {
        enrichedPrompt: prompt,
        originalPrompt: prompt,
        memories: [],
        contextAdded: false,
      };
    }

    try {
      let memories = [];

      if (options.orderId) {
        memories = await this.memoryService.recallOrderContext(
          options.projectId,
          options.orderId,
          options.memoryLimit || 5,
        );
      } else {
        memories = await this.memoryService.recallExtractionHistory(
          options.projectId,
          undefined,
          options.memoryLimit || 5,
        );
      }

      if (memories.length === 0) {
        this.logger.log('No memories found for context');
        return {
          enrichedPrompt: prompt,
          originalPrompt: prompt,
          memories: [],
          contextAdded: false,
        };
      }

      const contextPrefix =
        options.contextPrefix ||
        '=== КОНТЕКСТ ИЗ ПРОШЛОГО ОПЫТА ===';

      const memoryContext = memories
        .map((m, idx) => `${idx + 1}. ${m.memory || m.content}`)
        .join('\n');

      const enrichedPrompt = `${contextPrefix}

${memoryContext}

=== ТЕКУЩАЯ ЗАДАЧА ===

${prompt}`;

      this.logger.log(
        `Enriched prompt with ${memories.length} memories for ${options.projectId}`,
      );

      return {
        enrichedPrompt,
        originalPrompt: prompt,
        memories,
        contextAdded: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to enrich prompt with memory: ${error.message}`,
      );
      return {
        enrichedPrompt: prompt,
        originalPrompt: prompt,
        memories: [],
        contextAdded: false,
      };
    }
  }

  async askClaudeWithMemory(
    prompt: string,
    options: AIWithMemoryOptions,
  ): Promise<{
    response: string;
    enrichedPrompt: EnrichedPromptResult;
  }> {
    const enrichedPrompt = await this.enrichPromptWithMemory(prompt, options);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: enrichedPrompt.enrichedPrompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text'
          ? message.content[0].text
          : '';

      await this.memoryService.rememberAIDecision(
        options.projectId,
        `Claude ответил на запрос: ${prompt.substring(0, 100)}...`,
        {
          response: responseText.substring(0, 200),
          memoriesUsed: enrichedPrompt.memories.length,
          orderId: options.orderId,
        },
      );

      return {
        response: responseText,
        enrichedPrompt,
      };
    } catch (error) {
      this.logger.error(`Failed to ask Claude: ${error.message}`);
      throw error;
    }
  }

  async analyzeWithContext(
    data: any,
    analysisPrompt: string,
    options: AIWithMemoryOptions,
  ): Promise<any> {
    const dataStr = JSON.stringify(data, null, 2);
    const fullPrompt = `${analysisPrompt}

Данные для анализа:
\`\`\`json
${dataStr}
\`\`\``;

    const result = await this.askClaudeWithMemory(fullPrompt, options);

    return {
      analysis: result.response,
      contextUsed: result.enrichedPrompt.contextAdded,
      memoriesCount: result.enrichedPrompt.memories.length,
    };
  }
}
