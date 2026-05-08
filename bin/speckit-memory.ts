#!/usr/bin/env node
import { runCli } from "../src/cli/run";

runCli(process.argv).catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
