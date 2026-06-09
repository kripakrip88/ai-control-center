import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MemoryService } from './memory.service';

export const MEMORY_CONTEXT_KEY = 'memoryContext';

@Injectable()
export class MemoryContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MemoryContextInterceptor.name);

  constructor(private readonly memoryService: MemoryService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    const projectId = this.extractProjectId(request);
    const orderId = this.extractOrderId(request);

    if (projectId && orderId) {
      try {
        const memories = await this.memoryService.recallOrderContext(
          projectId,
          orderId,
          5,
        );

        request[MEMORY_CONTEXT_KEY] = memories;

        this.logger.log(
          `Loaded ${memories.length} memories for order ${orderId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to load memory context: ${error.message}`,
        );
        request[MEMORY_CONTEXT_KEY] = [];
      }
    }

    return next.handle().pipe(
      tap(async (data) => {
        if (projectId) {
          await this.saveExecutionMemory(
            projectId,
            className,
            methodName,
            request,
            data,
          );
        }
      }),
    );
  }

  private extractProjectId(request: any): string | null {
    return (
      request.body?.projectId ||
      request.query?.projectId ||
      request.params?.projectId ||
      request.headers['x-project-id'] ||
      null
    );
  }

  private extractOrderId(request: any): string | null {
    return (
      request.body?.orderId ||
      request.query?.orderId ||
      request.params?.orderId ||
      request.headers['x-order-id'] ||
      null
    );
  }

  private async saveExecutionMemory(
    projectId: string,
    className: string,
    methodName: string,
    request: any,
    result: any,
  ): Promise<void> {
    try {
      const content = `AI Polygon выполнил: ${className}.${methodName}`;

      await this.memoryService.rememberAIDecision(projectId, content, {
        className,
        methodName,
        timestamp: new Date().toISOString(),
        result: typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : String(result),
      });
    } catch (error) {
      this.logger.error(`Failed to save execution memory: ${error.message}`);
    }
  }
}

export function getMemoryContext(request: any): any[] {
  return request[MEMORY_CONTEXT_KEY] || [];
}
