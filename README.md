# board_games

Small offline-first games for the phone browser, installable as an app.

Play at <https://hairingx.github.io/board_games/>. To install, open it on the phone and choose
"Add to Home Screen" (Safari) or "Install app" (Chrome); every game then works without a
connection.

## Development

```sh
npm ci
npm run dev        # local server with hot reload
npm run lint && npm run typecheck && npm test && npm run build
```
