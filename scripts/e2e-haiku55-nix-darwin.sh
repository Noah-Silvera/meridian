#!/bin/bash
# Credentialless installed Nix/SDK/native HTTP qualification on macOS.
set -euo pipefail
: "${E2E_NIX_OUT:?Set E2E_NIX_OUT to the built Nix output}"
: "${E2E_OUTPUT_DIR:?Set E2E_OUTPUT_DIR to a fresh evidence directory}"
launcher_dir=$(mktemp -d)
trap 'rm -rf "$launcher_dir"' EXIT
cat > "$launcher_dir/witness.mjs" <<'JS'
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.E2E_NODE_WITNESS, process.execPath);
JS
# Discover the installed wrapper's Node, without changing its native CLI choice.
E2E_NODE_WITNESS="$launcher_dir/node" NODE_OPTIONS="--import=$launcher_dir/witness.mjs" \
  "$E2E_NIX_OUT/bin/meridian" --version
nix_node=$(cat "$launcher_dir/node")
cat > "$launcher_dir/localhost.sb" <<'SB'
(version 1)
(allow default)
(deny network*)
(allow network-outbound (remote ip "localhost:*"))
(allow network-inbound (local ip "localhost:*"))
(deny mach-lookup (global-name "com.apple.securityd") (global-name "com.apple.securityd.xpc"))
SB
/usr/bin/sandbox-exec -f "$launcher_dir/localhost.sb" \
  "$nix_node" "$(dirname "$0")/e2e-haiku55-nix-compat.mjs"
