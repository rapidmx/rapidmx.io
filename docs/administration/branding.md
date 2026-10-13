---
sidebar_position: 7
title: Branding
description: Give RapidMX your organization's logo, name, colours, header and footer, and what the HTML and CSS you supply may contain.
---

# Branding

Branding makes RapidMX look like your organization's own service rather than a product someone installed: your logo in the corner, your name in the browser tab, your colours, and a header or footer with your own links. You can set it in the setup wizard and change it any time under **Branding** in the admin console.

What you set here applies to everyone who visits the web app, including people who aren't signed in, such as visitors to [booking pages](../user-guide/booking-pages.md). The sign-in pages at `https://auth.example.com` belong to the sign-in server and are branded separately, under **Settings** in its own admin console (see [Users and sign-in](users-and-sign-in.md)).

## Logo and icon

- **Logo** is the full logo.
- **Icon** is a compact mark for navigation headers and the browser tab. If you don't set one, the logo is used, then RapidMX's own.

For each, either choose **Upload logo** / **Upload icon**, or paste an address into **Or use an external image URL** and choose **Set**. **Remove logo** and **Remove icon** go back to the default.

Uploads can be PNG, JPEG, GIF, WebP or ICO files up to 5 MB. SVG files are refused, because an SVG served from your server can carry script. An external address must start with `https://` or be a path on your own server (starting with `/`).

## Name and title

- **Company name**: your organization's name.
- **Product title**: shown as the browser tab title, for example `Example Mail`.

Choose **Save** at the bottom of the page to save these together with the header and footer.

## Header and footer

**Header HTML** replaces the app's own title bar and the icon at the top of the icon rail, and stays at the top of the window. **Footer HTML** appears at the bottom. The header shows in the web app and on public pages, but not in the admin console; the footer shows in both.

Two placeholders can go anywhere in the text of either one:

| Placeholder | Replaced with |
| --- | --- |
| `{USER_MENU}` | The account menu (avatar, Settings, Sign Out). It's used once: in the header if the header has it, otherwise in the footer, where it opens upward. If neither has it, the menu sits in a small cell at the right end of the header, so it's never lost. |
| `{APP_TITLE}` | The name of the app on screen, such as Mail or Calendar |

The page offers this example to copy:

```html
<div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 1rem">
  <span>{APP_TITLE}</span>
  <span>{USER_MENU}</span>
</div>
```

Put `{USER_MENU}` somewhere your styles don't hide on a phone, or people won't be able to reach Settings or sign out.

### What the HTML may contain

Header and footer HTML is cleaned when you save it, and again in each visitor's browser, so nothing in it can run script, collect input or load content in the clear. In practice:

- **Kept:** ordinary text markup (headings, paragraphs, lists, tables, `div`, `span`, links and images), the `class` attribute, and a `style` attribute limited to layout and typography.
- **Links** may use `http:`, `https:` or `mailto:`. **Images** must be `https:`.
- **Removed:** `<script>`, `<style>`, `<form>`, `<input>`, `<button>`, `<select>`, `<textarea>`, `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<math>`, `<link>` and `<meta>` elements, event handlers such as `onclick`, `javascript:` and `data:` addresses, and attributes other than the usual link and image ones plus `class` and `style`. Some of these, like `target` and `aria-*`, may be removed too, so don't rely on them.

The inline `style` attribute may only use these properties: `color`, `background-color`, `font`, `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, `letter-spacing`, `text-align`, `text-decoration`, `text-transform`, `vertical-align`, `white-space`, `margin` and `padding` (and their sides), `border` (and its sides), `border-radius`, `border-color`, `width`, `max-width`, `height`, `max-height`, `display`, `gap`, `justify-content`, `align-items` and `opacity`. Values can't contain `url(...)`. There's no `position`, so a header can't cover the page.

Anything more elaborate (hover effects, responsive rules, background images) belongs in the custom stylesheet, using `class` names on your HTML.

## Custom stylesheet

A custom stylesheet changes the look of the whole web app and admin console. Choose **Upload CSS file** (up to 5 MB), or enter an address in **Or use an external stylesheet URL** and choose **Set**. **Remove stylesheet** goes back to the default.

An **uploaded** stylesheet is cleaned when you upload it: `@import` rules are dropped, and any `url(...)` that points at another server becomes `none`. Only embedded images (`data:image/...`) and paths on your own server are kept, so the stylesheet can't make visitors' browsers contact another site.

An **external** stylesheet is loaded as it is by every visitor's browser, and a stylesheet can read what the page shows. Only use an address you control, or upload the file instead.

The escrow console never loads the custom stylesheet, because it handles escrow key material.

### Writing a stylesheet that behaves

RapidMX's own styles are in CSS cascade layers. Your stylesheet is loaded **unlayered**, which means any rule in it wins over the app's built-in styles whatever its specificity. That makes overriding easy, and also easy to overdo:

- **Change colours through the design tokens.** The app's colours are custom properties such as `--rr-color-primary`, `--rr-color-accent`, `--rr-color-bg`, `--rr-color-surface`, `--rr-color-text` and `--rr-color-border`. Dark mode redefines them, so set both:

  ```css
  :root {
    --rr-color-primary: #1d4ed8;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --rr-color-primary: #60a5fa;
    }
  }
  :root[data-theme="dark"] {
    --rr-color-primary: #60a5fa;
  }
  ```

- **Scope everything else to your own classes.** Style the header and footer through classes you put on their HTML (`.brand-header a { ... }`). A bare element selector such as `a { color: red; }` or `button { ... }` restyles every link or button in the whole app, because it overrides the app's own rules.
- **Check both themes and a phone-sized window** after uploading.

## Related

- [First-time setup](../getting-started/first-time-setup.md): the **Branding** step of the setup wizard
- [Settings](../user-guide/settings.md): the appearance choices each person can make for themselves
