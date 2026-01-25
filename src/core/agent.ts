import type { Hooks } from "@opencode-ai/plugin";

type AgentConfig = NonNullable<
  NonNullable<Parameters<NonNullable<Hooks["config"]>>[number]["agent"]>[string]
>;

export abstract class Agent {
  abstract readonly description: AgentConfig["description"];
  abstract readonly mode: AgentConfig["mode"];
  abstract readonly name: string;
  abstract readonly prompt: AgentConfig["prompt"];

  get config(): AgentConfig {
    return {
      description: this.description,
      mode: this.mode,
      prompt: this.prompt,
    };
  }
}
