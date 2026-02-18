#!/usr/bin/env bash
set -euo pipefail

echo "=== [1/7] Build kumiko-gen ==="
pnpm --filter @takazudo/kumiko-gen build

echo "=== [2/7] Test kumiko-gen ==="
pnpm --filter @takazudo/kumiko-gen test

echo "=== [3/7] Build svg-to-png ==="
pnpm --filter @takazudo/svg-to-png build

echo "=== [4/7] Test svg-to-png ==="
pnpm --filter @takazudo/svg-to-png test

echo "=== [5/7] Build kumiko-gen-viewer ==="
pnpm --filter kumiko-gen-viewer build

echo "=== [6/7] Generate doc data ==="
(cd doc && pnpm run generate)

echo "=== [7/7] Build doc site ==="
(cd doc && pnpm run build)

echo ""
echo "All checks passed!"
