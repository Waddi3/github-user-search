// Importing a test file registers its tests (the modules run first, in order).
// Then run() executes them all.
import "./format.test.js";
import "./validation.test.js";
import "./repositories.test.js";
import "./errors.test.js";
import "./api.test.js";
import { run } from "./runner.js";

await run();