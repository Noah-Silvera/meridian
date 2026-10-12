# Backlog priorities — 2026-10-12

Refreshed after MCP #1349 merged. Coverage: all paginated open issues/PRs in
six accessible owner-managed repositories, discovered through authenticated
repository permissions. Meridian has 30 PRs and 21 issues; OpenCode scrub has
five PRs and one issue; Pi scrub has one PR. HUD, Hermes and OpenClaw scrub have
no open items. Total: 36 PRs and 22 issues. These counts include delivery/source
PR pairs and release PRs; they are not 58 independent fixes.

This is the working priority report, not a claim that every remaining diff has
passed review. Fixes with direct user cost, lost work or broken requests lead.

| Order | Tickets | Why this matters | Disposition / next evidence |
| --- | --- | --- | --- |
| 1 | [#1338](https://github.com/rynfar/meridian/issues/1338), delivery [#1347](https://github.com/rynfar/meridian/pull/1347) | Priority routing can keep spending paid overage while included capacity remains elsewhere. | Fix prepared; preserve explicit pins and same-turn identity. Complete qualified account-routing evidence without deliberately incurring paid usage. |
| 2 | [#1294](https://github.com/rynfar/meridian/pull/1294), delivery [#1344](https://github.com/rynfar/meridian/pull/1344) | Healthy queued turns and long tool writes are killed as idle. | Integrated MCP main; combined-source four-mode E41 passes with both plugins. Earlier SSE refusal is retained and audited, without an established cause. Final combined installed-package long write/result/continuation passes; final-head CI remains. |
| 3 | OpenCode scrub [#21](https://github.com/rynfar/meridian-plugin-opencode-scrub/issues/21), [#22](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/22), [#23](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/23), delivery [#24](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/24) | Scrubbing can corrupt the client's working directory and send tools toward the wrong path. | Authored incorporation plus parser corrections prepared. 48 installed-package/parser cases pass; actual reported Windows/client qualification remains open. |
| 4 | [#1214](https://github.com/rynfar/meridian/pull/1214) | A keepalive can prematurely commit an exhausted account and defeat failover. | Worth incorporating after complete diff review; preserve no-replay-after-content and joined cancellation. Contributor fixture evidence is not live-account acceptance. |
| 5 | [#1310](https://github.com/rynfar/meridian/issues/1310) | Byte-identical historical images can multiply across fresh replay/read-back cycles, increasing attachments and usage. | Reproduce on current main, then deduplicate only historical exact payloads while retaining provenance and current-turn media. |
| 6 | [#1301](https://github.com/rynfar/meridian/pull/1301), [#1201](https://github.com/rynfar/meridian/pull/1201) | Settled tool checkpoints can be lost when client history includes trailing instruction or per-call result shapes. | Review against current checkpoint behavior and preserve full history/cache gates. Do not merge merely because unit fixtures pass. |
| 7 | [#1334](https://github.com/rynfar/meridian/pull/1334), [#1303](https://github.com/rynfar/meridian/issues/1303) | Process cleanup and broad store rewrites can hold up or destabilize concurrent work. | Prefer bounded corrections with original-process evidence and measured store behavior before a broad persistence redesign. |

MCP tool loss [#1283](https://github.com/rynfar/meridian/pull/1283) is now resolved
by merged [#1349](https://github.com/rynfar/meridian/pull/1349), commit
`3f5f4f81cd2205ebd62381d8c574d6a6f9ded2d9`. The merged tree matches the tested
head, all final CI passes, contributor credit is present, and source #1283 is
closed. Local tests: 5659 pass / 35 skip / zero failures; actual OpenCode and all
four plugin-qualified E41 modes pass. This merge is not a new npm release.

After consequential fixes, the strongest feature candidates for further review
are [#1341](https://github.com/rynfar/meridian/pull/1341) (separate Antigravity
conversation idle time from tool deadlines), [#1302](https://github.com/rynfar/meridian/issues/1302)
(detached start/stop), and [#1311](https://github.com/rynfar/meridian/issues/1311)
(client-neutral agent identity). Public lifecycle/header interface changes still
need their issue-backed owner contract and appropriate client tests. These are
candidates, not accepted implementations.

Keep prompt-cache keepalive #1193, the Claude side-call/checkpoint stack, and broad
SQLite migrations behind their existing review decisions and explicit contracts.
The Antigravity repeat guard #1340 remains held because suppressing an identical
completed tool call can also suppress a legitimate repeated read. Revisit only
with a discriminating execution-identity rule and negative control.

Release PRs Meridian #1345, OpenCode scrub #20 and Pi scrub #15 are deferred
pending separate release authorization. Haiku 5.5 is already published and
fresh-install verified in Meridian 1.81.0. No additional release is inferred
from this backlog instruction.

Every live harness requires the matching client plugin and server scrub before
inference. Preserve missing evidence, failed runs and exact package/source
identity; do not buy quota, enable Extra Usage, refresh credentials or switch
accounts as an implicit way around a failing test.
