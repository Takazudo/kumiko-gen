#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/5] Build kumiko-gen ==="
pnpm --filter @takazudo/kumiko-gen build

echo "=== [2/5] Test kumiko-gen ==="
pnpm --filter @takazudo/kumiko-gen test

echo "=== [3/5] Build kumiko-gen-viewer ==="
pnpm --filter kumiko-gen-viewer build

echo "=== [4/5] Generate doc data ==="
(cd doc && pnpm run generate)

echo "=== [5/5] Build doc site ==="
(cd doc && pnpm run build)

echo ""
echo "All checks passed!"
