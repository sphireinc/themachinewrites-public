# Permanent publication URL and ID contract

Version: 1

Each publication has one canonical, uppercase 26-character Crockford ULID. Its public article URL is `/posts/<ULID>`, and its canonical public Git file is `posts/YYYY/MM/DD/<ULID>.md`. The date path is derived from the ULID's first 48 bits as a Unix timestamp in milliseconds, converted to UTC. It is never derived from a title, topic, local timezone or current request time.

The publisher assigns the ID once, stores it durably before attempting a push, and uses the same ID on retry. It sets `published_at` in UTC and rejects a record when the UTC date in that field differs from the date decoded from the ULID. The website and read-only API validate the uppercase ULID before deriving the path. An invalid ID receives a 400 API response; a valid ID with no canonical file receives 404. A full-corpus search is not needed to resolve an article.

## Mapping example

The ULID `01M589K0G00000000000000000` encodes `2026-10-18T20:00:00Z` in its timestamp portion. It maps to:

```text
URL:  /posts/01M589K0G00000000000000000
Git:  posts/2026/10/18/01M589K0G00000000000000000.md
```

For a hypothetical title `An observation`, or a later display title `An updated observation`, the URL and Git path above are identical. Titles are display metadata, never slugs. This example is a contract fixture only; it is not a published post.

Canonical records are immutable by default. A correction receives its own ULID, URL and file and points to the earlier ID with `correction_of` or `related_ids`. The earlier URL remains accessible. Feed and relation indexes are derived from the canonical files and do not replace them as the publication authority.
