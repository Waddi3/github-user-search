// Importing a test file registers its tests (the modules run first, in order).
// Then run() executes them all.
import "./format.test.js";
import { run } from "./runner.js";
import "./validation.test.js";

await run();