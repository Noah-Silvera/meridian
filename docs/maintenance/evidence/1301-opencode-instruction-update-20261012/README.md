# Actual OpenCode instruction update — 2026-10-12

Actual OpenCode 2.0.21 on Darwin ARM64, Node host, independently installed
Meridian packages, Agent SDK0.2.141 and native Claude2.1.296. Primary actual model
Haiku5.5 was verified through supported getSessionMessages. Client V2 plugin
SHA256 d8fd970f561a05a1d2716f7a118ec7e59e44d1942b25a1edca263a00cc779b56
is identical in both packages. Server scrub0.2.3 is independently installed,
active before inference and invoked without errors. Package identities adjacent.
Baseline is clean5498892b (tree verified equal merged506a811d); candidate package
is cleanb08b40bf. Later harness changes do not change either installed runtime.

The actual client writes an owned AGENTS.md and emits
user -> assistant[thinking,tool_use] -> user[tool_result] -> system[text].
Baseline records continuation with isResume=false. Candidate records continuation
with isResume=true, completes the real read/result loop and a same-session
follow-up. Candidate original process36496 exits0/PASS; all original subprocess
exit/close and stdout/stderr-close witnesses join, then the access-only grant is
deleted. No refresh token is copied; supported source is read twice unchanged.
Readiness showed included capacity and Extra Usage disabled.

Baseline original80305 exits1 on an over-broad model assertion that included
the detached Haiku4.5 title session. The baseline checkpoint assertion itself
passes (isResume=false). Supported SDK inspection of the exact instruction-update
session independently confirms Haiku5.5. baseline-qualified-report preserves
that post-run check and original failure; no successful rerun is invented.
Candidate scopes model validation to the actual primary request IDs.

Retained setup/harness findings:
- Meridian setup rejects2.0.21; only2.0.16 and pinned betas are qualified. The
  diagnostic manually configures exactly one installed V2 plugin in its owned
  fixture. This is actual-client evidence, not a setup/E42 acceptance pass.
- An early inherited-PWD run edited AGENTS.md in the isolated review worktree,
  not the owner checkout. That edit was restored immediately. The harness now
  sets cwd/PWD/INIT_CWD to the canonical owned project and rejects a mismatched
  primary request before inference.
- An initial fixture key used an invalid length. Corrected to32 random bytes
  encoded base64url. Ambient client environment was then removed; only fixture
  HOME/XDG/PATH/config/key settings are passed. The earlier unsigned-request
  observations are retained and are not claimed as a product fix.
- Initial human turn must be signed. Tool-result continuations in this live
  instruction-change flow lack that signature, but carry the installed plugin's
  same session/agent identity. They are admitted only into the already signed
  owned session; flags are retained. This is not priority-routing qualification.
- Credentialless exact-host controls show the installed V2 hook can sign primary
  requests, including a scripted tool round; actual source/runtime surfaces must
  be tested rather than inferred from a missing header.

Reproduce with the committed scripts/e2e-opencode-instruction-update.mjs:
E2E_ALLOW_LIVE_MODEL=1, E2E_EXPECT=baseline|candidate, E2E_MODEL=claude-haiku-5-5,
E2E_LIVE_PROFILE_FILE pointing to a private access-only OAuth profile array,
E2E_OPENCODE_BIN to @opencode/cli2.0.21, E2E_MERIDIAN_ROOT to the installed
package, E2E_PLUGIN_PATH to installed server scrub, and E2E_NATIVE_BIN to the
qualified native CLI. Run with native Node. Keep grant until report.joined=true.
The harness is isolated; never point its project at customer files.

Acceptance remains open: qualified setup/host coverage, all four E41 modes,
relevant E42, full final local/CI gates and final adversarial review. No merge,
source closure or release is claimed. Reporter specified haiku without an exact
served version; this independent proof explicitly covers Haiku5.5.
