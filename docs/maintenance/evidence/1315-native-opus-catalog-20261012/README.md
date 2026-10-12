# Native Opus/Fable catalog — issue #1315

Current-main correction based on b68710f057a3bbdb4e01d650c0bd94b62247eea7.
This is a new maintainer fix, not a replay of contributor code. The reporter
identified the model-specific distinction; no Pro membership is added to the
legacy extended-context eligibility list.

Product behavior: /v1/models advertises Opus4.7/4.8/5/5.5 and Fable5/5.1 at
1M regardless of the legacy Opus4.6 subscription gate. Opus4.6 retains that
gate. The effective CLAUDE_CODE_DISABLE_1M_CONTEXT=1 caps every advertised
window at200k, including Haiku5.5's existing native window. This opt-out matches
the interface already prepared in the separate Sonnet #1213 branch. Sonnet's
native-window/replay correction remains there; reconcile the overlapping catalog
and HTTP-test changes when either branch lands.

Primary policy checked2026-10-12:
https://code.claude.com/docs/en/model-config#extended-context
The current docs distinguish native windows from Opus4.6/Sonnet4.6 [1m]
variants, and describe the SDK global disable flag. A native window is a model
capability; Fable access can still require usage credits depending on the plan.
This fix changes catalog values and does not grant provider entitlement.

Regression evidence on unchanged production before correction:
- Pure catalog118 pass/4 fail; HTTP catalog10 pass/2 fail.
- Corrected pure catalog122 pass/0 fail; HTTP catalog12 pass/0 fail.
- Standalone typecheck passes. Logs are adjacent.

The tests exercise actual buildModelList and production /v1/models HTTP handling,
with a mocked Pro auth result, all supported native Opus/Fable entries, legacy
Opus4.6 negative control, existing thinking capabilities and SDK opt-out on
both native and tier-included windows. No model call or credential access.

Adversarial review: retain current model IDs, capabilities and creation timestamp;
leave model routing/explicit version pins and legacy entitlement classification
intact; keep the catalog builder pure and pass the effective SDK override from
the route. Existing default Haiku5.5 stays1M and its explicit SDK opt-out now
advertises200k. Missing proof is not replaced by the mocked Pro auth result.

Remaining gates: full npm test/typecheck/build, final-head CI, independently
installed actual macOS Codex/opencodex client catalog adoption and affected
Opus/Pro flow with required plugin qualification, plus supported served-model
history evidence. The supported default store presently has no access token;
no refresh, account switch, paid usage, or model inference is authorized as a
workaround. Issue#1315 stays open and this remains preparation until the actual
client/model acceptance is established.
