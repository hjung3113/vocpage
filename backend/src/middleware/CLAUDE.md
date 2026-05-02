# backend/src/middleware/CLAUDE.md

## Role

Express middleware — auth, logging, error mapping, request ID, CORS.

## When to look where

- Why an error returned a specific HTTP status → error middleware (single source of HTTP status from exceptions)
- Where auth runs in the request lifecycle → auth middleware here
- Cross-cutting request concerns (logging, request ID) → here
