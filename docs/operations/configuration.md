---
sidebar_position: 8
title: Server configuration
description: How the RapidMX server reads its configuration, how a setting maps to an environment variable, and every setting the server defines with its default.
---

# Server configuration

Most of what you'll ever change about a RapidMX server is set in the admin console or by the installers. Underneath,
the server has a configuration tree of a few hundred settings: database connections, scanner addresses, job schedules,
rate limits, plugin installation rules. You reach for it when you need something the console and the Helm values
don't cover, for example pointing message storage at S3, turning on DNSSEC validation, or raising the upload size limit.

This page explains how settings are read and how to set them in each deployment, then lists every setting the server
itself defines. The [Helm chart reference](helm-chart.md) covers the chart's own values, which set many of these for
you.

## How settings are read

The server uses [nconf](https://github.com/indexzero/nconf) with four layers. The first one that has a value wins:

1. **Plugin settings saved in the admin console.** Only keys a plugin's manifest declares, and never one of the
   server's own protected keys (below).
2. **Command-line arguments.**
3. **Environment variables.**
4. **The defaults** in the server's `config.mongo.ts` or `config.sql.ts`, listed on this page.

### Environment variable names

A setting's path is written with `:` in this documentation (`mail:scan:av:clamav:host`). As an environment variable,
each `:` becomes a double underscore, and the case stays as it is:

```bash
mail__scan__av__clamav__host=clamav
datastores__mongo__url=mongodb://mongo
```

Values are parsed, so `true`, `false` and numbers become booleans and numbers, and a JSON value becomes an array or
object. Set the most specific path you can: `mail__basic_auth__enabled=false` changes one value and leaves the rest of
`mail:basic_auth` at its defaults.

### Setting them in each deployment

| Deployment | Where |
| --- | --- |
| Docker Compose | The `environment:` list of the `server` service, in an override file like the `docker-compose.prod.yml` of the [production steps](../getting-started/docker-compose.md#run-docker-compose-in-production) |
| Kubernetes, k3s, AWS | The chart value `service.config`, for example `--set service.config.mail__dns__resolver=doh-dnssec`. Each key is rendered into the server's ConfigMap as an environment variable, and the pods restart when it changes. |

`service.config` is a ConfigMap, not a Secret. Put credentials in a Secret instead (the chart's own secrets, OpenBao,
or an IAM role for AWS services) rather than in `service.config`.

### What a plugin can't change

A plugin's saved settings can never set the server's own configuration. These keys, and everything under them, are
protected: `trusted_roles`, `trusted_proxies`, `auth`, `cookie_secret`, `cookies`, `session`, `cors`, `ssl`,
`datastores`, `base_path`, `rateLimit`, `telemetry_services`, `service_name`, `version`, `max_body_size`, `shutdown`,
`system`, `metrics`, `diagnostics`, `class_loader`, `cluster_url`, `react`, `static_assets`, `giphy`, `integrations`,
`config_encryption`, `logs`, `mail:zero_access`,
`mail:transport`, `mail:internal`, `mail:escrow`, `mail:pki`, `mail:auth_server_url`, `mail:basic_auth`,
`mail:security`, `mail:blob`, `mail:scan`, `mail:dns`, `mail:dkim`, `mail:domains`, `mail:auto_provision`,
`mail:default_quota_bytes`, `mail:compose`, `mail:search`, `mail:preferences`, `mail:branding`, and the schedules of
the server's built-in jobs under `mail:jobs`.

## Secrets checked at startup

Unless `NODE_ENV` is exactly `dev` or `development`, the server **refuses to start** while any of these is empty or
still its publicly known development default:

| Setting | Environment variable |
| --- | --- |
| `cookie_secret` | `cookie_secret` |
| `auth:secret` | `auth__secret` |
| `mail:transport:ingest:secret` | `mail__transport__ingest__secret` |

`NODE_ENV=test` does **not** skip this check. A production server also refuses to start without a
[configuration keyring](secrets-and-openbao.md#the-configuration-keyring). The server also logs an error at startup when
`mail:escrow:audit_hmac_key` is empty, or when the ingest secret is shorter than 16 characters, and a warning when
`mail:security:trusted_authserv_id` is empty.

## Variables outside the configuration tree

| Variable | What it does |
| --- | --- |
| `NODE_ENV` | `production` for real use. `dev`, `development` or `test` turn on development behaviour, such as skipping an unreachable spam or virus scanner. Only `dev` and `development` allow the development secrets. |
| `PORT` | The HTTP port (`3000` in the image) |
| `SENDMAIL_RELAY_HOST` | Where outgoing mail is relayed (the image's default is `postfix`). The chart sets it from `mail.relay.host`. |
| `SENDMAIL_RELAY_PORT` | Relay port (default `25`) |
| `SENDMAIL_RELAY_TLS` | `on` or `off` (default `off`) |
| `SENDMAIL_FROM_ADDRESS` | Envelope sender of relayed mail (default `mailer@localhost`; the chart sets `mailer@<mail host>`) |
| `ssl__key`, `ssl__cert` | Paths of a TLS key and certificate. Set, the server serves HTTPS itself. The chart sets them with `global.gateway.tlsTermination=pod`. |

## Reference

The defaults below are the server's own. `@rapidmx/restapi`, the library that implements mail, calendars and the
other features, reads further settings with defaults of its own (for example most `mail:jobs:*` schedules). The
Diagnostics page's **Configuration** table in the admin console shows the effective value of every setting, with
secrets withheld. See [Monitoring](monitoring.md).

### General

| Setting | Default | What it does |
| --- | --- | --- |
| `max_body_size` | `104857600` (100 MiB) | Largest request body, buffered in memory. Raise it for very large mailbox imports. |
| `cookie_secret` | development default | Signs cookies. Required in production. |
| `trusted_roles` | `["admin"]` | Roles with administrative rights |
| `trusted_proxies` | `[]` | Proxies whose `X-Forwarded-For` is believed. Accepts CIDR ranges for rate limiting. The chart sets it from `global.trustedProxies`. |
| `cors:origins` | `["http://localhost:3000"]` | Origins allowed credentialed cross-origin requests. The chart sets it. |
| `cluster_url` | `http://localhost` | The deployment's base URL |
| `logger:level` | `info` in production, `debug` otherwise | Log level |
| `logger:file` | unset | A file to log to |
| `metrics:authRequired` | `true` | Require a trusted role for `/api/metrics` |
| `giphy:enabled` | `true` | Offer GIF search. **Integrations** in the admin console can override it. |
| `giphy:api_key` | placeholder | Giphy API key for GIF search. The placeholder leaves GIF search off. |
| `integrations:stun:urls` | unset | JSON list of `stun:` and `stuns:` URIs for the Video Conferencing plugin |
| `shutdown:drain_delay_ms` | `5000` | On `SIGTERM`, how long `/api/status` answers `503` before the server stops |
| `shutdown:timeout_ms` | `25000` | How long stopping may take before the process exits anyway |
| `telemetry_services:token_roles` | `["telemetry"]` | Roles of the token telemetry events are sent with |
| `telemetry_services:token_ttl_seconds` | `3600` | That token's lifetime |

### Datastores

On MongoDB the datastores are `acl` and `mongo`; on PostgreSQL they are `acl` and `sql`.

| Setting | Default | What it does |
| --- | --- | --- |
| `datastores:acl:type` | `mongodb` / `postgres` | Access control lists datastore type |
| `datastores:acl:host` | `localhost` | Host |
| `datastores:acl:database` | `rrst_acls` | Database name |
| `datastores:acl:url` | unset | Connection URL, used instead of host and database |
| `datastores:acl:synchronize` | `true` | Create and update the schema at startup |
| `datastores:mongo:type` | `mongodb` | Main datastore (MongoDB) |
| `datastores:mongo:host` | `localhost` | Host |
| `datastores:mongo:database` | `rrst_auth` | Database name |
| `datastores:mongo:url` | unset | Connection URL |
| `datastores:mongo:synchronize` | `true` | Create and update collections and indexes at startup |
| `datastores:sql:type` | `postgres` | Main datastore (PostgreSQL) |
| `datastores:sql:synchronize` | `true` | Create and alter tables at startup. See the warning in [Upgrading](upgrading.md). |
| `datastores:sql:invalidWhereValuesBehavior` | `{ "null": "sql-null" }` | Required on every SQL datastore (also set on `acl`) |
| `datastores:cache:type`, `:url` | `redis`, `redis://localhost` | Cache |
| `datastores:events:type`, `:url` | `redis`, `redis://localhost` | Live events. Also copied to `datastores:notifications` unless that is set. |
| `datastores:logs:type`, `:url` | `redis`, `redis://localhost` | Logs |

### Static files

| Setting | Default | What it does |
| --- | --- | --- |
| `static_assets:compress` | `true` | Send brotli and gzip variants of the browser bundles |
| `static_assets:memory_cache_bytes` | `67108864` (64 MiB) | Memory for cached files and compressed variants |
| `static_assets:brotli_quality` | `9` | Brotli quality of variants made on the fly |
| `react:manifestPath` | `dist/public/.vite/manifest.json` | The browser build's manifest |

### Sign-in tokens

| Setting | Default | What it does |
| --- | --- | --- |
| `auth:secret` | development default | Verifies tokens from the auth-server. Must equal the auth-server's. Required in production. |
| `auth:options:audience` | `mydomain.com` | Expected token audience |
| `auth:options:issuer` | `api.mydomain.com` | Expected token issuer |
| `auth:allowQueryParam` | `false` | Accept a token in the query string |
| `auth:cookie:enabled` | `true` | Read the token from the `jwt` cookie |
| `auth:strategy` | `auth.JWTStrategy` | Token verification strategy |
| `mail:auth_server_url` | `http://localhost:3001` | The auth-server's URL, as browsers reach it. The server also calls it to check app passwords. |

### App passwords (Outlook and ActiveSync)

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:basic_auth:enabled` | `true` | Accept a user name and app password on the paths below |
| `mail:basic_auth:paths` | `["/mapi","/Microsoft-Server-ActiveSync"]` | Where HTTP Basic is accepted |
| `mail:basic_auth:realm` | `RapidMX` | The realm a `401` names |
| `mail:basic_auth:cache_ttl_ms` | `300000` | How long a successful sign-in is remembered |
| `mail:basic_auth:cache_max_entries` | `5000` | Size of that cache |
| `mail:basic_auth:failure_limit` | `10` | Failures per client address and user name before a `429` |
| `mail:basic_auth:ip_failure_limit` | `50` | Failures per client address, any user name |
| `mail:basic_auth:name_failure_limit` | `50` | Failures per user name from any address, after which attempts are slowed down |
| `mail:basic_auth:name_delay_ms` | `1000` | Delay per failure past that limit, up to ten times this |
| `mail:basic_auth:failure_window_ms` | `900000` | The window the failures are counted in |

### Mailboxes and mail

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:default_quota_bytes` | `5000000000` | Initial default quota of the mailbox policy |
| `mail:auto_provision:enabled` | `true` | Initial "create a mailbox on first sign-in" setting of the mailbox policy |
| `mail:auto_provision:quota_bytes` | `5000000000` | Quota of such a mailbox |
| `mail:auto_provision:timeout_ms` | `10000` | Time limit for creating it |
| `mail:compose:max_attachment_bytes` | `25000000` | Combined attachments of one message |
| `mail:preferences:background_max_bytes` | `8388608` (8 MiB) | Largest background image a user may upload |
| `mail:search:mongo:datasource` | `mongo` | Search datastore (MongoDB). On PostgreSQL: `mail:search:postgres:datasource`, `sql`. |
| `mail:branding:public_url` | `/api/system` | Base of self-hosted logo and stylesheet URLs |
| `mail:autodiscover:public_url` | `""` | The `https://` address Autodiscover advertises. Empty: Autodiscover answers nothing. |
| `mail:booking:public_url` | `""` | The booking pages' address, for links in booking e-mails |
| `mail:jobs:scheduled_send:concurrency` | `4` | Messages scanned and relayed at once by background and scheduled send |
| `mail:jobs:scheduled_send:drain_ms` | `15000` | How long a shutdown waits for sends in flight |
| `mail:jobs:meeting_scheduling:schedule` | `*/10 * * * * *` | How often meeting invitations and updates are sent (cron, with seconds) |
| `mail:jobs:acme_enrollment_driver:schedule` | `0 */5 * * * *` | How often pending signing-certificate requests are checked |
| `mail:jobs:acme_enrollment_driver:expiry_warning_days` | `30` | Warn about signing certificates expiring within this many days |
| `mail:jobs:acme_enrollment_driver:failure_audit_after` | `3` | Failed CA checks in a row before an audit log entry |

### Zero-access encryption

`allowed` is only the default of **Allow zero-access encryption**. A value saved in the admin console wins.

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:zero_access:allowed` | `true` | Whether mailboxes may store mail encrypted at rest |
| `mail:zero_access:extraction_budget_ms` | `5000` | Total time for indexing a message's attachments during delivery. What doesn't fit is left for the user's app. |
| `mail:zero_access:extraction_max_bytes` | `10485760` (10 MiB) | Largest attachment indexed during delivery |
| `mail:zero_access:compaction_grace_hours` | `24` | How long after a week ends its search entries may be compacted |
| `mail:zero_access:max_segment_bytes` | `67108864` (64 MiB) | Largest search segment a client may upload |
| `mail:jobs:zero_access_backfill:schedule` | `0 * * * * *` | How often existing data is sealed |
| `mail:jobs:zero_access_backfill:batch_size` | `100` | Messages sealed per run across all mailboxes |
| `mail:jobs:zero_access_backfill:deleted_scheduled_send_days` | `30` | Days a deleted scheduled message stays readable, so restoring it still sends it |
| `mail:encryption:openpgp_allowed` | `true` | Default of **Allow OpenPGP**. A value saved in the admin console wins. |

### Domains and DNS publishing

The chart sets most of these from its `dns.*` and `mail.domains` values. See
[DNS publishing](helm-chart.md#dns-publishing).

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:domains` | `[]` | Domains created at start: names, objects of `name`, `dnsProvider`, `dmarcPolicy`, `dmarcReportEmail` and `aliasOf`, or a comma-separated string |
| `mail:domain_verification:accept_legacy_apex` | `true` | Also verify a new domain by the old ownership record at its root, besides `_rapidmx-verify.<domain>` |
| `mail:dns:controller:subject` | `""` | The ServiceAccount the DNS controller calls `/internal/dns` as. Empty refuses every call. |
| `mail:dns:desired_state:long_poll_seconds` | `55` | How long the controller's long poll is held |
| `mail:dns:publish:ttl` | `300` | TTL of published records |
| `mail:dns:publish:addresses` | `[]` | Addresses of the hosts' A/AAAA records |
| `mail:dns:publish:hosts` | `[]` | The deployment's own hosts to publish |
| `mail:dns:publish:external_dns_image` | external-dns v0.23.0, by digest | The image the controller runs |
| `mail:dns:takeover:min_interval_seconds` | `60` | Shortest time between automatic takeover passes |
| `mail:dns:takeover:recheck_seconds` | `21600` | How long a name with nothing to take over isn't looked at again |
| `mail:dns:bootstrap_provider` | `""` | JSON of the provider config the installer asked for |
| `mail:dns:bootstrap_credentials_dir` | `/etc/rapidmx/dns-bootstrap` | Where its credentials Secret is mounted |

### Configuration encryption

| Setting | Default | What it does |
| --- | --- | --- |
| `config_encryption:keyring_file` | `""` | File holding the keyring. The chart sets `/etc/rapidmx/config-keyring/keyring.json`. Wins over `keyring`. |
| `config_encryption:keyring` | `""` | The keyring as JSON, for development and tests |
| `config_encryption:keyring_store:backend` | `none` | Where a rotation writes: `kubernetes`, `openbao`, `file` or `none` (rotation refused). The chart sets it. |
| `config_encryption:keyring_store:secret_name` | `""` | The Secret, with `kubernetes` |
| `config_encryption:keyring_store:kv_mount` | `secret` | The KV v2 mount, with `openbao` |
| `config_encryption:keyring_store:kv_path` | `""` | The KV path, with `openbao` |
| `config_encryption:activation:heartbeat_seconds` | `30` | How often each server copy reports the keys it has loaded |
| `config_encryption:activation:warn_minutes` | `15` | When the console warns that a new key hasn't reached every copy |
| `config_encryption:rotation:schedule` | `*/30 * * * * *` | How often the rotation job looks for work |
| `config_encryption:reencrypt:batch_size` | `100` | Rows re-encrypted per page |
| `config_encryption:plugin_secrets:pod_selector` | `""` | Label selector of the server's pods. The chart sets it. |
| `config_encryption:plugin_secrets:wait_for_rollout` | `true` | Wait for every server pod to run this release before encrypting plugin secrets |

### Message storage

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:blob:backend` | `local` | `local` (a directory) or `s3` |
| `mail:blob:local:root` | `./data/blobs` | Directory of message bodies and attachments (`/app/data/blobs` in the image) |
| `mail:blob:s3:bucket` | `""` | S3 bucket |
| `mail:blob:s3:region` | `""` | Its region |
| `mail:blob:s3:prefix` | `""` | Key prefix, to share a bucket |
| `mail:blob:s3:endpoint` | `""` | Endpoint of an S3-compatible service other than AWS (MinIO, R2, Spaces) |
| `mail:blob:s3:force_path_style` | `false` | Path-style requests, needed by MinIO and most self-hosted services |
| `mail:blob:s3:access_key_id` | `""` | Static access key. Empty: the AWS credential chain (an IAM role). Set both or neither. |
| `mail:blob:s3:secret_access_key` | `""` | Its secret |

### Mail transport

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:transport:provider` | `postfix` | `postfix` or `ses` |
| `mail:transport:ses:region` | `""` | SES region. Empty: the SDK's own resolution. |
| `mail:transport:ses:configuration_set` | `""` | SES configuration set |
| `mail:transport:ingest:secret` | development default | The `/internal/mta` bearer secret. Required in production, 16 characters or more. |
| `mail:transport:sendmail:path` | `/usr/sbin/sendmail` | The `sendmail` binary the Postfix transport runs |
| `mail:dkim:key_dir` | `/var/lib/rspamd/dkim` | Where DKIM private keys are written |
| `mail:dkim:selector` | `mail` | DKIM selector, until a domain's first rotation |
| `mail:dkim:rotation:enabled` | `true` | Start DKIM rotations on schedule. See [Key rotation](mail-transport.md#key-rotation). |
| `mail:dkim:rotation:interval_days` | `180` | Days before the next rotation starts |
| `mail:dkim:rotation:overlap_days` | `7` | Days the old record stays published after signing switches |
| `mail:dkim:rotation:publish_grace_hours` | `48` | Hours the new record must be live before signing switches |
| `mail:dkim:rotation:key_bits` | `2048` | RSA size of each new key, 2048 to 4096 |
| `mail:dkim:rotation:max_starts_per_run` | `10` | Rotations started per run and server copy |
| `mail:jobs:dkim_rotation:schedule` | `0 0 * * * *` | How often the rotation job runs |
| `mail:dns:mx_hostname` | unset | The MX host name in the DNS checklist. The chart and Compose set it. |
| `mail:dns:resolver` | `node` | `node`, or `doh-dnssec` to validate DNSSEC through a DNS-over-HTTPS resolver |
| `mail:dns:doh:endpoint` | `https://cloudflare-dns.com/dns-query` | The DoH resolver |
| `mail:dns:doh:require_ad` | `true` | Treat a domain that fails or lacks DNSSEC as a lookup failure |
| `mail:dns:doh:timeout_ms` | `5000` | DoH timeout |
| `mail:security:trusted_authserv_id` | `""` | `authserv-id` of trusted `Authentication-Results`. Empty: no sender is DKIM-verified. See [Mail transport](mail-transport.md). |

### Spam and virus scanning

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:scan:spam:rspamd:url` | `http://localhost:11333` | rspamd's scan worker |
| `mail:scan:spam:rspamd:controller_url` | `""` | rspamd's controller. Empty: `url` with port 11334. |
| `mail:scan:spam:rspamd:controller_password` | `""` | Controller password |
| `mail:scan:spam:rspamd:controller_timeout_ms` | `10000` | Timeout of a learn request |
| `mail:scan:spam:learn:enabled` | `true` | Teach rspamd from users' junk reports |
| `mail:scan:av:clamav:host` | `127.0.0.1` | ClamAV host |
| `mail:scan:av:clamav:port` | `3310` | ClamAV port |

### Encryption certificates

| Setting | Default | What it does |
| --- | --- | --- |
| `mail:pki:backend` | `local` | Encryption CA: `local` (a key on disk) or `openbao` (an OpenBao PKI mount) |
| `mail:pki:local_ca:dir` | `/var/lib/rapidmx/pki` | The local CA's directory |
| `mail:pki:local_ca:subject` | `CN=RapidMX Local Encryption CA` | The local CA's subject |
| `mail:pki:local_ca:validity_days` | `397` | Certificate validity |
| `mail:pki:openbao:address` | `http://127.0.0.1:8200` | OpenBao address |
| `mail:pki:openbao:mount` | `pki` | PKI mount |
| `mail:pki:openbao:role` | `rapidmx` | Issuing role |
| `mail:pki:openbao:token` | `""` | Token that may sign and revoke, with the `token` method |
| `mail:pki:openbao:ca_file` | `""` | PEM bundle to verify OpenBao's listener with. Empty: the system's trust store. |
| `mail:pki:openbao:auth:method` | `token` | `token`, or `kubernetes` to log in with the pod's ServiceAccount token |
| `mail:pki:openbao:auth:role` | `""` | OpenBao role, with `kubernetes` |
| `mail:pki:openbao:auth:mount_path` | `kubernetes` | Kubernetes auth mount |
| `mail:pki:openbao:auth:token_file` | `/var/run/secrets/openbao/token` | The projected ServiceAccount token |
| `mail:pki:openbao:timeout_ms` | `5000` | Request timeout |
| `mail:pki:openbao:serial_map_path` | `/var/lib/rapidmx/pki/openbao-serials.json` | Serial number map |
| `mail:pki:signing_enrollment:backend` | `manual` | Signing certificates: `manual` or `rfc8823`. The chart's `auto` picks one. |
| `mail:pki:manual_enrollment:store_path` | `/var/lib/rapidmx/pki/manual-enrollments.json` | Pending manual requests |
| `mail:pki:rfc8823:directory_url` | `https://acme.castle.cloud/acme/directory` | RFC 8823 ACME directory |
| `mail:pki:rfc8823:contact_email` | `""` | ACME account contact |
| `mail:pki:rfc8823:store_dir` | `/var/lib/rapidmx/pki/rfc8823` | ACME account key and request state |
| `mail:pki:rfc8823:poll_interval_seconds` | `300` | How often a pending request is checked |
| `mail:pki:rfc8823:max_pending_hours` | `168` | How long a request may wait on the CA |
| `mail:escrow:audit_hmac_key` | unset | Keys the escrow audit log. Never change it once set. |

### Diagnostics

| Setting | Default | What it does |
| --- | --- | --- |
| `diagnostics:namespace` | `""` | Kubernetes namespace to inspect. Empty: the pod's own. |
| `diagnostics:timeout_ms` | `5000` | Time limit of one Kubernetes API request |

### Rate limits

The top-level limits apply to anonymous requests, `authenticated` to signed-in users.

| Setting | Default | What it does |
| --- | --- | --- |
| `rateLimit:enabled` | `true` | Rate limiting |
| `rateLimit:ipv6_prefix_length` | `64` | IPv6 clients are counted per network of this size |
| `rateLimit:maxAttempts` | `100` | Requests per endpoint |
| `rateLimit:windowSeconds` | `60` | In this window |
| `rateLimit:ip:enabled` | `true` | Also count per source address |
| `rateLimit:ip:maxAttempts` | `100` | Requests per address |
| `rateLimit:ip:windowSeconds` | `300` | In this window |
| `rateLimit:authenticated:maxAttempts` | `10000` | Requests per user and endpoint |
| `rateLimit:authenticated:windowSeconds` | `300` | In this window |
| `rateLimit:authenticated:ip:enabled` | `true` | Also count signed-in requests per address |
| `rateLimit:authenticated:ip:maxAttempts` | `20000` | Requests per address |
| `rateLimit:authenticated:ip:windowSeconds` | `300` | In this window |

### Plugins

| Setting | Default | What it does |
| --- | --- | --- |
| `system:plugins:defaults` | ActiveSync, Autodiscover, Booking pages, MAPI and Meet, `latest` | Installed the first time a server starts against an empty database |
| `system:plugins:registry` | `https://registry.npmjs.org` | npm registry |
| `system:plugins:registry_token` | `""` | Token for a private registry |
| `system:plugins:namespaces` | `["@rapidmx"]` | npm scopes the admin console searches and allows |
| `system:plugins:allowed_packages` | `["@rapidmx/*"]` | Other packages an administrator may add |
| `system:plugins:dir` | `<server directory>/plugins` | Where plugins are installed (`/app/plugins` in the image) |
| `system:plugins:sources` | `{}` | Package name to a local `.tgz`, installed instead of the registry version |
| `system:plugins:require_integrity` | `true` | Require the registry's integrity hash |
| `system:plugins:npm_timeout_ms` | `600000` | Time limit of an npm install |
| `system:plugins:max_install_bytes` | `524288000` | Largest total installed size. `0` disables the check. |
| `system:plugins:uploads:enabled` | `true` | Allow installing an uploaded `npm pack` file |
| `system:plugins:uploads:max_bytes` | `52428800` | Largest uploaded pack |
| `system:plugins:restart:drain_delay_ms` | `15000` | How long a copy reports not ready before restarting for a plugin change |
| `system:plugins:restart:lock_release_delay_ms` | `15000` | How long a restarted copy holds the restart lock once serving |
| `system:plugins:restart:lock_ttl_ms` | `60000` | Restart lock expiry |
| `system:plugins:restart:jitter_ms` | `30000` | Random wait before restarting, without a cache datastore |
| `system:plugins:restart:install_retry_ms` | `60000` | Retry delay after a failed npm install, doubling |
| `system:plugins:restart:install_retry_max_ms` | `600000` | Longest retry delay |
| `system:plugins:restart:install_retry_max_attempts` | `6` | Failed installs in a row before retrying stops |
| `system:plugins:restart:safe_mode_retry_ms` | `300000` | Retry delay in safe mode (running without plugins after failed starts), doubling |
| `system:plugins:restart:safe_mode_retry_max_ms` | `3600000` | Longest safe mode retry delay |
| `system:plugins:restart:max_lock_hold_ms` | `900000` | Longest a starting copy may hold the restart lock |
| `system:plugins:purge:check_ms` | `30000` | How often unfinished plugin data deletions are checked |
| `system:plugins:purge:initial_delay_ms` | `10000` | Delay before the first check |
| `system:plugins:purge:grace_ms` | `180000` | Wait for servers that were starting when a plugin was uninstalled |
| `system:plugins:purge:lease_ms` | `120000` | How long a deletion's claim lasts |
| `system:plugins:purge:hook_timeout_ms` | `60000` | Time limit of a plugin's own clean-up hook |

Plugins also read settings of their own, under their own names, such as `mail:videoconf:*` for Meet. Those are edited in
the plugin's settings in the admin console. See [Plugins](../administration/plugins.md).
