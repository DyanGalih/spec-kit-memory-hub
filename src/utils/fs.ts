import { promises as fs } from "fs";
import path from "path";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(targetPath: string): Promise<string> {
  return fs.readFile(targetPath, "utf8");
}

export async function writeTextFile(targetPath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
}

export async function removePath(targetPath: string): Promise<void> {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export async function listDirectoryFiles(targetPath: string): Promise<string[]> {
  return fs.readdir(targetPath);
}
