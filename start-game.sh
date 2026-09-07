#!/usr/bin/env bash
# Copyright 2026 Adam Petcher
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pid_file="$project_dir/.leanquest-server.pid"
log_file="$project_dir/.leanquest-server.log"
server_bin="$project_dir/node_modules/.bin/next"
server_host="127.0.0.1"
server_port="${LEANQUEST_PORT:-3000}"

server_command() {
  ps -p "$1" -o command= 2>/dev/null || true
}

is_game_server() {
  local pid="$1"
  kill -0 "$pid" 2>/dev/null && [[ "$(server_command "$pid")" == *"$server_bin"* ]]
}

if [[ -f "$pid_file" ]]; then
  existing_pid="$(tr -d '[:space:]' < "$pid_file")"
  if [[ "$existing_pid" =~ ^[0-9]+$ ]] && is_game_server "$existing_pid"; then
    echo "LeanQuest is already running at http://$server_host:$server_port/"
    echo "Server log: $log_file"
    exit 0
  fi
  rm -f "$pid_file"
fi

if [[ ! -x "$server_bin" ]]; then
  echo "LeanQuest dependencies are not installed. Run 'npm install' first." >&2
  exit 1
fi

cd "$project_dir"
nohup "$server_bin" dev --hostname "$server_host" --port "$server_port" \
  >"$log_file" 2>&1 &
server_pid=$!
echo "$server_pid" > "$pid_file"

for ((attempt = 0; attempt < 40; attempt += 1)); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "LeanQuest failed to start. Recent server output:" >&2
    tail -n 20 "$log_file" >&2 || true
    rm -f "$pid_file"
    exit 1
  fi
  if curl --silent --fail --output /dev/null "http://$server_host:$server_port/"; then
    echo "LeanQuest is running at http://$server_host:$server_port/"
    echo "Server log: $log_file"
    exit 0
  fi
  sleep 0.25
done

echo "LeanQuest started, but it did not become reachable in time." >&2
echo "Check the server log: $log_file" >&2
if is_game_server "$server_pid"; then
  kill "$server_pid"
fi
rm -f "$pid_file"
exit 1
