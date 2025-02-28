export function validateOllamaConfig(): void {
    const requiredEnvVars = ['OLLAMA_URL'];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  
    try {
      new URL(process.env.OLLAMA_URL!);
    } catch (error) {
      throw new Error(`Invalid OLLAMA_URL: ${process.env.OLLAMA_URL}`);
    }
  }