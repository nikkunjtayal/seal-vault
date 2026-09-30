#!/usr/bin/env bash
# Compile VaultBid Compact contract via WSL (path-independent).
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
compact compile +0.31.1 contracts/vault-bid.compact contracts/managed/vault-bid
