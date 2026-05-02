# backend/src/controllers/CLAUDE.md

## Role

Thin HTTP adapters — parse, validate, delegate to a service, format the response. No business logic.

## When to look where

- Tracing a request from route → service → here is the pass-through
- Request shaping / response formatting decisions → here
- Validation wiring → `validators/`
- Error → HTTP status mapping → `middleware/`
