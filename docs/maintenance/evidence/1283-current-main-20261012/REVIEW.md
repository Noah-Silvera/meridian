# MCP tool-loss fix: current-main incorporation

Disposition: accept with maintainer harness corrections; live acceptance pending.
Source #1283 remains `571a671676d6b8604cde932199d77c34bc6a46f3`, authored by
Nowaker <spam@nowaker.net>, 2026-10-04T05:57:11Z. Actual authored cherry-pick
`158e6c18d` preserves Author/AuthorDate on main `ab615ca70`. No contributor
comments/reviews or later commits were present at refresh.

Each SDK query needs a fresh single-connection MCP server. The cache must retain
tool definitions, ordering, names, schemas and therefore prompt-cache inputs,
without sharing the transport-bearing server. The three product files implement
exactly that. Inspected current callers, cache-key invalidation, custom namespace,
deferred tools, query options, retries and isolation. No public plugin interface
changes or broader session/store corrections are included.

The historical preparation had 28 commits and 97 changed files. This fresh
integration preserves the actual source commit and separately recovers only the
fixture harness/helper and two relevant tests from prior maintainer corrections
`2df7df666`/`1d67249b8`. It does not discard the old branch or claim its other work
was completed. The recovered harness joins native children and SDK iterators,
closes the listener, seals the final captured catalog, checks iterator/close
faults and retains failed controls before removing only joined owned sandboxes.

## Evidence

The unmodified source tests fail before incorporation because current main lacks
the factory API; that alone is not behavioral reproduction. The **real SDK/native
CLI loopback overlap probe** supplies the distinguishing behavioral evidence:

- Main-equivalent `5ddc7ed9` (same tree as `ab615ca70`) sends the second overlapping
  query without its tools: MCP initialization fails and final catalog validation
  fails. Both iterators still return success, illustrating why text/result-only
  success is inadequate.
- Candidate connects both queries and preserves the entire catalog while the
  first query remains open.
- Deliberately sharing the candidate server restores the same failure.
- Cancellation succeeds; pre-request failure, init timeout and uncooperative
  child controls fail as intended. Every case joins children, iterators and
  listener and removes only its owned sandbox. Their exit-one results remain
  recorded as failures, not rewritten as successful model runs.

All seven JSON receipts and matrix are adjacent. These October 12 runs use
Darwin ARM64, the actual SDK/native CLI, and a credentialless local responder.
They are not Linux, live model or OpenCode acceptance. No plugins are claimed for
this direct SDK fixture; actual OpenCode must separately load matching client
plugin AND server scrub before any inference.

Focused source/query/cache tests: 103 pass. Recovered fixture and real SDK
controls: 17 pass, 100 assertions. Typecheck passes. Standalone build passes. Full npm test (CI Bun 1.3.11)
is running. The existing historical Linux matrix is reference only.
Required gates remain actual Linux/OpenCode/Opus history/tool/retry/followup,
four E41 modes, relevant V2 E42, independently installed package and final-head CI.
The final streaming run on #1344 returned OAuth-token-revoked; no further model
attempt or credential refresh is part of this incorporation. Source stays open.


## Full-suite first-run failure retained

The first full npm test stopped after its primary process: 5,229 pass, 35 skip,
one failure in the unchanged build-observer Node bundle test. Bun reported
EISDIR while reading zod/index.js in the shared dependency directory. A focused
rerun passed 4/4; that alone does not establish causality or a fixed regression.
The worktree's dependency symlink was removed and replaced with its own
`bun install --frozen-lockfile` using CI Bun 1.3.11, and a complete npm test is
running again. An attempted npm ci correctly refused main's stale npm lock
(native package 2.1.284 versus declared 2.1.296); it made no source/lock change.
CI uses the Bun lock. Preserve the first failure and do not claim a full green
gate until the independent-install full run terminates successfully.
