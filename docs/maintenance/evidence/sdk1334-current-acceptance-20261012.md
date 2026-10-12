# SDK close acceptance refresh — 2026-10-12

Current main506a811d3 was used for a new isolated branch
codex/sdk-close-acceptance-1334-20261012 in the matching Meridian worktree.
The older prepared95cc52ea3 worktree is preserved unchanged. No new PR or
remote update for #1334 has occurred; existing draft head10f4132a remains held.

Authored incorporation: e0cb85463 -> 991d7a92; ea868971 -> b748e948
(intentionally empty: current handoff already supersedes those facts);
10f4132a -> d227b905; prepared maintainer correctionffc1285d -> cd4fe8557.
All are actual cherry-picks preserving author/date. E2E.md conflict retained
both current MCP proof and the SDK native-gate section. Handoff conflicts keep
current-main evidence instead of replacing it with historical pending work.

Frozen Bun dependency install, 11 targeted process-gate tests and standalone
typecheck pass (original96099 exit0). No model/SDK acceptance call was made.
An initial npm ci failed because current-main package-lock pins2.1.284 below
the manifest's ^2.1.293 floor. A separate focused lockfile correction is being
validated; no dependency mutation was hidden inside this process fix.

The old prepared live harness pins legacy Haiku4.5 and lacks the required
server scrub preflight. Do not run it unchanged or infer permission to disable
current Haiku5.5. Reuse/adapt the current plugin-qualified Pi path, preserving
original actor/pipe and publication custody, with source/independently installed
acceptance. Retain the old strict credential-fence preparation as historical
proof; inspect and qualify any current native boundary before inference.

Remaining: genuine current SDK/client/model healthy-flow acceptance, native
before/after on current corrected code, full local gates, exact-head CI,
adversarial review and same-PR delivery. #1326's original Linux-x64/OpenCode/
Opus OAuth hang remains independently unproven and must not be closed.
