#!/bin/sh
set -eu

origin=${IDEATION_AKINATOR_ORIGIN:-https://idea.battery.rip}
local_origin=${IDEATION_AKINATOR_LOCAL_ORIGIN:-http://127.0.0.1:4187}
app_container=${IDEATION_AKINATOR_CONTAINER:-ideation-akinator}
tunnel_container=${IDEATION_AKINATOR_TUNNEL_CONTAINER:-cloudflared}
check_auth=false
public_host=${origin#https://}
public_host=${public_host%%/*}
public_host=${public_host%%:*}

if [ "${1:-}" = "--auth" ]; then
	check_auth=true
elif [ "$#" -gt 0 ]; then
	echo "Usage: $0 [--auth]" >&2
	exit 2
fi

for command_name in curl docker getent grep head mktemp sed stty; do
	if ! command -v "$command_name" >/dev/null 2>&1; then
		echo "Missing required command: $command_name" >&2
		exit 1
	fi
done

work_dir=$(mktemp -d)
cleanup() {
	if [ -t 0 ]; then
		stty echo 2>/dev/null || true
	fi
	rm -f \
		"$work_dir/local-health.json" \
		"$work_dir/public-health.json" \
		"$work_dir/public-root.html" \
		"$work_dir/unauthorized-response.txt" \
		"$work_dir/login-headers.txt" \
		"$work_dir/login-response.txt" \
		"$work_dir/session-root.html" \
		"$work_dir/session-refresh.html" \
		"$work_dir/cookies.txt"
	rmdir "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

pass() {
	printf 'PASS  %s\n' "$1"
}

fail() {
	printf 'FAIL  %s\n' "$1" >&2
	exit 1
}

expect_equal() {
	actual=$1
	expected=$2
	message=$3
	[ "$actual" = "$expected" ] || fail "$message, received $actual"
	pass "$message"
}

getent ahosts "$public_host" >/dev/null 2>&1 || fail "public hostname resolves"
pass "public hostname resolves"

curl --fail --silent --show-error "$local_origin/health" >"$work_dir/local-health.json"
grep -q '"status":"ok"' "$work_dir/local-health.json" || fail "local health response is ready"
pass "local health response is ready"

curl --fail --silent --show-error "$origin/health" >"$work_dir/public-health.json"
grep -q '"status":"ok"' "$work_dir/public-health.json" || fail "public health response reaches the app"
pass "public health response reaches the app"

curl --fail --silent --show-error "$origin/" >"$work_dir/public-root.html"
grep -q 'login-crt' "$work_dir/public-root.html" || fail "anonymous visitors see the password gate"
pass "anonymous visitors see the password gate"

unauthorized_status=$(curl --silent --show-error \
	--output "$work_dir/unauthorized-response.txt" \
	--write-out '%{http_code}' \
	--request POST \
	--header 'content-type: application/json' \
	--data '{}' \
	"$origin/api/intake-insights")
expect_equal "$unauthorized_status" "401" "anonymous API requests are rejected"

container_health=$(docker inspect --format '{{.State.Health.Status}}' "$app_container")
expect_equal "$container_health" "healthy" "application container is healthy"

published_port=$(docker port "$app_container" 3000/tcp)
case "$published_port" in
	127.0.0.1:*) pass "application port is bound only to IPv4 loopback" ;;
	*) fail "application port is bound only to IPv4 loopback" ;;
esac

expect_equal "$(docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' "$app_container")" \
	"unless-stopped" "application restarts after host or daemon recovery"
expect_equal "$(docker inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$app_container")" \
	"true" "application root filesystem is read-only"
expect_equal "$(docker inspect --format '{{.Config.User}}' "$app_container")" \
	"node" "application runs as the unprivileged node user"
expect_equal "$(docker inspect --format '{{.HostConfig.Init}}' "$app_container")" \
	"true" "application has an init process"

security_options=$(docker inspect --format '{{json .HostConfig.SecurityOpt}}' "$app_container")
printf '%s' "$security_options" | grep -q 'no-new-privileges:true' || fail "no-new-privileges is enabled"
pass "no-new-privileges is enabled"

dropped_capabilities=$(docker inspect --format '{{json .HostConfig.CapDrop}}' "$app_container")
printf '%s' "$dropped_capabilities" | grep -q 'ALL' || fail "all Linux capabilities are dropped"
pass "all Linux capabilities are dropped"

expect_equal "$(docker inspect --format '{{.State.Running}}' "$tunnel_container")" \
	"true" "Cloudflare Tunnel container is running"
expect_equal "$(docker inspect --format '{{.HostConfig.NetworkMode}}' "$tunnel_container")" \
	"host" "Cloudflare Tunnel can reach the loopback app"

if command -v systemctl >/dev/null 2>&1; then
	legacy_active=$(systemctl is-active ideation-akinator.service 2>/dev/null || true)
	legacy_enabled=$(systemctl is-enabled ideation-akinator.service 2>/dev/null || true)
	expect_equal "$legacy_active" "inactive" "legacy application service is inactive"
	expect_equal "$legacy_enabled" "disabled" "legacy application service is disabled"
fi

if [ "$check_auth" = true ]; then
	if [ ! -t 0 ]; then
		fail "authenticated check requires an interactive terminal"
	fi

	printf 'Shared password: '
	stty -echo
	IFS= read -r shared_password
	stty echo
	printf '\n'

	login_status=$(curl --silent --show-error \
		--dump-header "$work_dir/login-headers.txt" \
		--output "$work_dir/login-response.txt" \
		--cookie-jar "$work_dir/cookies.txt" \
		--write-out '%{http_code}' \
		--request POST \
		--header 'accept: text/html,application/xhtml+xml' \
		--header 'content-type: application/x-www-form-urlencoded' \
		--header "origin: $origin" \
		--header "referer: $origin/" \
		--data-urlencode "password=$shared_password" \
		"$origin/?/login")
	shared_password=

	if [ "$login_status" != "303" ]; then
		if grep -q 'That password did not wake the oracle' "$work_dir/login-response.txt"; then
			fail "shared password was rejected"
		fi
		if grep -q 'Run the token-free visual demo' "$work_dir/login-response.txt"; then
			fail "login response followed its redirect unexpectedly"
		fi
		response_title=$(grep -o '<title>[^<]*' "$work_dir/login-response.txt" | head -1 | sed 's/<title>//' || true)
		if [ -n "$response_title" ]; then
			fail "shared password starts a session, received $login_status page $response_title"
		fi
		fail "shared password starts a session, received $login_status"
	fi
	pass "shared password starts a session"
	grep -qi '^set-cookie: ideation_akinator_session=.*HttpOnly' "$work_dir/login-headers.txt" || \
		fail "session cookie is HTTP-only"
	pass "session cookie is HTTP-only"
	grep -qi '^set-cookie: ideation_akinator_session=.*Secure' "$work_dir/login-headers.txt" || \
		fail "session cookie is secure"
	pass "session cookie is secure"
	grep -qi '^set-cookie: ideation_akinator_session=.*SameSite=Strict' "$work_dir/login-headers.txt" || \
		fail "session cookie uses SameSite Strict"
	pass "session cookie uses SameSite Strict"

	curl --fail --silent --show-error \
		--cookie "$work_dir/cookies.txt" "$origin/" >"$work_dir/session-root.html"
	grep -q 'login-crt' "$work_dir/session-root.html" && \
		fail "authenticated session returned to the password gate"
	grep -q 'Lock workshop' "$work_dir/session-root.html" || \
		fail "authenticated session reaches the workshop"
	pass "authenticated session reaches the workshop"

	curl --fail --silent --show-error \
		--cookie "$work_dir/cookies.txt" "$origin/" >"$work_dir/session-refresh.html"
	grep -q 'login-crt' "$work_dir/session-refresh.html" && \
		fail "refreshed session returned to the password gate"
	grep -q 'Lock workshop' "$work_dir/session-refresh.html" || \
		fail "authenticated session survives refresh"
	pass "authenticated session survives refresh"
fi

printf '\nLive deployment verification passed for %s\n' "$origin"
