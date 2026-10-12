# Backlog priorities — 2026-10-12

Refreshed after image #1351 merged; new contributor #1352 included. Coverage: all paginated open issues/PRs in
six accessible owner-managed repositories, discovered through authenticated
repository permissions. Meridian has 30 PRs and 20 issues; OpenCode scrub has
five PRs and one issue; Pi scrub has one PR. HUD, Hermes and OpenClaw scrub have
no open items. Total: 36 PRs and 21 issues. These counts include delivery/source
PR pairs and release PRs; they are not 57 independent fixes.

This is the working priority report, not a claim that every remaining diff has
passed review. Fixes with direct user cost, lost work or broken requests lead.

| Order | Tickets | Why this matters | Disposition / next evidence |
| --- | --- | --- | --- |
| 1 | [#1338](https://github.com/rynfar/meridian/issues/1338), delivery [#1347](https://github.com/rynfar/meridian/pull/1347) | Priority routing can keep spending paid overage while included capacity remains elsewhere. | Fix prepared; preserve explicit pins and same-turn identity. Complete qualified account-routing evidence without deliberately incurring paid usage. |
| Done | [#1294](https://github.com/rynfar/meridian/pull/1294), delivery [#1344](https://github.com/rynfar/meridian/pull/1344) | Healthy queued turns and long tool writes were killed as idle. | Merged as `8edccd790`; exact tree/credit verified, source closed. Full local, installed actual OpenCode and all four plugin-qualified E41 modes pass, final CI passes. No new release. |
| 2 | OpenCode scrub [#21](https://github.com/rynfar/meridian-plugin-opencode-scrub/issues/21), [#22](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/22), [#23](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/23), delivery [#24](https://github.com/rynfar/meridian-plugin-opencode-scrub/pull/24) | Scrubbing can corrupt the client's working directory and send tools toward the wrong path. | Authored incorporation plus parser corrections prepared. 48 installed-package/parser cases pass; actual reported Windows/client qualification remains open. |
| 3 | [#1214](https://github.com/rynfar/meridian/pull/1214) | A keepalive can prematurely commit an exhausted account and defeat failover. | Prepared in [#1350](https://github.com/rynfar/meridian/pull/1350), actual authored cherry-picks plus bounded-buffer correction. 5722 combined-tree local tests pass. Installed baseline headers fail at 15,083 ms; candidate passes at 104 ms. Combined installed live probe passes (25 ms SSE headers) and all four E41 modes pass. Integrating image main; actual OpenCode executable and final combined gates remain. |
| Done | [#1310](https://github.com/rynfar/meridian/issues/1310) | Byte-identical historical images can multiply across fresh replay/read-back cycles, increasing attachments and usage. | Reproduced 1,2,4 amplification and duplicate SDK inputs; [#1351](https://github.com/rynfar/meridian/pull/1351) yields 1,1,1 with provenance/current media retained. Actual Pi 1.1.0 / Opus 5.5 reproduces growth on published 1.81.0 and holds at 1,1,1 on the installed candidate; current images and all four E41 modes pass. Final corrected package passed the same actual Pi flow; 5682 tests/typecheck/build and final CI pass. Merged #1351 as a8a214bfc; #1310 closed. No new release. |
| 5 | [#1352](https://github.com/rynfar/meridian/pull/1352) | Home Manager systemd environment quoting can strip JSON quotes or change paths, breaking profile configuration. | Preliminary accept with verification: small focused fix, source de3c6fe5. Preserve both authored commits; independently reproduce generated-unit parsing on Linux/systemd before incorporation. Contributor evidence is not our completed verification. |
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
