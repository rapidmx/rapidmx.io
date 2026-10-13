---
title: Commit messages
description: The commit message format every RapidMX repository uses, and why the release tool depends on it.
sidebar_position: 3
---

# Commit messages

RapidMX doesn't write its changelogs by hand. When a maintainer cuts a release, `rapidrest release` reads the commit
messages since the last tag and turns them into the new `CHANGELOG.md` entry. Your commit messages are the
changelog. That is why the format below is strict, and why it differs from the "short subject, blank line, prose body"
style you may be used to.

## The rule

**A commit message is a flat list of one-line, verb-led items. There is no summary or title line, and no `-` or `*`
bullet markers.**

- **Every non-blank line becomes its own changelog entry.** The release tool reads each commit's full message and
  makes no distinction between a subject and a body. A prose body would leak into the changelog one sentence per line.
- **No separate title line.** If a commit needs an overview, the overview is just one more line in the list, not a
  heading above it.
- **No bullet markers.** Write bare lines. The tool reads a line's first word to decide which section it belongs in,
  and a leading `-` defeats that lookup and ends up in the changelog as `- - Added foo`.
- **Lead each line with an imperative verb** where it fits. The first word decides the changelog section, and some
  verbs are rewritten into changelog tense (see the table below).
- **Trailers are fine.** A blank line followed by git trailers (`Co-Authored-By:`, `Signed-off-by:`, `Reviewed-by:`,
  `Acked-by:`, `Tested-by:`, `Change-Id:`) is allowed, and those lines are left out of the changelog. Nothing else
  should follow the list.
- **Never edit `CHANGELOG.md` by hand.** It is generated. Fix the wording in your commits instead.

## Examples

A good commit message:

```text
Add a Reply-To field to stored messages
Fix folder counts not updating after a bulk move
Updating the mailbox list query to page by uid
```

The release tool turns it into:

```markdown
### Added
- Added a Reply-To field to stored messages

### Changed
- Updated the mailbox list query to page by uid

### Fixed
- Fixed folder counts not updating after a bulk move
```

A message in the conventional style doesn't work:

```text
Improve folder counts

Folder counts were trusted from the stored row, which drifted when a
bulk move failed half way. They are now derived from the messages.
```

That becomes three changelog entries, two of them halves of a sentence, all filed under **Changed**.

## How the first word is read

The first word of a line is matched without regard to case.

| First word | Changelog section | Written as |
| --- | --- | --- |
| `Add`, `Adding`, `Allow`, `Allowing` | Added | `Added ...` |
| `Added` | Added | unchanged |
| `Fix`, `Fixing` | Fixed | `Fixed ...` |
| `Fixed` | Fixed | unchanged |
| `Remove`, `Removing` | Removed | `Removed ...` |
| `Removed` | Removed | unchanged |
| `Configuring`, `Converting`, `Consolidating`, `Exposing`, `Improving`, `Optimizing`, `Refactoring`, `Setting`, `Swapping`, `Switching`, `Updating`, `Upgrading` | Changed | The past tense (`Configured`, `Converted`, ... `Set`, ... `Upgraded`) |
| Anything else | Changed | unchanged |

Because `Allow` is rewritten to `Added`, write "Add support for ..." rather than "Allow ...", or the entry reads
oddly.

## Lines the release tool drops

Some lines never reach the changelog, so you don't need to avoid them, but don't rely on them to describe a change:

- git trailers, as above;
- a line that is only a version number (the release commits themselves, such as `1.0.0-beta.43`);
- a line starting with `Updating release notes` or `Updating README/release notes`;
- a line that mentions tests and then coverage, such as `Add tests to restore branch coverage`;
- a line that mentions Claude notes or a `.claude/` path.

Merge commits are skipped entirely, so the individual commits in your pull request are what count. Each of them should
follow the rule. See [Contributing](../contributing.md#pull-requests).

## Tips

- One line per user-visible change. A line should make sense to someone reading the changelog with no other context.
- Say what changed for the user or the API, not which file you edited.
- Keep a commit to one repository and one concern. A change that spans repositories gets a commit in each, each
  describing its own side.

:::note
Some repositories' `CONTRIBUTING.md` still describe a short subject line with a prose body. The format on this page is
the one the release tool expects.
:::
