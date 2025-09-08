# Backups and Safety Guardrails

This project includes built-in safeguards to avoid accidental data loss.

What we added
- Automatic snapshots before risky git actions
  - .githooks/pre-commit: creates a timestamped archive under backups/ and blocks deletion of init-scripts/*.sql.
  - .githooks/pre-push and .githooks/pre-rebase: create snapshots too.
- One-liner backups
  - npm run backup: snapshot of repository (excludes node_modules, .next, backups, db-backups).
  - npm run backup:db: Docker Postgres dump to db-backups/.
  - npm run backup:all: both repository and database.
- .gitignore updated to exclude backups/ and db-backups/.

Initial setup
1) Point git to the hooks in this repo (run once):
   npm run setup-hooks
2) Optionally take an immediate backup:
   npm run backup:all

Restore tips
- Repository: pick a .zip/.tar.gz from backups/ and extract over the repo (or into a temp dir to cherry-pick files).
- Database: restore a .dump with pg_restore. Example:
  docker exec -i nexus-postgres pg_restore -U nexus_admin -d nexus_juridico --clean --if-exists < db-backups/db_YYYYMMDD_HHMMSS.dump

Policy
- The pre-commit hook blocks deletion inside init-scripts/ to protect critical SQL. If you really intend to remove something, commit with --no-verify (not recommended) after taking a manual backup and code review.
- Consider adding remote branch protection on main (required reviews, disallow force-push).
