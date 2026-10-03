# Alternate Exposures

Website for **Alternate Exposures**: photo and video by Bryson Glass for rappers and clothing brands in Atlanta, Georgia. Music videos, cover art, merch drops, lookbooks and live shows, all shot on location.

A static site (HTML, CSS and a little JavaScript) hosted on GitHub Pages. The gallery is managed through [Pages CMS](https://app.pagescms.org), so photos and videos can be added without touching code.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: cover, about, selected work, services & rates, process |
| `gallery.html` | Filterable gallery (music videos, artist visuals, merch, lookbooks, live) with a full-screen viewer that plays videos |
| `contact.html` | Contact details, booking form, FAQ |

Styles live in `css/styles.css` and scripts in `js/main.js`. Gallery entries are stored in `data/gallery.json` and uploaded photos in `images/gallery/`.

## Managing the gallery

Everything in the gallery, and the three "Selected work" tiles on the home page, comes from Pages CMS.

1. Go to **https://app.pagescms.org** and sign in (GitHub account, or the email invite link for collaborators).
2. Open the **Alternate-Exposures** repository, then **Gallery** in the sidebar.
3. **To add work:** add a new entry to the list (the **+ Add** button), then fill in:
   - **Photo:** upload the image. For a music video or clip, upload a still from it to use as the thumbnail.
   - **Title:** e.g. *Lil Example — "Song Title"* or *Brand Name — Fall drop*.
   - **Category:** Music video, Artist visuals, Merch drop, Lookbook / campaign, or Live show / event.
   - **Video link:** for music videos and clips, paste the normal YouTube or Vimeo link (YouTube Shorts work too). Leave it empty for photos.
   - **Show on homepage:** tick up to 3 pieces to feature in "Selected work" on the home page.
4. **To remove work:** delete the entry. **To reorder:** entries appear on the site in the same order as the list.
5. Click **Save**. The live site updates in about 1–2 minutes.

**About photo files**
- Upload straight from your editing export. Anything larger than 2400 pixels on its longest side is shrunk automatically, and location/camera data is removed, so it's safe and fast to load.
- Use JPG, PNG or WebP. iPhone HEIC photos need to be exported as JPG first.
- Deleting a gallery entry doesn't delete the uploaded file. To clean up old files, use the **Media** section in Pages CMS.

**Inviting Bryson (or anyone else):** in Pages CMS, open the repository's settings, find **Collaborators**, and invite them by email. They don't need a GitHub account.

## Running locally

```bash
python -m http.server 8080
```

Then visit http://localhost:8080.

## Still to fill in

**Blocking launch**
- **Email and phone:** replace `hello@example.com` and `(000) 000-0000` in `index.html`, `gallery.html`,
  `contact.html`, `privacy.html` and `404.html`.
- **Contact form:** it validates but sends nothing. See the comment above the `<form>` tag in
  `contact.html` — sign up at Formspree, paste the URL into `action`, add `method="post"`, delete
  `data-demo`.
- **Gallery:** add work through Pages CMS (see above).
- **Copy placeholders:** the music-video caption and bio in `index.html`, "Now booking [Season, Year]",
  the "[24–48] hours" reply time in `contact.html`, and the crew FAQ marked `[Placeholder]`.
- **Photos:** the homepage cover image (`index.html`) and the photo of Bryson (`contact.html`) are still
  grey placeholders.
- **Social links:** the TikTok and YouTube links in every footer still point at `#`.

**Nice to have**
- Analytics (none installed; the privacy page says so, update it if that changes).
- Decide how the "first 10 clients" intro offer gets tracked, or swap it for an end date.

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
