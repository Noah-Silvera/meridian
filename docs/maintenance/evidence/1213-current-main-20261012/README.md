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
