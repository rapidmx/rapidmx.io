---
sidebar_position: 9
title: "Video calls: the TURN relay"
description: Why video meetings need a TURN server, how the bundled coturn is set up, which ports it needs and how to change or replace it.
---

# Video calls: the TURN relay

The Meet plugin connects meeting participants directly to each other, browser to browser. That works for most
networks, but a participant behind a strict firewall or NAT can't be reached directly. For them, a **TURN server**
relays the call's audio and video. Without one, those participants can't join, while everyone else is unaffected.

The Helm chart installs a TURN server, [coturn](https://github.com/coturn/coturn), and fills in the plugin's TURN
settings, so calls work as installed. The single-server installer leaves it on and opens its ports in the host
firewall. The AWS deployment turns it off (see [On AWS](#on-aws)). Docker Compose doesn't include one.

For how people use meetings, see [Video meetings](../user-guide/video-meetings.md).

## What it needs

coturn runs on the **node's own network** (`hostNetwork`), because TURN is mostly UDP, which the Gateway can't carry,
and relayed media must come from an address browsers can reach. On the node it runs on:

1. `coturn.hostname` (default: the server's `host`, for example `mail.example.com`) must resolve to the node's public
   address.
2. These ports must be open to the internet in every firewall and security group, and not used by anything else:

   | Port | Protocol | Value |
   | --- | --- | --- |
   | `3478` | TCP and UDP | `coturn.port` |
   | `5349` | TCP | `coturn.tls.port`, for TURN over TLS |
   | `49152`-`49252` | UDP | `coturn.relayPorts`, about one per relayed connection |

3. `coturn.externalIp` may name the node's public IPv4 address. Left empty, coturn asks an external service for it when
   it starts, which needs the pod to reach the internet.

On a cluster with several nodes, pin coturn to one with `coturn.nodeSelector`, and point `coturn.hostname` at that node.

The relay port range limits how many connections can be relayed at once. A participant in a meeting holds one or two
per other participant. Widen `coturn.relayPorts` (and the firewall rule with it) for large meetings.

## Credentials

`coturn.auth.mode` chooses how participants authenticate:

- **`secret`** (the default). Each participant gets a credential of their own when they join a call, made from a secret
  only the server and coturn know, and good for an hour. Nothing a participant is handed can be used after their call,
  or to work out anyone else's. The secret is generated once and kept in the `<fullname>-coturn` Secret, which both
  coturn and the server read. Set `coturn.auth.sharedSecret` to choose it.
- **`credential`**. One user name (`coturn.auth.username`, default `rapidmx`) and password (`coturn.auth.password`,
  generated once and kept) for everyone. Every participant is handed it, so anyone who has joined a call can keep using
  the relay until you change it.

`coturn.auth.existingSecret` reads them from a Secret you manage instead, with the keys
`mail__videoconf__turn__shared_secret` (secret mode) or `mail__videoconf__turn__username` and
`mail__videoconf__turn__credential` (credential mode).

`coturn.userQuota` (default `25`) limits the relayed connections one credential may hold, so one participant can't use
up every relay port. coturn refuses to relay to private, loopback and link-local addresses (`coturn.deniedPeerIps`),
so it can't be used to reach the node's or the cluster's own network.

## TURN over TLS

With `coturn.tls.enabled` (on by default), coturn also serves `turns:` on port 5349, for participants whose network
blocks UDP and lets only TLS out. The plugin is given both addresses in its one TURN URL setting:

```text
turn:mail.example.com:3478,turns:mail.example.com:5349
```

:::warning Meet plugin 0.4.0 or later
Reading two addresses from one setting needs the Meet plugin at version 0.4.0 or later. An older one takes the pair for
one invalid address, and no call connects. Update the plugin in the admin console before, or together with, the chart,
or set `coturn.tls.enabled=false` until you have.
:::

coturn's certificate comes from:

1. `coturn.tls.existingSecret`, a `kubernetes.io/tls` Secret in the release namespace whose certificate covers
   `coturn.hostname`; or else
2. the certificate the chart already issues for `host` (`<host>-tls-cert`). It covers `host` only, so
   `coturn.hostname` must then be empty or equal to `host`. A different `coturn.hostname` without an `existingSecret`
   fails the render.

When the chart issues no certificate (`global.gateway.tls` off, the installer's `--tls false`, or a `localhost` or
`.local` host) and no `existingSecret` is set, coturn simply runs without TLS and the plugin gets only the `turn:`
address. On a first install coturn stays pending until cert-manager has issued the certificate. A renewed certificate
is picked up within five minutes, without a restart.

Port 5349 helps networks that allow outbound TLS to port 5349. It doesn't help a network that allows only port 443.
Routing TURN over 443 on the single-server installer's host would need an nginx `stream` route by TLS server name and a
host name of its own for TURN; neither the chart nor the installer sets that up.

## The plugin's settings win

The chart passes the TURN address and credentials to the Meet plugin through the server's environment
(`mail:videoconf:turn:*`). A value saved in the plugin's settings in the admin console overrides them. An empty
setting falls through to the chart's, so the console's empty TURN fields don't hide what the chart set.

## Turning it off

Set `coturn.create=false`. Calls still connect directly and through public STUN servers, which covers most networks;
only participants behind a strict firewall can't join. To use a TURN server you run yourself, enter its address and
credentials in the Meet plugin's settings in the admin console.

## On AWS

The AWS deployment turns coturn off: it needs UDP open on an address that doesn't change, and the instance's public
address isn't fixed while the load balancer carries only TCP. To add it:

1. Give the instance an Elastic IP.
2. Open TCP and UDP 3478 and UDP 49152-49252 to it in the security group.
3. On the instance, upgrade the release with coturn on and pointed at that address:

   ```bash
   export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
   helm upgrade rapidmx-server oci://ghcr.io/rapidmx/charts/server --version 1.0.0-beta.43 --namespace rapidmx-server \
     --reset-then-reuse-values \
     --set coturn.create=true --set coturn.hostname=203.0.113.10 \
     --set coturn.externalIp=203.0.113.10 --set coturn.tls.enabled=false
   ```

`coturn.tls.enabled=false` is needed because the chart's certificate is for the site's host name, which an IP address
can't use. To offer TURN over TLS as well, give the Elastic IP a DNS name, put a certificate for it in a
`kubernetes.io/tls` Secret in the release namespace, use that name as `coturn.hostname` with `coturn.tls.existingSecret`,
and open TCP 5349 too.
