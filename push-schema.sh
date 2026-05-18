#!/bin/bash
cd ~/projects/finna-renewer/web

# Source nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# Try common node locations
for p in "$HOME/.nvm/versions/node"/*/bin /usr/local/bin /usr/bin; do
  if [ -x "$p/node" ]; then
    export PATH="$p:$PATH"
    break
  fi
done

echo "Node: $(which node) $(node --version)"
echo "Pushing schema..."
npx drizzle-kit push
