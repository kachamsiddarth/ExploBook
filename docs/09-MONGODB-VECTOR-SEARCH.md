# 09 — MongoDB Atlas Vector Search

## 1. Purpose

Vector Search retrieves books semantically related to a reader's current interests before Gemma performs final ranking.

MongoDB Atlas Vector Search supports vector indexes and the `$vectorSearch` aggregation stage, including metadata pre-filtering.

## 2. Embedding strategy

Local-first MVP:
- Embedding model: `nomic-embed-text` via Ollama.
- Store embedding vector on `books.embedding`.
- Store `embeddingModel` and `embeddingVersion`.

The exact embedding dimension must be read from the running embedding model configuration at ingestion time and treated as a schema constant. Do not hard-code a dimension without verifying the model output.

## 3. Book embedding text

Construct a canonical string:

```text
Title: ...
Authors: ...
Genres: ...
Themes: ...
Description: ...
Difficulty: ...
Language: ...
Pages: ...
```

Do not embed volatile purchase prices or URLs.

## 4. Reader query text

Construct from current profile:

```text
Genres: fantasy, mystery
Themes: adventure, friendship
Likes: fast pacing, strong characters
Dislikes: very slow beginnings
Difficulty: 7/10
Preferred length: 250-450 pages
Goal: enjoyment
```

Embed this text to retrieve candidates.

## 5. Retrieval

Recommended initial settings:
- `numCandidates`: 50–100.
- `limit`: 20.
- Pre-filter by language, public-domain status when needed, and broad difficulty band.

Then application code performs deterministic scoring and sends top 5–10 candidates to Gemma.

## 6. Hybrid recommendation

```text
Vector similarity        30%
Genre match              20%
Theme match              15%
Difficulty fit           10%
Length fit               10%
History novelty           5%
Rating preference         5%
Goal alignment            5%
```

Weights are configurable and evaluated, not treated as permanent truth.

## 7. Avoiding filter bubbles

Every recommendation batch should reserve one candidate for controlled exploration when possible:

- adjacent genre
- slightly different difficulty
- new theme
- classic/public-domain option

Gemma can choose the exploration candidate only from the retrieved set.

## 8. Index contract

Create a Vector Search index named `book_embedding_index` over `books.embedding` with filter fields needed by the query.

Keep the index definition in source control as JSON or deployment documentation.
