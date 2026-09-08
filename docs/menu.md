# Main menu · v0.8.0

The menu prioritizes the game identity, the squad-versus-guardian encounter, and
the next playable mission. New players see Play Now; returning players see
Continue Campaign or Replay Mission, derived from the existing campaign cookie.
No progress or gameplay rules changed.

The desktop composition places the title and deployment on the left and leaves
the guardian visible on the right. Portrait phones use an upper artwork crop and
a lower deployment area. Short landscape phones use two columns. The sector strip
scrolls horizontally, with native touch scrolling and desktop navigation buttons.
It reveals the selected mission after shader compilation and on returning to the
menu. Disabled sectors retain their prerequisite labels.

The native How to play dialog handles keyboard focus containment and Escape;
closing returns focus to its trigger. Controls follow the existing input-device
detection. Entry animation respects reduced motion. All menu styling is scoped
in `css/menu.css`; the battle HUD keeps its existing styles.

Run `npm run test:menu` for eight viewport layouts, safe-area insets, overlapping
regions, image loading, help focus, returning-save selection, replay and returning
from battle. Screenshots are written under `test-results/menu/`. Also run the
existing browser, mobile and polish suites for releases. Phone testing uses Chrome
emulation, not physical iOS/Android devices.

## Artwork

Tool: built-in imagegen. Final asset: `assets/images/menu-battle-v1.jpg`.
The generated PNG was encoded as a quality-88 JPEG for a 399,424-byte download.
The image is preloaded; all typography and interactive elements are HTML.

Final generation prompt:

> Use case: stylized-concept. Asset type: production website main-menu background artwork for War: Survival, wide 1536x1024 composition. Create a premium stylized 3D fantasy squad battle illustration: small toy-like blue armored soldiers with gold helmet crests and compact rifles defend a weathered stone bridge over a lush turquoise jungle gorge with tall waterfalls. A towering crimson armored knight guardian with glowing amber eyes, spiked shoulders and a mace leads a horde of small red armored enemies from an ancient ruined gate. Dramatic sun shafts, warm golden tracer shots, mist, lush leaves and a few floating embers. Polished tactile armor, charming heroic proportions, thrilling adventurous mood. Composition for a website: all principal action is in the RIGHT TWO THIRDS, guardian head near 72% x / 30% y, blue soldiers in lower center-right, bridge recedes into upper-right. Left third is dark quiet teal jungle shadows and mist for overlaid HTML typography. Keep the whole encounter readable in a center-right portrait crop. Full bleed art, no UI, no text, no letters, no logos, no watermarks, no borders, no blood.
