# Alternate Exposures

Website for **Alternate Exposures**: photo and video by Bryson Glass for rappers and clothing brands in Atlanta, Georgia. Music videos, cover art, merch drops, lookbooks and live shows, all shot on location.

A static site (HTML, CSS and a little JavaScript) hosted on GitHub Pages. The gallery is managed through [Pages CMS](https://app.pagescms.org), so photos and videos can be added without touching code.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: cover, about, selected work, services & rates, process |
| `gallery.html` | Project list, filterable by category; each project expands to show its description, photos and videos |
| `contact.html` | Contact details, booking form, FAQ |

Styles live in `css/styles.css` and scripts in `js/main.js`. Projects are stored in `data/projects.json` and uploaded photos in `images/gallery/`.

## Managing the gallery

The gallery is a list of **projects**. Each project has its own name, description and set of photos and
videos, and the three "Selected work" tiles on the home page come from the same place.

1. Go to **https://app.pagescms.org** and sign in (GitHub account, or the email invite link for
   collaborators).
2. Open the **Alternate-Exposures** repository, then **Projects** in the sidebar.
3. **To add a project:** add an entry to the list (the **+ Add** button), then fill in:
   - **Project name** — e.g. *Lil Example — "Night Shift"*. Shown in the gallery list.
   - **Artist or brand** — optional, shown under the name.
   - **Category** — Music video, Artist visuals, Merch drop, Lookbook / campaign, or Live show / event.
   - **When** — optional, e.g. "March 2026".
   - **Cover photo** — the single image that represents the project in the list. For a music video, use a
     still from it.
   - **Description** — a short paragraph about the project. Blank lines start new paragraphs.
   - **Video links** — YouTube or Vimeo links, one per video (Shorts work too). Leave empty for photo-only
     projects.
   - **Photos** — every photo for the project, up to 40.
   - **Show on homepage** — tick up to 3 projects for "Selected work".
4. **To remove a project:** delete the entry. **To reorder:** projects appear on the site in the same order
   as the list.
5. Click **Save**. The live site updates in about 1–2 minutes.

**How it looks to visitors:** the gallery lists the projects. Clicking one opens it in place, showing the
description and all of its photos and videos; clicking any of those opens it full-screen. Each project also
has its own link (e.g. `/gallery.html#lil-example-night-shift`) that opens it directly — handy for sending a
client straight to their project.

**About photo files**
- Upload straight from your editing export. Anything larger than 2400 pixels on its longest side is shrunk
  automatically, and location/camera data is removed, so it's safe and fast to load.
- Use JPG, PNG or WebP. iPhone HEIC photos need to be exported as JPG first.
- Deleting a project doesn't delete its uploaded files. To clean up, use the **Media** section in Pages CMS.

**Inviting Bryson (or anyone else):** in Pages CMS, open the repository's settings, find **Collaborators**,
and invite them by email. They don't need a GitHub account.

## Running locally

```bash
python -m http.server 8080
```

Then visit http://localhost:8080.

## Contact form

Messages go to Formspree (`https://formspree.io/f/xoevgzvw`) and are emailed on from there.
`js/main.js` posts in the background so the visitor stays on the page, showing a confirmation on success
and the email/phone as a fallback if the request fails. Free plan: 50 messages a month — if that's ever hit,
Formspree pauses delivery, so keep an eye on the dashboard.

## Still to fill in

**Blocking launch**
- **Gallery:** add work through Pages CMS (see above).
- **Copy placeholders:** the music-video caption and bio in `index.html`, "Now booking [Season, Year]",
  and the crew FAQ marked `[Placeholder]` in `contact.html`.
- **Photo of Bryson:** the image on the contact page (`contact.html`) is still a grey placeholder.
- **Social links:** the TikTok link in every footer still points at `#` (Instagram and YouTube are done).

**Nice to have**
- Analytics (none installed; the privacy page says so, update it if that changes).
- Decide how the "first 10 clients" intro offer gets tracked, or swap it for an end date.

## Hero video

The home page opens with a silent, looping background video (`videos/hero.mp4` for desktop,
`videos/hero-small.mp4` for phones, with `images/hero-poster.jpg` as the still shown first). `js/main.js`
picks the file, and skips video entirely for visitors on Data Saver, a 2G connection, or with reduced
motion turned on — they see the poster frame.

To swap the clip, drop the original in `videos/source/` (git-ignored) and run:

```bash
bash .github/scripts/make_hero_video.sh "videos/source/Your Clip.mp4"
```

## Brand images

`images/share-card.png` (link previews) and `images/apple-touch-icon.png` (iOS home screen) are generated
by `.github/scripts/make_brand_images.py`. Re-run it only if the wordmark changes:

```bash
python .github/scripts/make_brand_images.py . <font-cache-dir>
```

## Publishing with GitHub Pages

In the repository on GitHub, **Settings → Pages → Source** is set to **GitHub Actions**. Every push to
`main` (including saves from Pages CMS) runs `.github/workflows/deploy.yml`, which shrinks any new photos
and publishes the site. Progress shows under the repository's **Actions** tab.

### Custom domain (alternateexposures.com)

Share tags, the sitemap and the business details already use `https://alternateexposures.com`. To make it
live:

1. At the domain registrar, add four **A** records for the bare domain pointing to `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, plus a **CNAME** record for `www` pointing
   to `etherealelle.github.io`.
2. In **Settings → Pages → Custom domain**, enter `alternateexposures.com` and save.
3. Once the DNS check passes, tick **Enforce HTTPS**.

Because this site deploys through a GitHub Actions workflow, no `CNAME` file is needed in the repository —
GitHub stores the domain in the Pages settings.
