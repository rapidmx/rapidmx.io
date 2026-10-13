---
sidebar_position: 6
title: AWS (CloudFormation)
description: Deploy RapidMX on AWS with one CloudFormation stack that sends mail through Amazon SES, plus the ses-bridge stack for inbound mail.
---

# AWS (CloudFormation)

On AWS, one CloudFormation stack creates the network, an EC2 instance and everything on it. The instance runs k3s with
the same Helm chart as the other options, but two things are different:

- **Mail goes through Amazon SES** instead of Postfix. Outgoing mail uses the instance's IAM role. Incoming mail needs a
  second, small stack called [ses-bridge](https://github.com/rapidmx/ses-bridge), deployed once per mail domain.
- **AWS load balancers** sit in front: Kubernetes Services of type `LoadBalancer` become Classic Load Balancers. The
  installer also adds the EBS CSI driver with an encrypted `gp3` StorageClass.

Because SES delivers your mail, you don't need outbound port 25 or a reverse DNS record. You do need SES out of its
sandbox to mail anyone you haven't verified.

## What you need

- An AWS account and the [AWS CLI](https://aws.amazon.com/cli/), signed in (`aws sts get-caller-identity`)
- A Route 53 hosted zone for your domain. It's optional, but with it the stack creates the `mail` and `auth` records
  for you, so certificates are issued on first boot.
- SES out of the sandbox in your region, or a verified recipient address to test with. New accounts start in the
  sandbox; request production access in the SES console.
- A checkout of [github.com/rapidmx/server](https://github.com/rapidmx/server), for the template
- For ses-bridge: Node.js with Corepack, and a private subnet with a NAT gateway (or VPC endpoints for S3 and SES) in
  the stack's VPC. See step 5.

## What the stack installs

The instance's user data downloads `deploy/aws/bootstrap.sh` and runs it. It installs:

- **k3s**, without its own ServiceLB and in-tree cloud controller
- **aws-cloud-controller-manager** and **aws-ebs-csi-driver**, with a `gp3` StorageClass
- **Envoy Gateway**, whose Envoy Service is a Classic Load Balancer forwarding TCP with the PROXY protocol, so the
  server still sees each visitor's real address
- **cert-manager**, for Let's Encrypt certificates
- **OpenBao** and **External Secrets**, for the release's secrets (unless `EnableOpenBao=false`)
- **The RapidMX chart**, as the release `rapidmx-server` in the namespace `rapidmx-server`, with SES as its mail
  transport, Postfix and the TURN server switched off, and an internal load balancer for ses-bridge to deliver to

The stack reports success only once the whole install has finished, so a failed install fails the stack.

## Install

1. Create the stack. Replace the domain, the hosted zone and the version:

   ```bash
   aws cloudformation deploy --stack-name rapidmx --template-file deploy/aws/rapidmx-server.yaml \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides Domain=example.com HostedZoneId=Z123EXAMPLE ChartVersion=1.0.0-beta.43
   ```

   - `Domain` is your mail domain, **not** `mail.example.com`.
   - Leave out `HostedZoneId` if you don't use Route 53.
   - Always set `ChartVersion` to the current release. The template's default is an older one.

2. Read the stack's outputs:

   ```bash
   aws cloudformation describe-stacks --stack-name rapidmx --query 'Stacks[0].Outputs'
   ```

3. Read the install summary. It holds the load balancer's name, the generated secrets and the exact command for step
   5. Run the `SummaryCommand` output, which uses AWS Session Manager to print
   `/var/lib/rapidmx-installer/summary.txt` from the instance.

4. Without a hosted zone, create two `CNAME` records that point `mail.example.com` and `auth.example.com` at the load
   balancer named in the summary.

5. Deploy ses-bridge for inbound mail, using the command from the summary. It looks like this, run from a checkout
   of ses-bridge:

   ```bash
   git clone https://github.com/rapidmx/ses-bridge
   cd ses-bridge
   corepack enable
   yarn install
   SES_BRIDGE_DOMAIN_NAME=example.com \
   MTA_INGEST_BASE_URL=http://internal-rapidmx-ingest-1234.us-east-1.elb.amazonaws.com/internal/mta \
   MTA_INGEST_SECRET=<from the summary> \
   SES_BRIDGE_VPC_ID=vpc-0123456789abcdef0 SES_BRIDGE_SUBNET_IDS=subnet-aaa,subnet-bbb \
   yarn deploy
   ```

   :::warning Use a private subnet with egress
   `SES_BRIDGE_SUBNET_IDS` must **not** be the stack's own public subnet. That subnet has no NAT gateway, and a
   Lambda function never gets a public address, so ses-bridge would have no network access at all: every message
   would be dropped silently, without a bounce. Create a private subnet with a NAT gateway (or VPC endpoints for S3
   and SES) and pass that one. The internal load balancer accepts the VPC's own address range by default
   (`RAPIDMX_INGEST_CIDRS`), which covers a subnet in the same VPC.
   :::

6. Finish the SES setup. `ses-bridge` prints each of these when it finishes:

   - Publish the three DKIM `CNAME` records it lists (`DkimRecords`).
   - Point your domain's `MX` record at the value it lists (`MxRecordValue`), with priority `10`.
   - Activate the SES receipt rule set, with the command it prints (`ActivateRuleSetCommand`):

     ```bash
     aws ses set-active-receipt-rule-set --rule-set-name <name from the output>
     ```

   Until the rule set is active, mail to the domain isn't received at all.

7. Turn on e-mail from the sign-in page (one-time codes and verification e-mail). The auth-server can only send over
   SMTP, which can't use the instance's role, so [create an SES SMTP
   account](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html), open a Session Manager shell on the
   instance and run the installer again with its credentials:

   ```bash
   sudo -i
   export RAPIDMX_DOMAIN=example.com RAPIDMX_CHART_VERSION=1.0.0-beta.43
   export RAPIDMX_SES_SMTP_USERNAME=<username> RAPIDMX_SES_SMTP_PASSWORD=<password>
   curl -fsSL https://raw.githubusercontent.com/rapidmx/server/main/deploy/aws/bootstrap.sh -o /root/rapidmx-bootstrap.sh
   bash /root/rapidmx-bootstrap.sh
   ```

   Running it again keeps your existing secrets. Export the same values you gave the stack (`RAPIDMX_HOSTED_ZONE_ID`,
   `RAPIDMX_ACME_EMAIL`, `RAPIDMX_MAIL_HOST` and so on, if you set them), or they go back to their defaults. The codes
   come from `noreply@example.com` (`RAPIDMX_MAIL_FROM`), whose domain must be a verified SES identity.

   :::note
   The auth-server copies its SMTP settings into its database the first time it uses them, and from then on its admin
   console's Messages page owns them. If codes still don't send after re-running the installer, open that page and use
   its reset-to-configuration action.
   :::

8. Read the `admin` account's password, in the same shell:

   ```bash
   export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
   kubectl -n rapidmx-server get secret rapidmx-server-authserver-service-secrets -o jsonpath='{.data.default_accounts}' \
     | base64 -d | tr -d '\\' | sed -n 's/.*"password":"\([^"]*\)".*/\1/p'
   ```

9. Open `https://mail.example.com` and continue with [First-time setup](first-time-setup.md).

## Stack parameters

| Parameter | Default | Notes |
| --- | --- | --- |
| `Domain` | *(required)* | The mail domain, e.g. `example.com`. The server is served at `<MailHost>.<Domain>`, sign-in at `<AuthHost>.<Domain>`. |
| `MailHost` / `AuthHost` | `mail` / `auth` | The two host labels within the domain. |
| `AcmeEmail` | `admin@<Domain>` | Let's Encrypt account address. |
| `HostedZoneId` | *(none)* | A Route 53 zone for the domain, which the instance writes the `mail` and `auth` records into. Without it, create those records yourself. |
| `ChartVersion` | `1.0.0-beta.31` | The published chart version to install. Always set it to the current release. |
| `InstanceType` | `t3.large` | Everything runs on this one instance; 8 GiB of memory is the practical minimum. Allowed: `t3.large`, `t3.xlarge`, `t3a.large`, `t3a.xlarge`, `m6i.large`, `m6i.xlarge`, `m6a.large`, `m6a.xlarge`. |
| `VolumeSize` | `60` | Root volume, in GiB. |
| `KeyName` | *(none)* | Optional SSH key pair. Session Manager works without one. |
| `LatestAmiId` | Amazon Linux 2023 (SSM public parameter) | The AMI the instance boots. |
| `VpcId` / `SubnetId` | *(none)* | An existing public subnet to launch into. Left empty, the stack creates a VPC, public subnet and internet gateway with the tags the cloud controller needs. |
| `AllowedWebCidr` | `0.0.0.0/0` | Who may reach HTTP and HTTPS, applied to the load balancer. |
| `AllowedSshCidr` | *(none)* | Opens port 22 when set. Empty opens no SSH at all. |
| `EnableOpenBao` | `true` | Install OpenBao and keep the release's secrets in it. `false` keeps them in Kubernetes Secrets. |
| `ClusterName` | `rapidmx` | The `kubernetes.io/cluster/<name>` tag the cloud controller identifies this cluster's resources by. |
| `BootstrapUrl` | `deploy/aws/bootstrap.sh` on `main` | The install script the instance runs. |

To bring your own VPC, its subnet must be public and tagged `kubernetes.io/role/elb=1` and
`kubernetes.io/cluster/<ClusterName>`, and the VPC needs DNS host names enabled.

`bootstrap.sh` also reads environment variables that the stack has no parameters for, such as
`RAPIDMX_INGEST_CIDRS` (who may reach the internal ingest load balancer, default the VPC's own range),
`RAPIDMX_SES_REGION`, `RAPIDMX_MAIL_FROM` and `RAPIDMX_OPENBAO_ADDRESS`. The comment at the top of the script lists
them all.

## Limits

- **One instance, no high availability.** A single k3s node with `ReadWriteOnce` volumes.
- **No TURN server.** The bundled coturn needs a fixed public address with UDP open, which this instance doesn't have
  and the load balancer can't carry. Calls still connect directly and through public STUN servers.
  [Video calls: the TURN relay](../operations/video-relay.md#on-aws) explains how to add one.
- **Signing certificates need ses-bridge.** Automatic S/MIME signing certificates are verified by e-mail, so requests
  wait at "awaiting challenge" until ses-bridge delivers inbound mail. See
  [Encryption and certificates](../administration/encryption-and-certificates.md).
- **Each extra mail domain needs its own ses-bridge stack**, and its own SES identity.
- **ses-bridge doesn't consume SES bounce and complaint notifications** yet, and the admin console's DNS checklist
  models a single DKIM TXT record rather than SES's three DKIM CNAMEs, so the DKIM and MX rows may stay red. The
  ownership record is the one to publish from the checklist.

## Removing it

Delete the CloudFormation stack (and the ses-bridge stack). `bootstrap.sh` has no uninstall of its own. See
[Uninstalling](../operations/uninstalling.md).
