#!/usr/bin/env bash
set -euo pipefail
# Run ONLY against the disposable container created by the documented test command.
container=cbc-day1-db
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
# A separate throwaway database each run; never reset or drop an existing database.
database_name="cbc_test_$(date +%s)_${RANDOM}"
docker exec "$container" createdb -U postgres "$database_name"
for sql_file in "$repo_root/database/tests/bootstrap.sql" "$repo_root"/database/migrations/*.sql "$repo_root"/database/proposals/*.sql "$repo_root/database/tests/fixtures.sql" "$repo_root/database/tests/ownership.sql"; do
  echo "Checking $(basename "$sql_file")"
  docker exec -i "$container" psql -X -U postgres -d "$database_name" -v ON_ERROR_STOP=1 < "$sql_file"
done
printf 'Synthetic test database retained for inspection: %s\n' "$database_name"
