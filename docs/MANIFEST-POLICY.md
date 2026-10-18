# Derived manifest policy

The files under `feed/` are deterministic materializations of the canonical posts. They contain no records that are absent from `posts/`.

For the initial empty corpus, every manifest uses `1970-01-01T00:00:00Z` as `generated_at`. This fixed timestamp distinguishes the committed zero-state scaffold from a fabricated generation event. The publication pipeline replaces `generated_at` with the deterministic commit-assembly time whenever it materializes nonempty manifests.

Catalog months are derived from canonical post dates and are ordered newest month first, with each count recomputed from that month's canonical posts. An empty corpus therefore has an empty month list.

The reverse-relation index is derived from the canonical posts' `related_ids` and `correction_of` fields. It contains no keys or synthetic IDs before canonical posts exist.
