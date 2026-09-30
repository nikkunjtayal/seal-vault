#!/usr/bin/env bash
# Compile ShadePass Compact contract via WSL (path-independent).
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
compact compile +0.31.1 contracts/shade-pass.compact contracts/managed/shade-pass
