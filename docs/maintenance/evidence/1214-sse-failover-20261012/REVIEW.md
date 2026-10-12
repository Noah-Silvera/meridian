# SSE failover review — 2026-10-12

Disposition: accept with maintainer corrections, verification pending. Keep source
[#1214](https://github.com/rynfar/meridian/pull/1214) open until live acceptance and
final-head CI pass. Source `1c8f17099ad62dbd2a511f69c12e5b4e15d9da7f`, no comments
or reviews at refresh. Base current main `3f5f4f81cd2205ebd62381d8c574d6a6f9ded2d9`.

Authored cherry-picks retain Aleksey Proshutinskiy <alexey.prosh@fluence.one>
and original AuthorDate:

- `d4e36fa90a3ecfbcb48c91c8c4023224b1386f32` → `623cf1de2`
- `1c8f17099ad62dbd2a511f69c12e5b4e15d9da7f` → `eb000767c`

The feature fits priority routing: content-free keepalives must not commit an
account, but exposed model content/tools must never replay on another account.
The contribution preserves pre-stream HTTP statuses, classifies failures after
headers as SSE errors, and joins a suppressed attempt before retry selection.
The outer completion map separately joins final cleanup; ReadableStream.cancel
itself is not evidence that the SDK process has exited. Real-process proof remains.

Reproduction on clean main with the exact contributor HTTP test: a 16-second
billing refusal behind the service heartbeat returns billing_error to the client,
never the fallback response (0 pass /1 fail). Same test on incorporated candidate:
1 pass /0 fail; fallback exactly once, suppressed error absent. These are mocked
SDK HTTP integration facts, not real account or client acceptance.

Adversarial finding: the new non-SSE fallback inspection accumulated an unbounded
body. A 256-KiB account-shaped JSON regression control fails on authored source
(36 pass /1 fail). Maintainer correction stops at 64 KiB, joins reader cancellation,
and emits api_error without treating the oversized response as replay permission.
All 37 relay controls now pass, including exact bytes, UTF-8 fragmentation,
backpressure, cancellation, header hints and no replay after content. Typecheck
passes. Full npm test/typecheck/build is running; do not claim completion yet.

Harness finding: contributor installed-package probe defaulted to live Claude Max
without mandatory matching client-plugin/server-scrub preflights. Live mode now
fails before profiles, servers or SDK queries. The credentialless transport mode
is retained, explicitly labelled as such. No model calls, account switches,
credential refresh or Extra Usage changes occurred during this review.

Remaining: finish full local checks and independently installed fixture gate;
implement qualified affected-client/model live proof without deliberately
incurring paid usage; all four E41 modes for routing/session continuity; final
adversarial review, source/base/head recheck and CI before merge. Streaming #1344
is still a separate integration; revalidate if it lands. No release authorization
is implied. Sanitized failing/passing verdicts are adjacent; executable regressions
are committed in src/__tests__ and the fixture harness in scripts/.

## Qualified probe implementation (not yet executed live)

The installed-package probe now has opt-in live answering-leg support with
mandatory installed V1 client-hook and server-scrub preflights before reading
an access-only grant. It verifies request hooks and joins original children/pipes,
writing a durable-ready report in its owned directory. Three credentialless
negative preflight controls reject missing opt-in, grant and plugins before setup.
This implementation has not established live acceptance yet. The refused leg
remains local; the host is explicitly a protocol fixture, not OpenCode itself.
No account spending or model call occurred in implementing these checks.
