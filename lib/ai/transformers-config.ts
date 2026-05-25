export async function getTransformers() {
  const { pipeline, env } = await import("@xenova/transformers");

  env.allowLocalModels = false;
  env.useBrowserCache = false;
  env.cacheDir = "/tmp/transformers-cache";

  if (env.backends?.onnx) {
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.node = false;
  }

  return { pipeline, env };
}