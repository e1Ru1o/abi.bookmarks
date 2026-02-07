#!/bin/bash
cd /vercel/share/v0-project
# Use the project's yarn 3.2.3 to regenerate the lockfile
node .yarn/releases/yarn-3.2.3.cjs install --no-immutable
echo "Lockfile regeneration complete"
