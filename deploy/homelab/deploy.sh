#!/usr/bin/env bash
# Ships the committed HEAD to the docker LXC on T15 and (re)installs the job timers.
# Finna's Cloudflare blocks datacenter IPs, so these jobs must run from the home network (ADR-009).
set -euo pipefail

PVE_HOST="root@100.90.247.73"
LXC_ID=102
STACK_DIR=/opt/stacks/finna-renewer
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

in_lxc() { ssh "$PVE_HOST" "pct exec $LXC_ID -- bash -c '$1'"; }

git -C "$REPO_ROOT" archive --format=tar HEAD |
  ssh "$PVE_HOST" "pct exec $LXC_ID -- bash -c 'rm -rf $STACK_DIR.new && mkdir -p $STACK_DIR.new && tar -x -C $STACK_DIR.new'"

grep -E '^(DATABASE_URL|ENCRYPTION_KEY|NEXT_PUBLIC_VAPID_PUBLIC_KEY|VAPID_PRIVATE_KEY|VAPID_SUBJECT)=' "$REPO_ROOT/.env.local" |
  ssh "$PVE_HOST" "pct exec $LXC_ID -- bash -c 'umask 077 && cat > $STACK_DIR.new/deploy/homelab/job.env'"

# Persistent secrets live outside the stack dir, which is replaced on every deploy.
# cloudflared runs as uid 65532, so it owns the token file and may traverse the dir.
in_lxc "mkdir -p /etc/finna-renewer && chmod 711 /etc/finna-renewer \
  && { [ -f /etc/finna-renewer/relay.env ] || (umask 077 && echo FINNA_RELAY_SECRET=\$(openssl rand -hex 32) > /etc/finna-renewer/relay.env); } \
  && { [ ! -f /etc/finna-renewer/cf_tunnel_token ] || chown 65532 /etc/finna-renewer/cf_tunnel_token; }"

COMPOSE="docker compose -f $STACK_DIR/deploy/homelab/compose.yml"
in_lxc "rm -rf $STACK_DIR && mv $STACK_DIR.new $STACK_DIR \
  && $COMPOSE --profile job build --quiet \
  && $COMPOSE up -d relay \
  && { [ -f /etc/finna-renewer/cf_tunnel_token ] && $COMPOSE up -d cloudflared || echo No /etc/finna-renewer/cf_tunnel_token yet, tunnel not started; } \
  && cp $STACK_DIR/deploy/homelab/finna-job@* /etc/systemd/system/ \
  && systemctl daemon-reload \
  && systemctl enable --now finna-job@renew.timer finna-job@sync.timer \
  && systemctl list-timers finna-job@*"
