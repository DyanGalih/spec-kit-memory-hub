import fs from "fs";
import path from "path";

/**
 * Finds the project root by searching for the Spec Kit Memory Hub configuration file.
 * It starts from the startDir and moves up until it finds .specify/extensions/memory-md/config.yml.
 * If not found, it returns the startDir as a fallback.
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);
  
  // Safety check: if we are already in a directory that has the config, return it.
  const configPath = path.join(current, ".specify", "extensions", "memory-md", "config.yml");
  if (fs.existsSync(configPath)) {
    return current;
  }

  // Search upwards
  while (current !== path.parse(current).root) {
    const parent = path.dirname(current);
    const parentConfigPath = path.join(parent, ".specify", "extensions", "memory-md", "config.yml");
    if (fs.existsSync(parentConfigPath)) {
      return parent;
    }
    current = parent;
  }

  return startDir;
}
