# Conventions for this repository

Small offline-first games played in a web browser on a phone: question cards for couples,
trivia for the car, and the like. Served as static files by GitHub Pages and installable as a
Progressive Web App, so every game works without a connection once it has been opened.

## Authorship

- Nothing in this repository, its history or on GitHub names the assistant or the tool that
  helped write it: no `Co-Authored-By` or session trailers in commit messages, no "Generated
  with" lines or footers in pull requests, issues or comments, no assistant names in branch
  names, files, code, comments or documentation. Commits are authored as the owner.

## Conventions

- All documentation, comments and commit messages are in English. The games' own text is in
  Danish.
- No real IP addresses, hostnames, serial numbers, email addresses or credentials in tracked
  files.

## Branches and pull requests

- Every change goes through a branch and a pull request: `main` takes no push and no force push.
  The ruleset in `.github/rulesets/main.json` enforces it; its only bypass is the owner's, and
  only for merging a pull request.
- Name every branch by the kind of change; `.github/rulesets/branch-names.json` refuses any
  other name. `feature/<what>` for a new game or what a player sees, `fix/<what>` for a bug,
  `docs/<what>` for documentation, and `chore/<what>` for CI, tooling, anything that stays in
  the repository.
- A pull request's text describes only its own change: what it does and how it was tested.
