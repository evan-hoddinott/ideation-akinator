# Live deployment record

This record describes the private demo at `https://idea.battery.rip`. It does not contain tunnel credentials, password hashes, cookie secrets, or provider keys.

## Request path

1. Cloudflare terminates public HTTPS for `idea.battery.rip`.
2. The remotely managed Cloudflare Tunnel sends that hostname to `http://localhost:4187` on `desktopmsi`.
3. The `cloudflared` container uses host networking, so its loopback address is the host loopback address.
4. Docker publishes the application container's port 3000 as `127.0.0.1:4187`.

Caddy is not in this app's request path. The route does not expose the application port on a LAN address or public host interface.

## Source of truth

- The public hostname and origin mapping live in the remotely managed Cloudflare Tunnel configuration.
- The application image, health check, port binding, restart policy, and runtime restrictions live in `compose.yaml`.
- The `ideation-akinator-data` named volume is mounted at `/data` for the global leaderboard. It persists across ordinary image and container replacements while the rest of the runtime filesystem remains read-only.
- The app's untracked `.env` file contains the OpenAI key, scrypt password hash, and cookie signing secret. Its server mode is `0600`.
- `deploy/compose.sh` starts Compose without automatically interpreting `.env`. Compose then loads the file literally through `env_file` with `format: raw`.
- `deploy/ideation-akinator.service` is a disabled rollback definition. Docker Compose owns the live process.

## Normal operation

Build and replace the app container:

```sh
npm run container:build
npm run container:up
```

Read its state and recent safe logs:

```sh
./deploy/compose.sh ps
./deploy/compose.sh logs --tail=100 app
```

Run the non-interactive public deployment check:

```sh
npm run deploy:verify
```

Run the same check plus a real password login and session refresh. The script reads the password without echoing it and deletes its temporary cookie jar when it exits.

```sh
npm run deploy:verify:auth
```

The checks cover DNS, local and public health, the anonymous password screen, anonymous API rejection, the loopback-only port, container health and hardening, the active tunnel container, and retirement of the old system service. The authenticated version also checks the session cookie flags and verifies that the session survives a second page load.

## September 13 workflow deployment

Application revision `947e156` from branch `codex/workflow-redesign` is deployed at `https://idea.battery.rip` in image `sha256:873d49ae3405d0845f52351b76045d0f465a77a7b5e2c563f7a3c2bbadb2f41e`. The existing Docker/Cloudflare route, secrets and leaderboard volume are preserved. The prior image remains tagged `ideation-akinator:before-workflow-20260913`.

The unit suite passes 180 tests in 43 files. Type checking reports zero errors/warnings, full lint passes, and the production container build succeeds. `npm run deploy:verify` passes all public health, anonymous authentication, runtime-hardening and tunnel checks. All 38 new media/cursor/frame/font asset hashes match the local source files.

Local acceptance includes the complete edited demo and real equipment-lending workflow, real material-conflict revision, failure/refresh/retry/cancellation fixtures, responsive checks, motion recordings, and downloaded PDF consistency. A real final-plan request to the deployed endpoint reused completed research and returned HTTP 200 in 37 seconds with a complete 4–6 week timeline. Model estimates and research gaps remain visible.

Authenticated browser verification uses a private two-hour signed session. It verifies authorization and session persistence, not a new password-entry login. Public journey/report evidence is recorded in [workflow verification](WORKFLOW-VERIFICATION.md).

## September 11 internet-history deployment

Application commit `796e001` is deployed at `https://idea.battery.rip` in image `sha256:b38a6be1564244c046edbb3fb7b2a43642323a6f4be18b467982381c26369a77`.

All 143 unit tests passed before publishing. The production container build and the complete non-interactive deployment verifier passed. A fresh authenticated public browser rendered the cat-YouTube scene at 1440×900, survived a page reload, and reported no page errors, console warnings, failed resources, or broken images. Public hashes matched the committed Sage GLB and all eight additions in `INTERNET-HISTORY-SOURCES.json`. Browser verification used a short-lived signed session; a new password-entry login was not part of this deployment check.

The local visual acceptance and complete token-free workflow are recorded in [INTERNET-HISTORY-VERIFICATION.md](INTERNET-HISTORY-VERIFICATION.md). The public screenshot is retained locally at `artifacts/internet-history/live-deployed-youtube.png`. The previous running image is retained as `ideation-akinator:before-internet-history-20260911`.

## Last acceptance pass

On 2026-09-04, follow-up commit `24942d0` repaired the broad-research staging and
dialogue pacing. The Sage and workstation now enter from the same side, the
Sage remains in front of the cart and keyboard, his monitor face stays turned
toward the research CRT, and the tower is parked beside rather than over the
screen. The same deployment added black-and-white RPG dialogue portraits and a
deliberate advance between the last spoken line and response controls. The
public workstation route loaded without browser or page errors, and the full
deployment verifier passed after the container replacement.

On 2026-09-04, implementation commit `35088b2` completed the seven-slice presentation recovery. A fresh authenticated public browser loaded the held workstation scene at 1,440 by 900 with the Sage, chair, model hands, keyboard, cart, CRT, and clue scraps visibly aligned. All 76 observed requests succeeded; the console and page-error logs were empty; and the public Sage GLB hash exactly matched the locally accepted model. The deployment verifier again passed DNS, local and public health, the password gate, anonymous API rejection, loopback binding, container hardening, tunnel reachability, and legacy-service retirement.

On 2026-09-03, fresh authenticated browser sessions completed both the public token-free walkthrough and a separate real-provider workflow. The real run covered intake analysis, cited broad research, twelve adaptive questions, four concepts, mouse-operated feature selection, cited focused research, final recalculation, the score room, fake invoice, report viewer, and a valid 21-page PDF. The token-free run covered the same stage choreography, hidden skips, keyboard controls, credits, and restart path without provider calls.

The pass fixed numeric interview input after browser coercion, eliminated a Cloudflare timeout race on long synchronous model calls, restored pointer events to the nested feature menu, and gave asynchronous focused research enough time for citation-heavy responses. The final browser check had a 1,440 by 900 viewport-sized document, no console errors, and no page errors. Local and public health, the password gate, API rejection, loopback binding, container health and hardening, tunnel reachability, and legacy-service retirement passed the deployment verifier after the replacement.

## Password and signing-secret changes

Run `npm run auth:set` to set or replace the shared password. The command hides terminal input, writes the hash directly to `.env` without printing it, and keeps the file at mode `0600`. Recreate the container with `npm run container:up` so it loads the new hash.

Use `npm run auth:hash` only when another secret manager needs the hash on standard output. Changing `APP_COOKIE_SECRET` signs every future session with a new key and invalidates existing browser sessions.

Do not put the plain password, hash, signing secret, OpenAI key, or tunnel credential in Compose, shell history, Git, screenshots, or deployment notes.

## Rollback

The September 4 visual pass previously ran in image `sha256:ee9ee5f40a7b9fc3fcc631df1210c7739942fa1f723d79ab164a71aa14ce04a8`. The previous running image is retained as `ideation-akinator:before-design-20260904`. Health and deployment audits passed after recreation; fresh public browser checks and model hash verification are recorded in [DESIGN-PASS.md](DESIGN-PASS.md).

Keep rollback narrow. If a newly built container does not become healthy, inspect its logs and return to the prior image tag or source commit. The old system service can run the Node build directly, but it should remain disabled while Compose owns port 4187. Never run both at once.

After any rollback, check local health first, then the public hostname, then a fresh password session. Other tunnel hostnames and services should not need configuration changes for this app.
