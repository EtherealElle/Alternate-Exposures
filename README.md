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

- **Email and phone:** replace `hello@example.com` and `(000) 000-0000` in all three HTML files.
- **Bracketed text:** `[Artist]`, `[Brand]`, `[Song Title]`, `[#]`, `[@handle]` and the bio line in the About section.
- **Gallery:** add work through Pages CMS (see above).
- **Home page cover image:** the large image beside the headline is still a placeholder in `index.html`.
- **Photo of Bryson:** the image on the contact page is still a placeholder in `contact.html`.
- **Contact form:** it validates but doesn't send yet. Point the form's `action` at a form service (Formspree, Netlify Forms, Basin) and remove the `data-demo` attribute.
- **Social links:** the TikTok and YouTube links in the footer (Instagram is done).

## Publishing with GitHub Pages

In the repository on GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions**. Every push to `main` (including saves from Pages CMS) then runs `.github/workflows/deploy.yml`, which shrinks any new photos and publishes the site. Progress shows under the repository's **Actions** tab. The site is live at `https://<username>.github.io/<repository-name>/`.
