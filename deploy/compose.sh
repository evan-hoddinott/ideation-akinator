#!/bin/sh
set -eu

# The password hash contains dollar signs. Skipping Compose's automatic .env
# interpolation keeps it literal and prevents misleading variable warnings.
exec docker compose --env-file /dev/null "$@"

