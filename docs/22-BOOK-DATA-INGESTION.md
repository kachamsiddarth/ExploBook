# 22 — Book Data and Content Ingestion

## 1. Catalogue strategy

The recommendation engine operates over a verified catalogue. Initial catalogue can be seeded from public metadata sources and a manually curated dataset.

Recommended initial seed size: 200–1,000 books rather than trying to ingest the entire book universe.

## 2. Required metadata

- title
- authors
- description
- genres
- themes
- language
- page count when available
- publication year
- difficulty score
- public-domain flag
- external IDs where available
- cover URL where permitted

## 3. Difficulty scoring

Initial deterministic heuristic:

```text
vocabulary complexity     25%
page count                 15%
sentence complexity        20%
conceptual complexity      20%
publication/readability    20%
```

For the initial seed, manually validate a representative sample. The score is a product heuristic, not an academic readability certification.

## 4. Public-domain reading

If the product provides actual in-app reading content, use works whose copyright status is verified for the target jurisdiction or content supplied by the user under appropriate rights.

Do not copy full copyrighted books into the database.

## 5. Embedding ingestion

```text
book metadata
→ canonical embedding text
→ embedding model
→ vector
→ MongoDB books.embedding
→ vector index
```

When embedding model/version changes, re-embed the catalogue and record the new version.

## 6. Deduplication

Prefer stable external IDs where available. Otherwise deduplicate using normalized title + primary author + publication year where available.

## 7. Data refresh

External metadata should not overwrite user reviews or application-generated Reader DNA.
