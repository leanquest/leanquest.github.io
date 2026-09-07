#!/usr/bin/env bash
# Copyright 2026 Adam Petcher
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pid_file="$project_dir/.leanquest-server.pid"
server_bin="$project_dir/node_modules/.bin/next"

if [[ ! -f "$pid_file" ]]; then
  echo "LeanQuest is not running."
  exit 0
fi

server_pid="$(tr -d '[:space:]' < "$pid_file")"
if [[ ! "$server_pid" =~ ^[0-9]+$ ]]; then
  echo "Removed an invalid LeanQuest PID file."
  rm -f "$pid_file"
  exit 0
fi

server_command="$(ps -p "$server_pid" -o command= 2>/dev/null || true)"
if ! kill -0 "$server_pid" 2>/dev/null; then
  echo "LeanQuest was not running; removed its stale PID file."
  rm -f "$pid_file"
  exit 0
fi

if [[ "$server_command" != *"$server_bin"* ]]; then
  echo "The saved PID belongs to another process; it was not stopped." >&2
  rm -f "$pid_file"
  exit 1
fi

kill "$server_pid"
for ((attempt = 0; attempt < 20; attempt += 1)); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    rm -f "$pid_file"
    echo "LeanQuest stopped."
    exit 0
  fi
  sleep 0.25
done

kill -KILL "$server_pid"
rm -f "$pid_file"
echo "LeanQuest stopped."
