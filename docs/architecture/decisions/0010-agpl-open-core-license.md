# ADR 0010: AGPL-3.0 open-core license

**Status:** Accepted  
**Date:** 2026-10-26

## Context

Scribo intends to be public, open-source local-first software while offering optional **premium** services (cloud, sync, etc.). MIT would allow proprietary forks and competing hosted services without sharing improvements.

## Decision

License this repository under **GNU Affero General Public License v3.0 or later** (`AGPL-3.0-or-later`). Document the open-core vs premium split in [licensing.md](../../product/licensing.md).

Premium service code may live outside this repo or under separate terms. Trademarks are not granted by the license.

## Consequences

- Forks and self-hosting remain allowed; network use of modified versions triggers AGPL source obligations.
- Contributors license under AGPL unless otherwise agreed.
- Commercial dual-licensing may be offered separately for organizations that cannot comply with AGPL.

## Alternatives considered

- **MIT** — rejected (too permissive for sustainable premium services).
- **Apache 2.0** — rejected (same concern as MIT for hosted derivatives).
- **BSL / SSPL / proprietary source-available** — stronger anti-competition but not OSI open source; revisit only if AGPL is insufficient.
