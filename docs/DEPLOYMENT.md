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

## Last acceptance pass

On 2026-09-03, fresh authenticated browser sessions completed both the public token-free walkthrough and a separate real-provider workflow. The real run covered intake analysis, cited broad research, twelve adaptive questions, four concepts, mouse-operated feature selection, cited focused research, final recalculation, the score room, fake invoice, report viewer, and a valid 21-page PDF. The token-free run covered the same stage choreography, hidden skips, keyboard controls, credits, and restart path without provider calls.

The pass fixed numeric interview input after browser coercion, eliminated a Cloudflare timeout race on long synchronous model calls, restored pointer events to the nested feature menu, and gave asynchronous focused research enough time for citation-heavy responses. The final browser check had a 1,440 by 900 viewport-sized document, no console errors, and no page errors. Local and public health, the password gate, API rejection, loopback binding, container health and hardening, tunnel reachability, and legacy-service retirement passed the deployment verifier after the replacement.

## Password and signing-secret changes

Run `npm run auth:set` to set or replace the shared password. The command hides terminal input, writes the hash directly to `.env` without printing it, and keeps the file at mode `0600`. Recreate the container with `npm run container:up` so it loads the new hash.

Use `npm run auth:hash` only when another secret manager needs the hash on standard output. Changing `APP_COOKIE_SECRET` signs every future session with a new key and invalidates existing browser sessions.

Do not put the plain password, hash, signing secret, OpenAI key, or tunnel credential in Compose, shell history, Git, screenshots, or deployment notes.

## Rollback

Keep rollback narrow. If a newly built container does not become healthy, inspect its logs and return to the prior image tag or source commit. The old system service can run the Node build directly, but it should remain disabled while Compose owns port 4187. Never run both at once.

After any rollback, check local health first, then the public hostname, then a fresh password session. Other tunnel hostnames and services should not need configuration changes for this app.
