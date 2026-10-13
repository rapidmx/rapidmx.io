import type {ReactNode} from 'react';
import {useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useBrokenLinks from '@docusaurus/useBrokenLinks';

import styles from './index.module.css';

/* ------------------------------------------------------------------------------------------------
 * Icons: small inline line icons so the page loads nothing from third parties.
 * --------------------------------------------------------------------------------------------- */

const ICONS: Record<string, ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  contacts: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 6.5a3 3 0 0 1 0 5.5M18.5 14.8c1.6.8 2.6 2.5 3 5.2" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
    </>
  ),
  booking: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  crm: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  devices: (
    <>
      <rect x="2" y="4" width="14" height="10" rx="1.5" />
      <path d="M6 18h6M9 14v4" />
      <rect x="16.5" y="8" width="5.5" height="12" rx="1.2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10.5" width="16" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.5 11.5 9-9M17 6l2.5 2.5M14.5 8.5 17 11" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.8 8 10 4.6-1.2 8-5 8-10v-6z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <path d="M4 20 20 4" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.6 2.8 3.8 6 3.8 9.5s-1.2 6.7-3.8 9.5c-2.6-2.8-3.8-6-3.8-9.5s1.2-6.7 3.8-9.5z" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2.5v5M15 2.5v5M6 7.5h12v3a6 6 0 0 1-12 0zM12 16.5v5" />
    </>
  ),
  code: (
    <>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
    </>
  ),
  move: (
    <>
      <path d="M4 12h16M14 6l6 6-6 6M4 5v14" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  minus: <path d="M6 12h12" />,
};

function Icon({name, className}: {name: string; className?: string}): ReactNode {
  return (
    <svg
      className={clsx(styles.icon, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Hero
 * --------------------------------------------------------------------------------------------- */

function Hero(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Open source Â· Self-hosted Â· End-to-end encrypted</span>
          <Heading as="h1" className={styles.heroTitle}>
            Your organization's mail.
            <br />
            <span className={styles.heroAccent}>On your servers. Under your keys.</span>
          </Heading>
          <p className={styles.heroLead}>
            RapidMX is a complete communications platform you run yourself: email, calendar, contacts, tasks,
            video meetings and booking pages, with end-to-end encryption built in. Everything your team relies on
            from Google Workspace or Microsoft 365, without handing your conversations to someone else's cloud.
          </p>
          <div className={styles.heroButtons}>
            <Link className={clsx('button button--lg', styles.buttonPrimary)} to="/docs/getting-started/overview">
              Deploy your server
            </Link>
            <Link className={clsx('button button--lg', styles.buttonGhost)} to="#features">
              Explore features
            </Link>
          </div>
          <ul className={styles.heroChecks}>
            <li>
              <Icon name="check" /> No per-user license fees
            </li>
            <li>
              <Icon name="check" /> Works with iPhone and Android mail apps
            </li>
            <li>
              <Icon name="check" /> Up and running in an afternoon
            </li>
          </ul>
        </div>
        <div className={styles.heroShot}>
          <BrowserFrame src="/img/screenshots/mail-inbox.png" alt="The RapidMX inbox in a web browser" url="mail.example.com" />
        </div>
      </div>
    </header>
  );
}

function BrowserFrame({src, alt, url}: {src: string; alt: string; url: string}): ReactNode {
  return (
    <figure className={styles.browser}>
      <div className={styles.browserBar}>
        <span />
        <span />
        <span />
        <div className={styles.browserUrl}>
          <Icon name="lock" className={styles.browserLock} />
          {url}
        </div>
      </div>
      <img src={useBaseUrl(src)} alt={alt} loading="eager" />
    </figure>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Proof strip
 * --------------------------------------------------------------------------------------------- */

const PILLARS = [
  {value: 'MPL-2.0', label: 'Open-source license'},
  {value: '0', label: 'Per-user fees'},
  {value: 'S/MIME', label: 'End-to-end encryption'},
  {value: 'Any', label: 'Number of mail domains'},
];

function ProofStrip(): ReactNode {
  return (
    <section className={styles.proof} aria-label="RapidMX at a glance">
      <div className={clsx('container', styles.proofGrid)}>
        {PILLARS.map((p) => (
          <div key={p.label} className={styles.proofItem}>
            <span className={styles.proofValue}>{p.value}</span>
            <span className={styles.proofLabel}>{p.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Why
 * --------------------------------------------------------------------------------------------- */

const REASONS = [
  {
    icon: 'eye',
    title: 'Nobody else reads your mail',
    body:
      "Your messages live on hardware you choose, in the country you choose. There's no ad profile, no AI " +
      'training on your inbox and no provider with a master key. Even your own administrators manage the ' +
      "platform, not each other's mail.",
  },
  {
    icon: 'scale',
    title: 'Stop paying rent per person',
    body:
      'Cloud suites charge every user, every month, forever, and raise prices when they like. RapidMX is free ' +
      'open-source software. You pay for the server it runs on, whether that is ten people or ten thousand.',
  },
  {
    icon: 'move',
    title: 'No lock-in, in or out',
    body:
      'Bring your history with you by importing mbox and Outlook PST files, and take it with you any time as mbox ' +
      'or JSON. Your people keep using the phone mail apps they already know.',
  },
];

function Why(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Why RapidMX</span>
          <Heading as="h2">Communication is the heart of your business. Own it.</Heading>
          <p>
            Every contract, every customer conversation and every internal decision passes through email. RapidMX
            puts that back under your control without asking anyone to give up the tools they're used to.
          </p>
        </div>
        <div className={styles.reasonGrid}>
          {REASONS.map((r) => (
            <div key={r.title} className={styles.reason}>
              <div className={styles.reasonIcon}>
                <Icon name={r.icon} />
              </div>
              <Heading as="h3">{r.title}</Heading>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Features
 * --------------------------------------------------------------------------------------------- */

type Feature = {icon: string; title: string; body: string; to: string; badge?: string};

const FEATURES: Feature[] = [
  {
    icon: 'mail',
    title: 'Webmail people enjoy',
    body:
      'Conversations, a Focused and Other inbox, labels, rich compose with autocomplete, scheduled send and ' +
      'recall, read receipts, signatures, rules and automatic replies.',
    to: '/docs/user-guide/mail',
  },
  {
    icon: 'calendar',
    title: 'Calendar and scheduling',
    body:
      'Recurring events, meeting invitations and responses, and room and equipment mailboxes that accept ' +
      'bookings on their own.',
    to: '/docs/user-guide/calendar',
  },
  {
    icon: 'contacts',
    title: 'Contacts and tasks',
    body: 'Contacts with contact lists, vCard import and export, and a task list that lives right next to your mail.',
    to: '/docs/user-guide/contacts',
  },
  {
    icon: 'video',
    title: 'Video meetings',
    body:
      'Browser-based video calls you join straight from a calendar invite or a shared link, relayed through ' +
      'your own TURN server so they work behind strict firewalls.',
    to: '/docs/user-guide/video-meetings',
  },
  {
    icon: 'booking',
    title: 'Booking pages',
    body:
      'Public scheduling pages that check your real availability, confirm by email and let guests reschedule or ' +
      'cancel on their own.',
    to: '/docs/user-guide/booking-pages',
  },
  {
    icon: 'crm',
    title: 'CRM and campaigns',
    body:
      'Contacts, companies, sales pipelines, mailing lists, campaigns and automations, connected to the mailboxes ' +
      'your team already works in.',
    to: '/docs/user-guide/crm',
  },
  {
    icon: 'chat',
    title: 'Team chat',
    body: 'Teams, channels and threads for the quick back-and-forth that does not belong in an inbox.',
    to: '/docs/user-guide/chat',
    badge: 'Coming soon',
  },
  {
    icon: 'devices',
    title: 'The apps you already use',
    body:
      'iPhone, iPad and Android mail apps sync mail, contacts and calendars through Exchange ActiveSync, and ' +
      'Autodiscover sets them up from just an email address and password. Outlook for Windows support is on the way.',
    to: '/docs/clients/overview',
  },
];

function Features(): ReactNode {
  return (
    <section id="features" className={clsx(styles.section, styles.sectionAlt)}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Features</span>
          <Heading as="h2">One platform for how your team communicates</Heading>
          <p>
            Mail, calendar, contacts and tasks are built in. Video meetings, booking pages, CRM and more are plugins
            your administrator turns on from the console with a click.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <Link key={f.title} to={f.to} className={styles.feature}>
              <div className={styles.featureIcon}>
                <Icon name={f.icon} />
              </div>
              <Heading as="h3">
                {f.title}
                {f.badge && <span className={styles.badge}>{f.badge}</span>}
              </Heading>
              <p>{f.body}</p>
              <span className={styles.featureMore}>Learn more â†’</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Security
 * --------------------------------------------------------------------------------------------- */

const SECURITY = [
  {
    icon: 'lock',
    title: 'End-to-end encryption, built in',
    body:
      'S/MIME signing and encryption happen in the browser, and every person gets their own keys, kept in a vault ' +
      'only they can unlock. Make encryption automatic, optional or off for each kind of recipient.',
  },
  {
    icon: 'key',
    title: 'Modern sign-in',
    body:
      'Passkeys and security keys, authenticator apps, one-time codes and recovery codes. App passwords keep ' +
      'phone mail apps working with two-step sign-in turned on.',
  },
  {
    icon: 'shield',
    title: 'Spam and malware, fail-closed',
    body:
      'Every message is scored by rspamd and scanned by ClamAV. If a scanner is down, mail is held in quarantine or ' +
      'sent to Junk, never waved through to the inbox. Your usersâ€™ reports teach the filter.',
  },
  {
    icon: 'globe',
    title: 'Trusted delivery',
    body:
      'DKIM signing and verification, SPF and DMARC with a live DNS checklist per domain, and mandatory TLS ' +
      'between mail servers.',
  },
  {
    icon: 'users',
    title: 'Admins run the platform, not your inbox',
    body:
      'Administrators manage domains, policies and settings. Seeing someoneâ€™s mail takes an explicit, audited ' +
      'action, and every such action is logged.',
  },
  {
    icon: 'scale',
    title: 'Recovery with dual control',
    body:
      'Organizations that must be able to recover encrypted mail can enable key escrow: every request needs M-of-N ' +
      'approvals and lands in a tamper-evident, hash-chained audit log.',
  },
];

function Security(): ReactNode {
  return (
    <section id="security" className={clsx(styles.section, styles.sectionDark)}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Privacy and security</span>
          <Heading as="h2">Private by design, not by policy</Heading>
          <p>
            A privacy policy is a promise. Encryption and self-hosting are guarantees. RapidMX is built so that the
            safest choice is the default one.
          </p>
        </div>
        <div className={styles.securityGrid}>
          {SECURITY.map((s) => (
            <div key={s.title} className={styles.securityItem}>
              <Icon name={s.icon} className={styles.securityIcon} />
              <div>
                <Heading as="h3">{s.title}</Heading>
                <p>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.centerCta}>
          <Link className={clsx('button button--lg', styles.buttonGhostLight)} to="/docs/user-guide/encryption">
            How encryption works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Administration & governance
 * --------------------------------------------------------------------------------------------- */

const ADMIN_POINTS = [
  'Host as many mail domains as you like, each with a live DNS checklist for MX, SPF, DKIM and DMARC',
  'Mailboxes, aliases, nested distribution lists, shared mailboxes with delegation, and bookable rooms',
  'Transport rules, retention policies, legal hold and eDiscovery search and export',
  'Data-subject export and erasure requests for GDPR and similar laws',
  'A quarantine queue and a complete audit log',
  'Your own logo, name, colours, header and footer',
  'Plugins you search, install, upgrade and remove from the console',
];

function Admin(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={clsx('container', styles.split)}>
        <div className={styles.splitCopy}>
          <span className={styles.kicker}>Administration</span>
          <Heading as="h2">Everything an IT team needs, in one console</Heading>
          <p>
            A guided setup wizard takes you from a fresh install to your first working mailbox. After that, one admin
            console covers the whole organization. Add a domain and it works within seconds, with nothing to restart.
          </p>
          <ul className={styles.checkList}>
            {ADMIN_POINTS.map((p) => (
              <li key={p}>
                <Icon name="check" />
                {p}
              </li>
            ))}
          </ul>
          <Link to="/docs/administration/admin-console" className={styles.textLink}>
            Tour the admin console â†’
          </Link>
        </div>
        <div className={styles.splitShot}>
          <BrowserFrame src="/img/screenshots/setup-domain-dns.png" alt="The DNS checklist for a new domain" url="mail.example.com/admin" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Deploy
 * --------------------------------------------------------------------------------------------- */

const DEPLOY_OPTIONS = [
  {
    key: 'single',
    label: 'One Linux server',
    blurb:
      'A single script installs a lightweight Kubernetes (k3s), HTTPS certificates from Letâ€™s Encrypt, Postfix and RapidMX on a Debian, Ubuntu or RHEL server.',
    code: `curl -fsSLO https://raw.githubusercontent.com/rapidmx/server/main/single_node_install.sh
chmod +x single_node_install.sh
./single_node_install.sh --domain example.com --email you@example.com`,
    to: '/docs/getting-started/single-server',
  },
  {
    key: 'k8s',
    label: 'Kubernetes',
    blurb: 'One Helm chart installs the server, sign-in, Postfix, spam and virus scanning, and the TURN relay for video calls.',
    code: `helm upgrade --install --create-namespace --namespace rapidmx rapidmx \\
  oci://ghcr.io/rapidmx/charts/server --version <release> \\
  --set global.domain=example.com \\
  --set global.jwt.secret="$(openssl rand -hex 32)" \\
  --set global.mailIngestSecret="$(openssl rand -hex 32)"`,
    to: '/docs/getting-started/kubernetes',
  },
  {
    key: 'aws',
    label: 'AWS',
    blurb: 'A CloudFormation stack creates the network, an EC2 instance and everything on it, with Amazon SES carrying your mail.',
    code: `aws cloudformation deploy --stack-name rapidmx \\
  --template-file deploy/aws/rapidmx-server.yaml \\
  --capabilities CAPABILITY_IAM \\
  --parameter-overrides Domain=example.com HostedZoneId=Z123EXAMPLE \\
    ChartVersion=<release>`,
    to: '/docs/getting-started/aws',
  },
  {
    key: 'compose',
    label: 'Try it locally',
    blurb: 'Docker Compose runs the whole stack on your own computer, so you can click around before committing to anything.',
    code: `git clone https://github.com/rapidmx/server
cd server
docker compose -p rapidmx -f docker-compose.mongo.yml up -d --build`,
    to: '/docs/getting-started/docker-compose',
  },
];

function Deploy(): ReactNode {
  const [active, setActive] = useState(DEPLOY_OPTIONS[0].key);
  const option = DEPLOY_OPTIONS.find((o) => o.key === active) ?? DEPLOY_OPTIONS[0];
  return (
    <section id="deploy" className={clsx(styles.section, styles.sectionAlt)}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Deploy anywhere</span>
          <Heading as="h2">Running in an afternoon, wherever you host</Heading>
          <p>
            A rented virtual server, the rack in your office or your existing cluster: pick a path and you'll be
            signing in to your own mail server today. MongoDB or PostgreSQL, disk or S3 storage, Postfix or Amazon SES.
          </p>
        </div>
        <div className={styles.deploy}>
          <div className={styles.deployTabs} role="tablist" aria-label="Deployment options">
            {DEPLOY_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                role="tab"
                aria-selected={o.key === active}
                className={clsx(styles.deployTab, o.key === active && styles.deployTabActive)}
                onClick={() => setActive(o.key)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className={styles.deployBody} role="tabpanel">
            <p>{option.blurb}</p>
            <CodeBlock language="bash">{option.code}</CodeBlock>
            <Link to={option.to} className={styles.textLink}>
              Full instructions â†’
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Compare
 * --------------------------------------------------------------------------------------------- */

type Cell = {v: 'yes' | 'no' | 'partial'; note?: string};
const yes = (note?: string): Cell => ({v: 'yes', note});
const no = (note?: string): Cell => ({v: 'no', note});
const partial = (note: string): Cell => ({v: 'partial', note});

const COMPARE: {row: string; rmx: Cell; google: Cell; ms: Cell}[] = [
  {row: 'Runs on servers you control', rmx: yes(), google: no('Provider cloud only'), ms: no('Provider cloud only')},
  {row: 'Source code you can read and audit', rmx: yes('MPL-2.0'), google: no(), ms: no()},
  {row: 'Licensing', rmx: yes('Free, any number of users'), google: no('Per user, per month'), ms: no('Per user, per month')},
  {row: 'You choose where data is stored', rmx: yes('Any country, any host'), google: partial('Data regions on some plans'), ms: partial('Data residency on some plans')},
  {row: 'End-to-end encryption for every user', rmx: yes('S/MIME, built in'), google: partial('Client-side encryption on top tiers'), ms: partial('S/MIME with your own PKI')},
  {row: 'Mail, calendar, contacts and tasks', rmx: yes(), google: yes(), ms: yes()},
  {row: 'Video meetings and booking pages', rmx: yes('Plugins'), google: yes(), ms: yes()},
  {row: 'Works with phone mail apps', rmx: yes('Exchange ActiveSync'), google: yes(), ms: yes()},
  {row: 'Works with Outlook for Windows', rmx: partial('MAPI over HTTP, in progress'), google: partial('Through a sync tool'), ms: yes()},
  {row: 'Retention, legal hold and eDiscovery', rmx: yes('Included'), google: partial('Higher tiers'), ms: partial('Higher tiers')},
  {row: 'Extend with your own plugins', rmx: yes('npm packages'), google: partial('Marketplace add-ons'), ms: partial('Add-ins')},
  {row: 'Documents, spreadsheets and file storage', rmx: no('Not included'), google: yes(), ms: yes()},
];

function Mark({cell}: {cell: Cell}): ReactNode {
  const icon = cell.v === 'yes' ? 'check' : cell.v === 'no' ? 'x' : 'minus';
  const label = cell.v === 'yes' ? 'Yes' : cell.v === 'no' ? 'No' : 'Partly';
  return (
    <span className={clsx(styles.mark, styles[`mark_${cell.v}`])}>
      <Icon name={icon} />
      <span className={styles.srOnly}>{label}</span>
      {cell.note && <span className={styles.markNote}>{cell.note}</span>}
    </span>
  );
}

function Compare(): ReactNode {
  return (
    <section id="compare" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>Compare</span>
          <Heading as="h2">How RapidMX stacks up</Heading>
          <p>
            RapidMX focuses on communication: mail, scheduling and meetings. If that's what you rely on Google
            Workspace or Microsoft 365 for, here's what changes when you run it yourself.
          </p>
        </div>
        <div className={styles.compareWrap}>
          <table className={styles.compare}>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col" className={styles.compareUs}>
                  RapidMX
                </th>
                <th scope="col">Google Workspace</th>
                <th scope="col">Microsoft 365</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((c) => (
                <tr key={c.row}>
                  <th scope="row">{c.row}</th>
                  <td className={styles.compareUs}>
                    <Mark cell={c.rmx} />
                  </td>
                  <td>
                    <Mark cell={c.google} />
                  </td>
                  <td>
                    <Mark cell={c.ms} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.footnote}>
          Based on publicly available plan information as of 2026. Features and plans of other providers change; check
          with them for current details. Google Workspace and Microsoft 365 are trademarks of their respective owners.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Developers
 * --------------------------------------------------------------------------------------------- */

function Developers(): ReactNode {
  return (
    <section className={clsx(styles.section, styles.sectionAlt)}>
      <div className={clsx('container', styles.split)}>
        <div className={styles.splitCopy}>
          <span className={styles.kicker}>Open source</span>
          <Heading as="h2">Built in the open, made to be extended</Heading>
          <p>
            RapidMX is written in TypeScript on the <Link href="https://rapidrest.dev">RapidREST</Link> framework,
            with a React web app and a plugin system that lets you add API routes, pages, navigation and settings as
            ordinary npm packages. Exchange ActiveSync, MAPI, booking pages and video meetings are all plugins
            themselves.
          </p>
          <div className={styles.heroButtons}>
            <Link className={clsx('button button--lg', styles.buttonPrimary)} to="/developers/intro">
              Contributor guide
            </Link>
            <Link className={clsx('button button--lg', styles.buttonGhostDark)} to="/developers/plugins/overview">
              Write a plugin
            </Link>
          </div>
        </div>
        <div className={styles.splitShot}>
          <div className={styles.devCards}>
            <div className={styles.devCard}>
              <Icon name="plug" />
              <strong>Plugins</strong>
              <span>Routes, models, pages and settings, installed from the admin console</span>
            </div>
            <div className={styles.devCard}>
              <Icon name="code" />
              <strong>REST API</strong>
              <span>Everything the web app does, available to your own tools</span>
            </div>
            <div className={styles.devCard}>
              <Icon name="globe" />
              <strong>Open protocols</strong>
              <span>S/MIME, ActiveSync, MAPI over HTTP, Autodiscover, ACME</span>
            </div>
            <div className={styles.devCard}>
              <Icon name="users" />
              <strong>MPL-2.0</strong>
              <span>Use it, change it, and share improvements to the files you change</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * FAQ
 * --------------------------------------------------------------------------------------------- */

const FAQ: {q: string; a: ReactNode}[] = [
  {
    q: 'Is RapidMX really free?',
    a: (
      <>
        Yes. RapidMX is open-source software under the Mozilla Public License 2.0, with no per-user fees and no paid
        tier. Your costs are the server, storage and bandwidth you run it on.
      </>
    ),
  },
  {
    q: 'What do I need to run it?',
    a: (
      <>
        A domain name and a Linux server with a public IP address and about 8 GiB of memory is enough for the
        one-command installer. You'll need port 25 open for mail, which some hosting providers block by default.
        See <Link to="/docs/getting-started/before-you-deploy">Before you deploy</Link>.
      </>
    ),
  },
  {
    q: 'Do I need to know Kubernetes?',
    a: (
      <>
        No. The single-server installer sets up and manages a small Kubernetes (k3s) for you. If you already run a
        cluster, the Helm chart fits right in.
      </>
    ),
  },
  {
    q: 'Can I move my existing mail over from Gmail or Outlook?',
    a: (
      <>
        Yes. RapidMX imports mailboxes from mbox files (what Google Takeout exports) and Outlook PST files. See{' '}
        <Link to="/docs/user-guide/import-export">Import and export</Link>.
      </>
    ),
  },
  {
    q: 'Will my team have to change apps?',
    a: (
      <>
        For most people, no. The built-in mail apps on iPhone, iPad and Android connect through Exchange
        ActiveSync. Support for Outlook for Windows, over MAPI over HTTP, is still being finished. There's also a fast web app that works in any
        modern browser. RapidMX does not offer IMAP or POP3.
      </>
    ),
  },
  {
    q: 'Can my administrator read my email?',
    a: (
      <>
        Administrators manage the platform: domains, policies, plugins and branding. They don't see other people's
        mail in the app. Getting into someone else's mailbox takes a deliberate action that is recorded in the audit
        log, and encrypted messages stay unreadable without the owner's key unless your organization has set up key
        escrow, which itself requires multiple approvers.
      </>
    ),
  },
  {
    q: 'What happens if I forget my encryption password?',
    a: (
      <>
        When you set up encryption you're given recovery codes, Keep the codes
        somewhere safe: they're the way back in. See <Link to="/docs/user-guide/encryption">Encryption</Link>.
      </>
    ),
  },
  {
    q: 'Does RapidMX replace Google Docs or OneDrive?',
    a: (
      <>
        No. RapidMX focuses on communication: mail, calendar, contacts, tasks, meetings, booking and CRM. It pairs well
        with any self-hosted or cloud document and file service you prefer.
      </>
    ),
  },
  {
    q: 'Is it ready for production?',
    a: (
      <>
        RapidMX is in public beta on its way to 1.0. It runs real mail for real domains today, and releases ship
        frequently. As with any mail server, keep backups and read the{' '}
        <Link to="/docs/operations/upgrading">upgrade notes</Link> before each update.
      </>
    ),
  },
];

function Faq(): ReactNode {
  return (
    <section id="faq" className={styles.section}>
      <div className={clsx('container', styles.faqContainer)}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>FAQ</span>
          <Heading as="h2">Questions, answered</Heading>
        </div>
        <div className={styles.faq}>
          {FAQ.map((f) => (
            <details key={f.q} className={styles.faqItem}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Closing CTA
 * --------------------------------------------------------------------------------------------- */

function ClosingCta(): ReactNode {
  return (
    <section className={styles.closing}>
      <div className="container">
        <Heading as="h2">Take back your inbox.</Heading>
        <p>Set up your own RapidMX server and send your first message today.</p>
        <div className={clsx(styles.heroButtons, styles.closingButtons)}>
          <Link className={clsx('button button--lg', styles.buttonPrimary)} to="/docs/getting-started/overview">
            Get started
          </Link>
          <Link className={clsx('button button--lg', styles.buttonGhostLight)} href="https://github.com/rapidmx/server">
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  // The navbar and footer link to these section ids; register them so the build's anchor check knows they exist.
  const brokenLinks = useBrokenLinks();
  ['features', 'security', 'deploy', 'compare', 'faq'].forEach((id) => brokenLinks.collectAnchor(id));
  return (
    <Layout
      title="Private, self-hosted email and collaboration"
      description="RapidMX is an open-source, self-hosted alternative to Google Workspace and Microsoft 365: email, calendar, contacts, video meetings and booking pages with end-to-end encryption, on servers you control.">
      <Hero />
      <main>
        <ProofStrip />
        <Why />
        <Features />
        <Security />
        <Admin />
        <Deploy />
        <Compare />
        <Developers />
        <Faq />
        <ClosingCta />
      </main>
    </Layout>
  );
}
