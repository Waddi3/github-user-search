import { createHttpError, getRepos, getUser } from "../js/api.js";
import { ApiError } from "../js/errors.js";
import { assert, assertDeepEqual, assertEqual, assertRejects, test } from "./runner.js";

/**
 * Runs `fn` while the global fetch is replaced by `fakeFetch`, then puts the real one back.
 * No test ever touches the network, so the tests are fast, free and always give the same result.
 */
async function withFakeFetch(fakeFetch, fn) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = fakeFetch;

  try {
    await fn();
  } finally {
    globalThis.fetch = realFetch; // always restored, even when the test fails
  }
}

const jsonResponse = (body, init = {}) => new Response(JSON.stringify(body), { status: 200, ...init });

// createHttpError: which kind for which status
const httpCases = [
  [{ status: 404, username: "xyz" }, "not-found"],
  [{ status: 429 }, "rate-limit"],
  [{ status: 403, rateLimitRemaining: "0" }, "rate-limit"],
  [{ status: 403, rateLimitRemaining: "12" }, "forbidden"],
  [{ status: 403 }, "forbidden"],
  [{ status: 500 }, "server"],
  [{ status: 503 }, "server"],
  [{ status: 418 }, "http"],
  [{ status: 401 }, "http"],
];

for (const [input, expectedKind] of httpCases) {
  test(`createHttpError(${JSON.stringify(input)}) is "${expectedKind}"`, () => {
    const error = createHttpError(input);

    assert(error instanceof ApiError);
    assertEqual(error.kind, expectedKind);
  });
}

test("createHttpError keeps the username of a not-found error", () => {
  assertEqual(createHttpError({ status: 404, username: "xyz" }).username, "xyz");
});

test("createHttpError keeps the reset time of a rate-limit error", () => {
  assertEqual(createHttpError({ status: 429, rateLimitReset: "1791468614" }).resetSeconds, "1791468614");
});

// getUser
test("getUser returns the user and sends the expected request", async () => {
  const calls = [];

  await withFakeFetch(
    async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ login: "octocat", public_repos: 8 });
    },
    async () => {
      assertDeepEqual(await getUser("octocat"), { login: "octocat", public_repos: 8 });
    }
  );

  assertEqual(calls.length, 1);
  assertEqual(calls[0].url, "https://api.github.com/users/octocat");
  assertEqual(calls[0].options.headers.Accept, "application/vnd.github+json");
});

test("getUser encodes the username inside the URL", async () => {
  let requestedUrl;

  await withFakeFetch(
    async (url) => {
      requestedUrl = url;
      return jsonResponse({ login: "x" });
    },
    () => getUser("a/b?c")
  );

  assertEqual(requestedUrl, "https://api.github.com/users/a%2Fb%3Fc");
});

test("getUser rejects with a not-found error for a 404", async () => {
  await withFakeFetch(
    async () => jsonResponse({ message: "Not Found" }, { status: 404 }),
    async () => {
      const error = await assertRejects(getUser("xyz"));

      assert(error instanceof ApiError);
      assertEqual(error.kind, "not-found");
      assertEqual(error.username, "xyz");
    }
  );
});

test("getUser rejects with a rate-limit error and keeps the reset time", async () => {
  await withFakeFetch(
    async () =>
      new Response("{}", {
        status: 403,
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1791468614" },
      }),
    async () => {
      const error = await assertRejects(getUser("octocat"));

      assertEqual(error.kind, "rate-limit");
      assertEqual(error.resetSeconds, "1791468614");
    }
  );
});

test("getUser rejects with a network error when fetch itself fails, keeping the cause", async () => {
  const failure = new TypeError("Failed to fetch");

  await withFakeFetch(
    () => Promise.reject(failure),
    async () => {
      const error = await assertRejects(getUser("octocat"));

      assertEqual(error.kind, "network");
      assertEqual(error.cause, failure);
    }
  );
});

test("getUser rejects with unexpected-response when the body is not valid JSON", async () => {
  await withFakeFetch(
    async () => new Response("this is not json", { status: 200 }),
    async () => {
      assertEqual((await assertRejects(getUser("octocat"))).kind, "unexpected-response");
    }
  );
});

test("getUser rejects with unexpected-response when the user has no login", async () => {
  await withFakeFetch(
    async () => jsonResponse({ id: 1 }),
    async () => {
      assertEqual((await assertRejects(getUser("octocat"))).kind, "unexpected-response");
    }
  );
});

// getRepos
test("getRepos asks for 100 repositories sorted by update time and returns them", async () => {
  let requestedUrl;
  const repos = [{ name: "a" }, { name: "b" }];

  await withFakeFetch(
    async (url) => {
      requestedUrl = url;
      return jsonResponse(repos);
    },
    async () => {
      assertDeepEqual(await getRepos("octocat"), repos);
    }
  );

  assertEqual(requestedUrl, "https://api.github.com/users/octocat/repos?per_page=100&sort=updated");
});

test("getRepos accepts a user with no repositories", async () => {
  await withFakeFetch(
    async () => jsonResponse([]),
    async () => {
      assertDeepEqual(await getRepos("octocat"), []);
    }
  );
});

test("getRepos rejects when the body is not an array", async () => {
  await withFakeFetch(
    async () => jsonResponse({ message: "surprise" }),
    async () => {
      assertEqual((await assertRejects(getRepos("octocat"))).kind, "unexpected-response");
    }
  );
});

test("getRepos rejects when an item has no name", async () => {
  await withFakeFetch(
    async () => jsonResponse([{ name: "ok" }, { id: 2 }]),
    async () => {
      assertEqual((await assertRejects(getRepos("octocat"))).kind, "unexpected-response");
    }
  );
});