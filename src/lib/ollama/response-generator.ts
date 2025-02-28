import { OllamaClient } from './ollama-client';
import { CDP } from '../types/cdp';
import { CDP_KEYWORDS } from '@/constants/cdp-keywords';
import { ActivityLogger } from '../utils/activity-logger';
import { SYSTEM_CONSTANTS } from '../utils/constants';
import { TextProcessor } from '../utils/text-processor';

export class ResponseGenerator {
  private llm: OllamaClient;

  constructor() {
    this.llm = new OllamaClient();
  }

  async generateResponse(
    query: string,
    context: string,
    cdp?: CDP
  ): Promise<string> {
    try {
      ActivityLogger.logActivity('GENERATE_RESPONSE_START', {
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        cdp,
        query
      });

      const sanitizedQuery = TextProcessor.sanitizeInput(query);
      const systemPrompt = this.buildSystemPrompt(cdp);
      const enhancedContext = this.enhanceContext(context, cdp);
      
      const response = await this.llm.generate({
        model: 'llama2',
        prompt: sanitizedQuery,
        system: `${systemPrompt}\n\nContext:\n${enhancedContext}`,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
          stop: ['<END>']
        }
      });
      
      const processedResponse = this.postProcessResponse(response.response);

      ActivityLogger.logActivity('GENERATE_RESPONSE_COMPLETE', {
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        cdp,
        responseLength: processedResponse.length
      });

      return processedResponse;

    } catch (error) {
      ActivityLogger.logError(error as Error, {
        operation: 'generate_response',
        user: SYSTEM_CONSTANTS.CURRENT_USER,
        timestamp: SYSTEM_CONSTANTS.CURRENT_TIME,
        cdp,
        query
      });
      
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  private buildSystemPrompt(cdp?: CDP): string {
    const timestamp = SYSTEM_CONSTANTS.CURRENT_TIME;
    let prompt = `You are a helpful CDP support agent operating at ${timestamp}. `;
    
    if (cdp) {
      prompt += `You specialize in the ${cdp} platform and will use specific ${cdp} terminology and features in your responses. `;
    } else {
      prompt += `You are knowledgeable about various CDP platforms including Segment, mParticle, Lytics, and Zeotap. `;
    }

    prompt += `
Guidelines:
- Provide clear, step-by-step instructions when explaining procedures
- Include relevant documentation links when available
- If uncertain, admit it and suggest checking the official documentation
- Keep responses focused on CDP-related topics
- Use technical terms accurately and consistently
- Format code examples in proper markdown code blocks
- Break down complex concepts into digestible parts
- Current time: ${timestamp}
- Current user: ${SYSTEM_CONSTANTS.CURRENT_USER}`;

    return prompt;
  }

  private enhanceContext(context: string, cdp?: CDP): string {
    let enhancedContext = TextProcessor.sanitizeInput(context);

    if (cdp && CDP_KEYWORDS[cdp]) {
      const relevantKeywords = CDP_KEYWORDS[cdp];
      enhancedContext += `\n\nRelevant ${cdp} terminology and concepts:\n`;
      enhancedContext += relevantKeywords.join(', ');
      enhancedContext += `\n\nNote: Use these terms appropriately in the response when relevant.`;
    }

    // Add any available documentation links
    if (cdp) {
      enhancedContext += this.getDocumentationLinks(cdp);
    }

    return TextProcessor.truncateText(enhancedContext, 2048);
  }

  private getDocumentationLinks(cdp: CDP): string {
    const docLinks: Record<CDP, string> = {
      SEGMENT: 'https://segment.com/docs/',
      MPARTICLE: 'https://docs.mparticle.com/',
      LYTICS: 'https://learn.lytics.com/',
      ZEOTAP: 'https://docs.zeotap.com/'
    };

    return `\n\nOfficial Documentation: ${docLinks[cdp]}`;
  }

  private postProcessResponse(response: string): string {
    // Clean up the response
    let processed = response
      .trim()
      .replace(/\\n/g, '\n') // Fix newlines
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/```(\w+)?\n\n/g, '```$1\n') // Fix code block spacing
      .replace(/\n\n```/g, '\n```'); // Fix code block endings

    // Ensure code blocks are properly formatted
    processed = processed.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const language = lang || '';
      const formattedCode = code.trim();
      return `\`\`\`${language}\n${formattedCode}\n\`\`\``;
    });

    // Add time reference if not present
    if (!processed.includes(SYSTEM_CONSTANTS.CURRENT_TIME)) {
      processed += `\n\nResponse generated at: ${SYSTEM_CONSTANTS.CURRENT_TIME}`;
    }

    return TextProcessor.truncateText(processed, 4096);
  }
}