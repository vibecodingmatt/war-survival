# Sharing previews

`index.html` contains static Open Graph and X/Twitter card metadata for
`https://vibecodingmatt.github.io/war-survival/`. Image URLs are absolute HTTPS URLs
so crawlers can resolve them without executing JavaScript. The canonical URL omits
test parameters and fragments.

## Assets

- `assets/images/war-survival-social-v1.jpg`: 1200 x 630 opaque JPEG key art.
- `assets/images/apple-touch-icon.png`: 180 x 180 PNG derived from the existing shield emblem.
- `assets/images/favicon-32.png`: 32 x 32 PNG fallback for the SVG favicon.

The share artwork is promotional illustration, not a gameplay screenshot. Generated
using the built-in imagegen tool, then resized and JPEG-encoded for delivery.
Only crawlers download the share image; it is not part of the game's render loop.
The existing emblem remains the source for the raster icons.

## Verification and publishing

Check the initial HTML with JavaScript disabled and fetch every referenced asset
under `/war-survival/`. Confirm the JPEG decodes at the advertised dimensions and
the icons decode at their declared sizes. Inspect the image at phone-preview size.

Publish the HTML and image assets together through the repository's normal GitHub
Pages release. After publishing, verify the public page source and image URLs,
then share a fresh link in Messages and the intended social apps. Existing previews
may be cached by the receiving service; changing local files cannot refresh them.
For future artwork changes, increment the image filename and update both Open Graph
and Twitter references. Facebook's Sharing Debugger can request a fresh scrape.
Device/app rendering remains a manual check; local verification cannot guarantee
that every messaging service will show a preview.

References: [Open Graph metadata](https://ogp.me/),
[Apple Messages rich previews](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages).

## Generation prompt

```text
Use case: ads-marketing
Asset type: finished social link preview key art for the browser game War: Survival. Generate a wide landscape image, ideally 1200x630 pixels, approximately 1.905:1.
Primary request: A polished, irresistible game cover that reads instantly in a small SMS preview. Draw from this game's actual premise: toy-like blue and gold helmeted riflemen defending an ancient stone bridge above a turquoise jungle gorge, facing a red armored horde and an oversized crimson armored knight guardian. An exciting fantasy squad survival adventure, bright stylized 3D low-poly collectible toy aesthetic, not realistic warfare.
Scene: diagonal stone bridge receding into lush jungle ruins and waterfalls, blue squad grouped in the lower foreground firing golden tracers toward a looming crimson knight with glowing orange eyes and massive armor in the middle distance. A few red troops at his feet provide scale. Cyan energy and warm golden sparks add punch. Cohesive cinematic teal and gold with vivid crimson opposition. Bold clear silhouettes, high contrast and readable at thumbnail size.
Composition: integrated premium game-cover typography in upper left/center, with action below and to the right. Keep the full title and main blue squad/guardian comfortably inside the central 80 percent; edges contain expendable scenery. All key content has generous margins for social cropping.
Text (verbatim): large highly legible stacked title "WAR:" then "SURVIVAL". Under title smaller but bold "BUILD YOUR SQUAD." then "BREAK THE HORDE." A modest footer reads "PLAY FREE IN YOUR BROWSER".
Typography: strong ivory and warm gold display lettering, restrained shadow against dark teal foliage, large enough for a phone preview. No additional text.
Constraints: promotional illustration, not a fabricated gameplay screenshot; no UI panels, fake stats, platform logos, watermarks, gore, photoreal soldiers or real military insignia. Joyful toy-scale action with an intimidating fantasy boss.
```
