import "server-only";

import { aiService } from "./ai.service";
import { listAgents } from "./agents";
import type { AiAgentDescriptor, AiAgentId, AiJob } from "./ai.types";

export const aiController = {
  isEnabled(): boolean {
    return aiService.isEnabled();
  },

  listAgents(): AiAgentDescriptor[] {
    return listAgents().map((a) => a.descriptor);
  },

  async listRecent(agent?: AiAgentId, limit = 20): Promise<AiJob[]> {
    const r = await aiService.listRecent(agent, limit);
    if (!r.ok) throw r.error;
    return r.value;
  },

  async getById(id: string): Promise<AiJob | null> {
    const r = await aiService.getById(id);
    if (!r.ok) throw r.error;
    return r.value;
  },
};
