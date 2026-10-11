# #1310: historical image feedback correction — held preparation

## Accepted correction scope, not accepted delivery

[Oded Falik (@odfalik)'s report](https://github.com/rynfar/meridian/issues/1310)
identifies a structural fresh-replay feedback loop: historical images reach the
SDK repeatedly, model attachment reads become image-bearing client results, and
subsequent fresh replay multiplies those copies. This is distinct from #1156's
historical-media attribution, which remains intact.

The correction keeps one visual copy of each exact plain canonical base64
historical image payload/MIME pair and places a numbered textual reference at
every omitted historical position. Original surrounding text, result identity,
success/error status, current-turn boundary and original-history media counts
remain. Distinct payloads/MIME interpretations remain distinct. All current-turn
images remain, even if they duplicate history or each other. Native checkpoint
wrappers and ordinary resume deltas do not use the deduplication path.

Identity is local to one `frameStructuredReplay` call. There is no global media
cache, session/transcript rewrite, disk/network I/O, image transformation or
server orchestration change. URLs are not byte identity; noncanonical/malformed
base64 and opaque block/source fields remain unchanged for SDK validation.
This is deliberately conservative, not an attempt to deduplicate arbitrary
URL/downloaded/transformed media. Cache controls are already stripped by the
existing fresh-replay callers.

Baseline main: `e68b9bcadd7597d16724a3655b7322cd02a965ad`.
Core correction/tests: `2469e9477331e000e20b7bf7a7201f0ce2a742b4`.
**Do not merge or close #1310 on this preparation's evidence.** Actual live
Pi/Meridian/SDK/model materialization, read-back and adjacency gates remain.

## Discriminating direct and HTTP controls

The exact new tests were copied into an unchanged-main archive:

- `src/__tests__/replay.test.ts`: baseline **15 pass / 3 fail**; candidate
  **18 pass / 0 fail**. The feedback count changes from **1,2,4** to **1,1,1**.
- `src/__tests__/proxy-image-replay-dedup.test.ts`: baseline **0 pass / 4 fail**;
  candidate **4 pass / 0 fail**. Both streaming modes and both text-only/current
  media arms exercise production HTTP framing and inspect the one SDK input.
- Controls preserve distinct history, exact result identity/error flags,
  historical/current provenance, current duplicate images, source immutability,
  request-local identity, malformed/opaque/URL/document/file traffic and native
  wrapper/delta paths.

HTTP tests use the mocked SDK and synthetic bytes. They do **not** prove actual
image decoding, materialization, model read-back or native-client acceptance.
At core head `2469e947`, full `npm test` is **5,583 pass / 0 fail / 35 skip**,
21 process-isolated invocations; pretest and standalone typecheck/build pass.

## Actual Pi capture, precisely qualified

Escrow: `scripts/e2e-pi-image-feedback.mjs`. Actual
`@earendil-works/pi-coding-agent` **1.1.0**, Bun **1.3.14**, Darwin arm64.
The script imports public Pi SDK/controller/read APIs, uses empty owned Pi auth
and explicit loopback model configuration, disables retries/compaction/cache
warming and resource discovery, and never discovers user extensions or history.

A scripted loopback Anthropic SSE endpoint instructs the **actual Pi controller**
to read exact owned PNG paths. Actual Pi `read` returns image content, persists
three results, and public `SessionManager.open()` restores it unchanged. Actual
client wire contains historical A counts **1,2,4** across text-only current
turns. The production pure replay module fed those captured requests emits
**1,1,1** after the correction, alongside one distinct historical image.
Actual Pi current-image controls preserve same-byte, different-byte and two
identical current attachments.

The endpoint's materialization is **scripted owned fixture materialization**,
not real SDK attachment files. Applying production pure functions to the wire
is not a substitute for running the full Meridian HTTP/SDK path. No native
Claude CLI, SDK query or provider inference ran in these capture arms.

Three parent-run arms use the identical harness against exact pinned baseline
or corrected source:

1. Candidate gate: PASS, framed **1,1,1**.
2. Identical candidate assertion on baseline: FAIL, expected 1 but observed 2
   historical copies on the second replay. This is the meaningful negative arm.
3. `E2E_EXPECT=baseline`: PASS while characterizing **1,2,4**. That zero exit
   is explicitly **not acceptance** of baseline behavior.

[Sanitized immutable capture receipts](1310-historical-image-feedback.json)
retain exact source/harness hashes, runtime/client identity, actual read and
persistence witnesses, both before/after results and their missing gates. Only
owned synthetic fixture metadata is recorded; no images, model prose, OAuth
values or customer history are included.

```sh
E2E_PI_PACKAGE=/absolute/path/to/@earendil-works/pi-coding-agent \
E2E_PI_VERSION=1.1.0 \
bun scripts/e2e-pi-image-feedback.mjs

# Same candidate assertion must fail against an unchanged-main archive.
E2E_MERIDIAN_ROOT=/absolute/path/to/exact-e68b9bcadd-archive \
E2E_PI_PACKAGE=/absolute/path/to/@earendil-works/pi-coding-agent \
E2E_PI_VERSION=1.1.0 \
bun scripts/e2e-pi-image-feedback.mjs
```

## Escrowed live mode and remaining acceptance

The script header documents opt-in `--live`, requiring
`E2E_ALLOW_LIVE_MODEL=1`, an explicitly authorized private supported token
profile file, an explicit native Claude executable and explicit Pi package
identity. It forwards actual Pi through a recording loopback relay to production
Meridian and the original SDK query. It uses supported `getSessionMessages`,
actual adapter/lineage/model facts and exact owned source history; source or an
installed Meridian package can be selected. It intends three fresh structural
arms plus one ordinary-resume control, capped at four SDK requests.

Parent hardened the escrow's cleanup observer: production's exact original
`ChildProcess` and both captured pipes must actually close; `query.close()` or
`exitCode` is not a sufficient witness. Failed/unknown cleanup retains all owned
artifacts and reports failure. The native version child is hard-killed on its
owned timeout. Capture reports `liveStructuralAcceptance=false` and
`issueAcceptance=false`; live structural success still cannot claim whole-issue
acceptance. **Live mode and its native observer have not been executed.**

Live arms deliberately disable tools, so even a future structural pass cannot
prove real-model attachment read-back or native checkpoint behavior. Finish
actual materialization/read-back, native checkpoint and ordinary-resume/source-
history controls; run applicable E65/E41 and installed-package checks. Reporter
supplied no exact model/platform tuple, so retain explicit tested identities and
do not invent one. The last observed weekly quota was exhausted; no generation
retry, alternate account, paid usage or auth refresh was attempted here.

Independent adversarial review and final-head CI remain mandatory before any
accepted delivery. Keep #1310 open, every older hold intact, and do not confuse
this newly implemented preparation with backlog exhaustion.
