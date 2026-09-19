# Alternate Exposures

Website for **Alternate Exposures**, the photography studio of Bryson Glass.

A static site (HTML, CSS and a little JavaScript) with no build step. Open `index.html` in a browser, or serve the folder with any static host.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: cover, about, selected work, sessions & rates, process |
| `gallery.html` | Filterable gallery with a full-screen image viewer |
| `contact.html` | Contact details, enquiry form, FAQ |

Styles live in `css/styles.css` and scripts in `js/main.js`.

## Running locally

```bash
python -m http.server 8080
```

Then visit http://localhost:8080.

## Still to fill in

- **Email and phone:** replace `hello@example.com` and `(000) 000-0000` in all three HTML files.
- **Rates:** the `$000` prices in the rates section of `index.html`.
- **Bracketed text:** `[City, State]`, `[Year]`, `[#]` and the bio copy.
- **Photos:** put images in an `images/` folder and swap each `<div class="ph ...">` for `<img src="images/photo.jpg" alt="...">`. See the comment at the top of the gallery grid in `gallery.html`.
- **Contact form:** it validates but doesn't send yet. Point the form's `action` at a form service (Formspree, Netlify Forms, Basin) and remove the `data-demo` attribute.
- **Social links:** the Instagram, Facebook and TikTok links in the footer.

## Publishing with GitHub Pages

In the repository on GitHub, go to **Settings → Pages**, set the source to **Deploy from a branch**, choose `main` and `/ (root)`, and save. The site will be live at `https://<username>.github.io/<repository-name>/` a minute or two later.
