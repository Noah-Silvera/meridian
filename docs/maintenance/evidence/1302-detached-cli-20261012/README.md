# Supervisor and CLI implementation — current checkpoint

The CLI now dispatches `start --detach [--json]` and `stop [--json]` through
an endpoint-specific supervisor. Its original child uses private IPC for
readiness and graceful shutdown; the launcher commits ownership before exiting.
An uncommitted launcher disconnect cancels startup. Cleanup joins the child,
its log sink and private listener before releasing ownership. Existing foreground
shutdown behavior retains its second-signal force exit; repeated private stop
requests do not force exit.

`src/__tests__/detached-supervisor-process.test.ts` bundles the production
supervisor, command, child control and store into a Node fixture, then uses real
separate processes. On Darwin ARM64 / Node 22.22.3, its 19 assertions pass:
concurrent launchers produce exactly one created and one existing result with
matching identity; both launchers exit while the listener remains ready; foreign
ports are neither adopted nor stopped; fresh stop drains the child and preserves
stdout/stderr/shutdown logs; repeated stop is idempotent; pre-commit launcher
disconnection closes the original child and supervisor and removes owned state.
This fixture replaces the server only; it is not installed-package or live SDK
acceptance.

The initial concurrent-start run failed with Node exit 13 and “unsettled top-level
await”: the reused server coordinator has unreferenced lock retry timers, so a
standalone waiting command could exit before returning JSON. The command now owns
a referenced, bounded deadline timer and clears it in finally. The same process
regression passes after that correction. Other corrections place early ownership
acquisition inside supervisor cleanup, detach cancelled launcher IPC immediately,
and remove abort listeners on cancellation as well as normal completion.

The final focused suite passed 25 tests / 121 assertions plus standalone
typecheck; this includes the process test with 19 assertions.
Full current implementation gates are pending. Source CLI, independently installed
package, multiple managed endpoint matrix, claimed-platform acceptance and
plugin-qualified actual active-turn drain remain required. #1359 remains draft;
#1302 remains open. No model calls, credential operations or Docker changes.

The following checkpoints are historical and qualify only their named revisions.

# Detached CLI implementation checkpoint

Issue #1302, draft delivery #1359. Base e0f9feab. This is a new maintainer
implementation, not incorporated contributor code.

Implemented foundations:
- `src/cli/detachedProtocol.ts`: bounded single-frame parsing, strict private
  identity validation, constant-time nonce/instance comparison, and lifecycle
  transitions that admit graceful stop only once.
- `src/cli/detachedControl.ts`: bounded private socket connections, authenticated
  inspect/stop, original-connection close on success/error/timeout, explicit
  reporting of a failed graceful callback. No public HTTP route or PID signaling.
- `src/cli/detachedLog.ts`: one backpressure-aware writer, 10 MiB active plus one
  rotated file across launches, private single-link files, rejection of symlinks,
  over-limit history and replacement before rotation. The supervisor must own the
  enclosing directory and serialize writers; the logger does not supply that lock.

Focused command:

```sh
bun test src/__tests__/detached-control.test.ts \
  src/__tests__/detached-control-socket.test.ts \
  src/__tests__/detached-log.test.ts \
  src/__tests__/detached-node-bundle.test.ts
npm run typecheck
```

16 tests / 69 assertions pass on Darwin ARM64 with Bun 1.3.14. Standalone
typecheck passes. The bundle test launches actual Node 22.22.3 and verifies
framing/admission, real private socket concurrent stop and log rotation, then
joins the original child. This is compiled-module proof, not an installed npm
package or full detached application lifecycle test.

Adversarial findings resolved during implementation: validate hex lengths before
Buffer decoding; retain a cancelled-start state despite late readiness; surface
stop-callback failure instead of swallowing it; never retry it as a force stop;
wait for the real socket-close event in the timeout test instead of assuming one
event-loop tick proves cleanup; use fileURLToPath for the Node probe on Windows.
Log rotation is bounded across process launches rather than restarting its budget.

Still required: private directory/record ownership and stale recovery, parent to
supervisor publication handshake, original child IPC/stream ownership, bounded
startup/readiness, CLI dispatch and output, source/installed actual multi-process
lifecycle matrix, claimed-platform proof, active-turn drain with matching plugins,
full local npm test/typecheck/build and final-head CI. The new commands are not
wired or exposed yet. Do not mark #1302 resolved or merge this draft based on these
foundational tests. No credentials, auth refresh, inference, or Docker changes.

## Foundation full gates and ownership checkpoint

Original67248 completed with exit0 on frozen
d8d393a715908d4af25f76e20e4e705065cd754e:5768 pass/35 skips/0 fail across23
isolated groups, standalone typecheck and build. See foundation-local-gates.json.

Subsequent ownership changes are separately qualified:24 focused tests/102
assertions and typecheck pass. They were prepared outside the checkout while
the original full run remained live, then copied in only after it exited. The
full result above does not cover these newer files.

`detachedStore.ts` adds endpoint-scoped, bounded, private ownership records and
short private control paths. A supervisor lifetime lease reuses the existing
CrossProcessTurnCoordinator and OS process-incarnation semantics, rather than
PID-only locking. Unknown/dead identity remains distinct; only confirmed dead
owners can be replaced. Stop inspection does not create missing state.

Adversarial checks reject endpoint mismatches, extra/malformed fields, symlinks,
multiple hard links, broad Unix permissions, oversized bodies and a changed
record. Removal moves the checked record aside and verifies its identity before
unlinking; an unexpected moved file is retained for explicit recovery. A real
lease test excludes a second acquirer, then admits a replacement after release.
That is same-process filesystem coordination proof, not yet two real supervisors.

A new regression covers release during publication: cleanup joins the original
publication before retiring its record/releasing the lease; a second concurrent
publication is rejected. Published record identity is privately copied so a
caller mutation cannot change which record cleanup owns.

The supervisor event loop, parent commit handshake, child IPC, CLI commands and
actual source/installed/platform lifecycle acceptance remain pending. No PID is
signaled by these components. No feature-completion or current-head full-suite
claim follows from the earlier foundation run.
