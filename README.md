# WoR Code Reminder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/iShark5060/watcher-of-realms-reminder/ci.yml?style=flat-square&label=CI)](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/ci.yml)
[![PR](https://img.shields.io/github/actions/workflow/status/iShark5060/watcher-of-realms-reminder/pr.yml?style=flat-square&label=PR)](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/pr.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D26-339933?logo=node.js&logoColor=white&style=flat-square)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white&style=flat-square)](https://cursor.com)

A small Discord bot that watches [Prospector promo codes](https://prospector.gg/promo-codes/) so I do not miss a Watcher of Realms drop. Every few minutes it scrapes the public list, posts one message per active code, and then gets out of the way.

React with any emoji after you redeem a code in-game. The bot deletes that message and remembers the code, so a later re-issue will not ping you again.

Invite needs View Channel, Send Messages, Embed Links, Read Message History. Privileged Gateway Intents can stay off. Only `DISCORD_USER_ID` can dismiss codes.

## Behaviour

- Polls the public promo-code page about every 7 minutes (`POLL_INTERVAL_MS`).
- Posts a new embed for each **active** code that is not already posted and not already redeemed.
- If a code drops off the active list, its Discord message is removed, but it is not marked redeemed, so an unused code can come back later.
- A reaction from you marks the code redeemed forever (case-insensitive) and deletes the message.

## License

MIT. See [LICENSE](LICENSE).
