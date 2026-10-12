# Sonnet native-context reconciliation — 2026-10-12

Preparation only; no new PR, reopening, model call or acceptance claim.
Current main 0d12f6a11 is the base of the isolated
codex/sonnet-context-1213-20261012 branch. Existing4ddc2cc43 preparation and
all older failure receipts remain unchanged.

Actual authored cherry-picks: original179257b9 (prior0249a80d) →48041dd0,
original553fd5c3 (priore1a6220e) →f9263e0a. robertn702 author/email and both
2026-10-01 authored dates are preserved. Separate maintainer corrections
are db5782ba→314ca6fd and8ae40f6f→61a9e31e. The latter omits the obsolete
source-extraction test that depends on a frozen earlier server layout; direct
production-function and mocked HTTP controls cover the current behavior.

Conflicts retain the landed Haiku5.5 native window and dynamic modelReplayBudget
factory across all seven current replay paths. Current executionMessages
safeguards remain. No raw allMessages replay is restored.

The first reconciliation helper had an overbroad conflict-marker regular
expression; diff-stat review detected unintended deletions before any testing
or push. The entire owned cherry-pick sequence was aborted and replayed with
bounded marker matching. The discarded local commit is not in this branch.

Initial focused run:235 pass/1 fail. The SDK explicit1M-disable flag still
advertised newly landed Haiku5.5 at1M; existing all-model opt-out assertion
caught it. Corrected source 97cb7ee5a173586a200749fcd6aee51022db16d9 caps that opt-out at200k while keeping
normal Haiku5.5 at1M and legacy Haiku pins unchanged. Corrected focused236,
health12, replay41 and plugin36 all pass (325 total); standalone typecheck
passes. Exact logs retained. Full local and current live gates remain.

Official model-config docs checked2026-10-12:
https://code.claude.com/docs/en/model-config#extended-context
Supported Sonnet5/5.5 has native1M; legacy Sonnet4.6 remains a separate paid
extended variant. The explicit SDK disable flag constrains native windows.
These docs support policy; they do not replace actual affected-client proof.

An existing node:24.20.0-bookworm-slim image (230MB) is linux/amd64,
sha256:59c575db86dccc264e6b71c316548f05a5c3c7a9aa1c112dc019807e651fd06b.
A read-only, network-disabled, no-capability disposable container reports
linux/x64 Node24.20.0 and exits0. No image pull/build, credentials or model
call. This confirms a candidate host runtime, not SDK/client qualification.

The old live harness is now explicitly disabled before its body runs. Its
full credential copy, process-ownership/cleanup gaps and discarded diagnostics
must not be reused. Preserve the prior successful large native query followed
by client400 and relay cleanup failure. A new bounded flow must verify actual
OpenCode2.0.16 client plugin + independently installed server scrub, access-only
grant, original actors/pipes/listeners, baseline/candidate/tool/resume behavior,
actual served Sonnet5.5 via supported SDK history, and exact failed-response
facts. Do not read private SDK files, refresh auth or enable Extra Usage.


Full local original64052 completed with exit0 at frozen
4950f6211705c0f4e506e908c78ea9b5a8057877: 5767 pass /35 skip /0 fail
across23 groups, followed by standalone typecheck and build. No source edits
occurred during that run. Current live acceptance is still incomplete.

Replacement offline harness uses actual Linux/x64 Node24.20.0,
OpenCode2.0.16, SDK0.2.141, native Claude2.1.296 and server scrub0.2.3.
Its initial slim-image startup failed due to absent machine identity. A task-owned
random machine-id mounted read-only resolved that prerequisite without bypassing
the strict identity guard or copying the host identity. Original77328 is terminal
and its --rm container is absent. The next offline result failed its expected
single SDK-fence assertion:11 requests reached the fence, all blocked before
inference, with11 successful scrub invocations and0 hook errors. The generic
Error text was classified api_error and the actual client retried; this is a
harness error, not evidence of Sonnet product failure. All original actors and
readable pipes joined. No credentials or model calls were used. Retained JSON
contains only synthetic fixture metadata. Live qualification remains open.

The synthetic overflow fence removed client retries but activated Meridian's
bounded fresh-replay overflow recovery (three intercepted queries with7,3,1
historical messages). Original54612 exited1 with0 actual model entries and
all actors/pipes joined. This expected recovery is not an acceptable single-entry
qualification fence; its failed receipt is retained.

The corrected synthetic unsupported-CLI-model fence is classified400 without
activating overflow recovery. Original29829 exited0/OFFLINE_PASS: exactly one
actual client request, one fenced SDK interception,0 inference entries, verified
client attestation and scrub invocation, and all original actors/pipes joined.
The unsupported-model error was deliberately generated by the harness; it does
not claim that the real pinned CLI lacks Sonnet support. Docker network was
none and no credentials were staged. Exact identity hashes are in the receipt.
This qualifies baseline plugin routing/admission only. Candidate/package,
supported SDK history, failure diagnostics and live lifecycle qualification
remain required before the bounded live round.


## Installed Linux candidate and current live availability

Current source through f2e9aad2 has unchanged production/unit-test blobs from
fully tested4950f621. An independently packed and npm-installed candidate
uses the existing Linux/x64 Node24.20.0 container (no image build/pull),
OpenCode2.0.16, SDK0.2.141, native CLI2.1.296 and scrub0.2.3. Package integrity
is recorded in candidate-package.json. Public dependencies only; no install
scripts were run.

Final offline originals43568 baseline and50433 candidate both exit0. Baseline
advertises200k and forwards7/14 fixture messages with omission; candidate
advertises1M and forwards14/14 without omission. Each uses the actual client
plugin attestation, one fenced SDK interception and verified server scrub;
zero model entries, all original actors/readable EOFs joined. The harness now
checks the exact profile config directory for supported getSessionMessages,
retains structured error tags and response status/closure, records progress,
and checks supported SDK history and its preserved prefix for the future live
round. The committed scripts/e2e-sonnet-context-qualified.mjs is the exact
qualified harness (renaming the file does not change its content hash).

Read-only supported default-store readiness then returned no access token on
two stable reads. Diagnosed repeat confirms available=false; each original
Keychain child and pipes joined. No access grant was staged, no refresh/login,
account switch or usage setting change occurred, and no model call was made.
Do not treat the offline native-window proof as actual served-model acceptance.
Resume the bounded baseline1/candidate3 SDK-entry live round only after a valid
existing access-only grant is available and its same-account subscription-only
readiness is established. Candidate source/package E41/E42 and final-head CI
remain acceptance gates. Prior original Linux Sonnet large-query success followed
by client400 remains unresolved.
