// A tiny test runner: register tests with test(), then run them all with run().
// It works in the browser (tests/index.html) and in Node (node tests/run-all.js).

const registeredTests = [];

/**
 * Registers a test. `fn` may be async. A test passes when it finishes without throwing.
 * @param {string} name - describe the behaviour, not the implementation
 * @param {() => void | Promise<void>} fn
 */
export function test(name, fn) {
  registeredTests.push({ name, fn });
}

/** The error thrown by a failed assertion. */
export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

/** Shows a value in a failure message ("undefined" would otherwise disappear in JSON). */
function show(value) {
  return value === undefined ? "undefined" : JSON.stringify(value);
}

/**
 * Recursive comparison of objects and arrays by their contents.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function isDeepEqual(a, b) {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return keysA.every((key) => Object.hasOwn(b, key) && isDeepEqual(a[key], b[key]));
}

/** Fails unless `condition` is truthy. */
export function assert(condition, message = "Expected the condition to be true") {
  if (!condition) {
    throw new AssertionError(message);
  }
}

/** Fails unless the two values are identical (same as Object.is). */
export function assertEqual(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(message ?? `Expected ${show(expected)} but got ${show(actual)}`);
  }
}

/** Fails unless the two objects/arrays have the same contents. */
export function assertDeepEqual(actual, expected, message) {
  if (!isDeepEqual(actual, expected)) {
    throw new AssertionError(message ?? `Expected ${show(expected)} but got ${show(actual)}`);
  }
}

/**
 * Fails unless the promise rejects. Returns the rejection reason for further checks.
 * @param {Promise<unknown>} promise
 * @returns {Promise<any>}
 */
export async function assertRejects(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new AssertionError("Expected the promise to reject, but it fulfilled");
}

/** Prints the results in the Console and, in the browser, on the page. */
function report(results) {
  const failed = results.filter((result) => !result.passed);
  const summary = `${results.length - failed.length} passed, ${failed.length} failed`;

  for (const result of results) {
    if (result.passed) {
      console.log(`PASS ${result.name}`);
    } else {
      console.error(`FAIL ${result.name}\n     ${result.error.message}`);
    }
  }
  console.log(summary);

  const list = globalThis.document?.getElementById("results");
  const summaryElement = globalThis.document?.getElementById("summary");

  if (list && summaryElement) {
    summaryElement.textContent = summary;
    list.replaceChildren(
      ...results.map((result) => {
        const item = document.createElement("li");
        item.className = result.passed ? "pass" : "fail";
        item.textContent = `${result.passed ? "PASS" : "FAIL"}  ${result.name}`;

        if (!result.passed) {
          const detail = document.createElement("pre");
          detail.textContent = result.error.message;
          item.append(detail);
        }

        return item;
      })
    );
  }

  if (failed.length > 0 && globalThis.process) {
    process.exitCode = 1; // lets a shell (or CI) know that something failed
  }
}

/**
 * Runs every registered test, one after the other, and reports the results.
 * Sequential on purpose: some tests replace global functions (like fetch).
 * @returns {Promise<{ name: string, passed: boolean, error?: Error }[]>}
 */
export async function run() {
  const results = [];

  for (const { name, fn } of registeredTests) {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error });
    }
  }

  report(results);
  return results;
}