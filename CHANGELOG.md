# Change log

## Version 3 reliability — unreleased

REQ-001/002/004/005/006/007/008/013. Branch `feature/version3-reliability-operations`, based on `fbce326`.

- Preserve session cookie chunks/options/cache headers across refresh and redirects; use Next 16 Proxy.
- Bound organization/contact histories with database joins, keyset pages and shared load-more sections; evaluate the unchanged activity-reader role predicate once per statement locally.
- Add normalized schema comparison, synthetic restore/finance/denial drill and isolated real Auth/API/browser CI.
- Limit complete source reads to 10,000 records and stream authorized reconciled CSV; add export counts, diagnostics and authenticated health.
- Add no-write fictional CSV preview; remove superseded styles, improve validation associations and repeatable exact-record browser assertions.
- Document access/audit/import/mentorship/storage proposals, release/recovery and unfinished work.

Not deployed, merged or CBC-approved. See [exact verification](docs/delivery/version3-reliability-verification.md). Earlier release history remains in `docs/delivery/version-*.md` and Git history.
