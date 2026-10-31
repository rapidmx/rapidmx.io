---
sidebar_position: 3
title: Docker Compose
description: Run RapidMX on your own computer with Docker Compose to try it out, and what it takes to run the same stack in production.
---

# Docker Compose

Docker Compose is the quickest way to see RapidMX working. It starts the server, the auth-server, a database, Redis,
rspamd and ClamAV on your own computer, reachable only from that computer. It's meant for evaluation: it runs in
development mode with placeholder secrets and has no mail server, so it can't send or receive real mail until you add
one. If you want a server people will actually use, the [single server](single-server.md) or
[Kubernetes](kubernetes.md) options are simpler to run well.

Unlike the other options, Compose builds the server image from a checkout of the source.

## What you need

- Docker with Compose v2.20 or later (`docker compose version`)
- Git
- A few GiB of free memory (ClamAV, the virus scanner, uses about 1 GiB on its own)

## Start it

1. Get the code:

   ```bash
   git clone https://github.com/rapidmx/server
   cd server
   ```

2. Start everything. The first run builds the server image, which takes several minutes:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml up -d --build
   ```

   - Use `docker-compose.sql.yml` instead to run on PostgreSQL rather than MongoDB, and use it in every command below
     too.
   - `-p rapidmx` names the project. Keep it on every command.

3. Wait until `server` and `auth-server` report `healthy`:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml ps --format 'table {{.Service}}\t{{.Status}}\t{{.Ports}}'
   ```

   ```text
   SERVICE       STATUS                   PORTS
   auth-server   Up 7 minutes (healthy)   127.0.0.1:3001->3000/tcp
   clamav        Up 7 minutes (healthy)   127.0.0.1:3310->3310/tcp
   mongo         Up 7 minutes             27017/tcp
   redis         Up 7 minutes             6379/tcp
   rspamd        Up 7 minutes (healthy)   127.0.0.1:11333->11333/tcp
   server        Up 7 minutes (healthy)   127.0.0.1:3000->3000/tcp
   ```

4. Read the `admin` account's password. The auth-server created it on its first start:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml exec auth-server cat /app/passwords
   ```

   ```text
   Name=admin,Password=<your password>,Roles=admin
   ```

   :::warning
   The file is deleted the next time the auth-server restarts. Save the password now.
   :::

5. Open `http://localhost:3000` and continue with [First-time setup](first-time-setup.md).

## What's running

| Service | Port on your computer | What it is |
| --- | --- | --- |
| `server` | `127.0.0.1:3000` | The RapidMX server: web app, admin console and API |
| `auth-server` | `127.0.0.1:3001` | Sign-in and accounts |
| `mongo` or `postgres` | not published | The database, with its data in the `mongo_data` or `postgres_data` volume |
| `redis` | not published | Cache and live events |
| `rspamd` | `127.0.0.1:11333` | Spam scoring |
| `clamav` | `127.0.0.1:3310` | Virus scanning. It takes a few minutes to load its signatures on first start. |

The server keeps its data in three more named volumes: `blob_data` (message bodies and attachments),
`dkim_rspamd_keys` (DKIM private keys) and `pki_data` (the encryption certificate authority). See
[Backup and restore](../operations/backup-and-restore.md) before you put anything you care about in them.

:::note
In development mode (`NODE_ENV=dev`, the default here), a spam or virus scanner that can't be reached at all is
skipped with a warning instead of holding mail back. With `NODE_ENV=production` a scanner outage makes every send fail
closed.
:::

## Stop and start

```bash
docker compose -p rapidmx -f docker-compose.mongo.yml stop
docker compose -p rapidmx -f docker-compose.mongo.yml start
```

`docker compose ... down` removes the containers but keeps the volumes. Adding `-v` deletes the volumes, and with them
every message, key and account. See [Uninstalling](../operations/uninstalling.md).

## Run Docker Compose in production

You can run the same stack for real mail, but you take on the work the other options do for you: HTTPS, the mail
server and keeping its domain list current. You need a server with a public address and the DNS records from [Before
you deploy](before-you-deploy.md).

1. Create a file named `.env` next to the compose files, with your own secrets. Generate each value marked `<random>`
   with `openssl rand -hex 32`:

   ```bash
   NODE_ENV=production
   PUBLIC_URL=https://mail.example.com
   AUTH_SERVER_PUBLIC_URL=https://auth.example.com
   MX_HOSTNAME=mail.example.com
   AUTH_AUDIENCE=example.com
   AUTH_ISSUER=auth.example.com
   AUTH_SECRET=<random>
   COOKIE_SECRET=<random>
   SESSION_SECRET=<random>
   AUTH_OAUTH_SERVER_ENCRYPTION_KEY=<random>
   ESCROW_AUDIT_HMAC_KEY=<random>
   MAIL_INGEST_SECRET=<random>
   SENDMAIL_RELAY_HOST=postfix
   ```

   :::warning Compose needs a configuration keyring of its own
   With `NODE_ENV=production` the server also refuses to start without a [configuration
   keyring](../operations/secrets-and-openbao.md#the-configuration-keyring), and the Compose files don't provide one.
   Add `config_encryption__keyring` to the server's `environment` in the compose file, holding
   `{"keys":[{"kid":"k1","key":"<32 bytes, base64>","createdAt":"2026-10-30T00:00:00Z"}]}`, with the key from
   `openssl rand -base64 32`. Back it up with your database. A keyring given this way can't be rotated from the admin console.
   :::

   :::warning
   With `NODE_ENV=production` the server refuses to start while its sign-in secret, cookie secret or mail ingest
   secret is empty or still a development default. Never change `ESCROW_AUDIT_HMAC_KEY` after the first start: escrow
   audit log entries chained under the old key stop verifying.
   :::

2. Let the sign-in cookie work across `mail.` and `auth.`. Create `docker-compose.prod.yml`:

   ```yaml
   services:
     auth-server:
       environment:
         - auth__cookie__access__domain=.example.com
         - auth__cookie__refresh__domain=.example.com
   ```

3. Start it with both files:

   ```bash
   docker compose -p rapidmx -f docker-compose.mongo.yml -f docker-compose.prod.yml up -d --build
   ```

4. Add HTTPS. The stack doesn't do it for you, and it only listens on `127.0.0.1`. Put a reverse proxy on the host
   (Caddy, nginx or Traefik) in front of it:

   - `https://mail.example.com` → `http://127.0.0.1:3000`
   - `https://auth.example.com` → `http://127.0.0.1:3001`

5. Add the mail server. In a checkout of [postfix-bridge](https://github.com/rapidmx/postfix-bridge), create a `.env`:

   ```bash
   MAIL_HOSTNAME=mail.example.com
   MAIL_DOMAINS=example.com
   MTA_INGEST_BASE_URL=http://server:3000/internal/mta
   MTA_INGEST_SECRET=<the same value as MAIL_INGEST_SECRET>
   ```

   Start it **in the same project**, so both stacks share a network:

   ```bash
   docker compose -p rapidmx up -d --build
   ```

   :::note
   Compose warns about "orphan containers" from now on. That is expected, because the two stacks share a project.
   Never answer it with `--remove-orphans`.
   :::

6. Postfix starts with a self-signed certificate and requires TLS from other mail servers. Copy a real certificate
   for `mail.example.com` into its `postfix_tls` volume as `tls.crt` and `tls.key`, then restart it:

   ```bash
   docker compose -p rapidmx restart postfix
   ```

7. Whenever you add a mail domain in the admin console, also add it to `MAIL_DOMAINS` (comma-separated) and restart
   Postfix with the same command. The Kubernetes options don't need this.

:::warning DKIM signing under Compose
The postfix-bridge Compose stack signs outgoing mail with a key its own Postfix image generates, not with the key the
RapidMX admin console tells you to publish in DNS. Its own documentation describes this stack as fine for evaluating
routing, but not for relying on outgoing DKIM signatures. If DKIM matters to you (it does for deliverability), use the
[single server](single-server.md) or [Kubernetes](kubernetes.md) option, whose Postfix signs with the server's keys.
See [Mail transport](../operations/mail-transport.md).
:::

### Settings you can put in `.env`

| Variable | What it does |
| --- | --- |
| `NODE_ENV` | `production` for a real deployment. The default, `dev`, allows the development secrets. |
| `AUTH_SECRET` | Signs sign-in tokens. Must be the same on the server and the auth-server, which the compose file guarantees. |
| `AUTH_AUDIENCE` / `AUTH_ISSUER` | The `aud` and `iss` of those tokens: your mail domain, and the auth-server's host name. |
| `AUTH_SERVER_PUBLIC_URL` | The address browsers use to reach the auth-server. |
| `AUTH_OAUTH_SERVER_ENCRYPTION_KEY` | The auth-server's OAuth key-encryption key. It also encrypts the SMTP and SMS secrets the auth-server stores. |
| `COOKIE_SECRET`, `SESSION_SECRET` | Sign cookies and sessions. |
| `ESCROW_AUDIT_HMAC_KEY` | Keys the tamper-evident escrow audit log. Generate once, never change. |
| `MAIL_INGEST_SECRET` | Lets postfix-bridge call the server. Must equal its `MTA_INGEST_SECRET`. |
| `PUBLIC_URL` | This server's public address, used in booking links and by Autodiscover (which accepts only an `https://` address). |
| `MX_HOSTNAME` | This server's mail host name, used in the DNS checklist's MX record. |
| `SENDMAIL_RELAY_HOST` | Where outgoing mail is handed to Postfix. `postfix` when both stacks share a project. Defaults to `host.docker.internal`. |
| `SERVER_ACL_DB_NAME`, `SERVER_MONGO_DB_NAME` | The server's database names on MongoDB (defaults `rapidmx_server_acls` and `rapidmx_server_mongo`). |
| `AUTH_SERVER_ACL_DB_NAME`, `AUTH_SERVER_MONGO_DB_NAME` | The auth-server's database names on MongoDB (defaults `rapidmx_auth_acls` and `rapidmx_auth_mongo`). |
| `SERVER_SQL_DB_NAME`, `AUTH_SERVER_SQL_DB_NAME` | The database names on PostgreSQL (defaults `rapidmx_server` and `rapidmx_auth`). |
| `AUTH_SERVER_IMAGE_TAG` | The auth-server image tag (default `latest`). |

Anything else the server reads can be set as an environment variable too. See [Server
configuration](../operations/configuration.md).

## Next steps

- [First-time setup](first-time-setup.md): sign in, add your domain and create your mailbox.
- [Upgrading](../operations/upgrading.md): `git pull` and rebuild, after a backup.
