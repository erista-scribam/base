# Licensing and open core

**Status:** Active  
**SPDX:** `AGPL-3.0-or-later` for source code in this repository

## Why not MIT?

MIT allows anyone to take the code, build a competing product (including hosted sync or “Scribam-like” cloud services), and never contribute improvements back. Scribam is meant to stay **writer-controlled and sustainable**: the local editor remains free and inspectable, while **official premium services** (cloud backup, sync, collaboration, and similar) fund ongoing development.

**AGPL-3.0** fits that model better than MIT:

|                                                                   | MIT                      | AGPL-3.0 (this repo)                                |
| ----------------------------------------------------------------- | ------------------------ | --------------------------------------------------- |
| Use, modify, self-host locally                                    | Yes                      | Yes                                                 |
| Distribute forks                                                  | Yes                      | Yes (with license + source terms)                   |
| Offer a **network service** built on modified versions            | Few copyleft obligations | Must offer corresponding source to users (AGPL §13) |
| Protect official premium cloud/sync from silent proprietary forks | No                       | Stronger                                            |

AGPL is [OSI-approved open source](https://opensource.org/license/agpl-v3). It is **not** “source available only”; it is copyleft with a network-use clause.

## What this repository covers

Everything in **this monorepo** (Scribam Prosa app, shared packages, docs, tooling) is under **GNU Affero General Public License v3.0 or later**, unless a file explicitly states otherwise.

See [LICENSE](../../LICENSE) for the full text.

## Premium services (not in this repo)

Planned or future **Scribam premium** offerings—for example official **cloud storage, sync, accounts, or collaboration**—are expected to be:

- **Separate products or services**, with their own terms of service and privacy policy, and
- **Not required** to edit local manuscripts (local-first remains the default).

Premium **client or server code** that is proprietary may live outside this repository or under a different license. Only what is published here is AGPL.

Do not assume premium features exist until they are shipped and documented.

## Trademarks

“Scribam”, “Scribam Prosa”, and related branding are **not** granted by the AGPL. Forks must not imply they are the official product. See project naming guidelines when the repo is public.

## Commercial / alternative licensing

Organizations that cannot accept AGPL obligations (e.g. embedding in a closed product without sharing modifications) may request **commercial licensing** from the maintainers. Contact details will be listed on the public repository when available.

Until then, treat AGPL as the default for all use of this source tree.

## Contributing

By contributing, you agree that your contributions are licensed under the same **AGPL-3.0-or-later** terms as the project, unless the maintainers explicitly agree otherwise in writing.

## Relationship to product philosophy

Local editing without cloud remains central ([philosophy.md](./philosophy.md)). Premium services must not become a requirement for basic writing or ownership of manuscript files on disk.
