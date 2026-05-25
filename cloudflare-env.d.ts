interface CloudflareAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

interface CloudflareEnv {
  AI: CloudflareAiBinding;
}
