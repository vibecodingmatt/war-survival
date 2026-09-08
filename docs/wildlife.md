# Fantastical world creatures · v0.7.2

Every world has one exclusive fantasy encounter, with its own anatomy, habitat
and behavior. Do not fill the campaign with repeated bird/insect populations or
recolored versions of one flying shape. Resting creatures belong on a visible
ledge, ruin, ice shelf or lily pad. Aquatic creatures belong in the coral world.

| World | Signature encounter | Behavior and habitat |
| --- | --- | --- |
| Ashen Crossing | Ancient mossback tortoise | Mossy shell garden; watches from a rooted ledge |
| Ember Gate | Fire-tailed phoenix | Long flame feathers; slowly unfurls on a ruined roost |
| Jade Cascades | Jade qilin | Branched antlers, scales and golden hooves; stands by the falls |
| Frostglass Pass | Six-tusk frost mammoth | Shaggy coat, curled trunk and ivory tusks; ice shelf |
| Sunscar Oasis | Golden sphinx | Striped headdress and extended lion paws; sandstone steps |
| Tempest Reach | Thunder roc | Crest and layered storm feathers; surveys a basalt crag |
| Amber Sanctuary | Nine-tailed kitsune | Cream-tipped tail fan and alert ears; autumn garden ledge |
| Cinder Caldera | Two obsidian dragons | Horns, teeth, spines and ribbed wings; circle the caldera |
| Lumen Wilds | Moon-antler spirit stag | Luminous antler growths and spotted coat; mushroom ledge |
| The Sky Citadel | Griffin sentinel | Eagle head, folded wings, lion haunches and tail; floating battlement |
| Coral Cathedral | Ancient reef nautilus | Spiral shell, ridges, eyes and curling tentacles; swims through the reef |
| Clockwork Gardens | Brass owl automaton | Jeweled eyes and gear breastplate; turns its head above a toothed gear perch |
| Moonlotus Marsh | Lotus frog king | Flower crown, golden eyes and inflating throat; giant lily pad at water height |
| Prismatic Rift | Crystal basilisk | Six legs, faceted scales and quartz spines; crystal shelf |
| Dragon Observatory | Cosmic hare | Long moving ears, constellation markings and a halo; cratered moon fragment |

Only the jungle has butterflies: five resident blue morphos, plus an occasional
eight-butterfly gathering beside the waterfall. Balanced uses four residents and
five gathering butterflies, with further resident reductions under adaptation.
The coral world also has four striped reef fish (three on Balanced). These small
species are exclusive to their respective worlds. Thirteen worlds have no small
flying wildlife population. The existing observatory dragon remains part of its
original landmark; it is separate from the new volcanic dragons.

## Implementation

`data/wildlife.js` assigns each biome its exclusive signature creature and optional
small residents. `fantasy-models.js` authors colored, merged geometry for body,
head, appendages and support. `fantasy-creatures.js` animates breathing, gaze,
ears, tails, throat inflation, wing poses, dragon circles and nautilus swimming.
These use a cosmetic clock and never consume combat randomness or award effects.

There are at most four instanced batches per signature encounter, with one or two
creatures. Jungle/coral residents add two batches. Total living-world detail stays
within twelve batches. Populations peak at fourteen creatures in the jungle
(ten on Balanced). No new lights, downloaded textures or per-frame canvas uploads
are introduced. The biome root owns and disposes every mesh/material on switching
worlds. Balanced retains the signature creature and its geometry, updates wildlife
at 30 Hz, and trims small populations. Reduced motion slows poses and flight;
pausing freezes everything.

## Verification

Run `npm test`, `npm run test:wildlife` and `npm run test:polish` for these visual
changes. Unit checks require fifteen distinct signature creatures, exclusive small
species, grounded resting positions, finite colored geometry, bounded instances,
clear combat lanes, butterfly gathering intervals and pause stability. Browser
checks capture every world on desktop and phone and verify resting anchors and
the absence of sky-city aquatic wildlife. Inspect the captures, especially dragon
framing and the relationship between an animal's feet and its support.

The polish suite covers resource cleanup, reduced motion and simultaneous combat
effects. Use its stress report to assess desktop-host phone emulation, not as a
physical iOS/Android benchmark. Keep artifacts in ignored `test-results/`.
Publish through [publishing.md](publishing.md), reusing unchanged checks instead
of repeating a complete suite during every documentation follow-up.

The v0.7.2 checks on 2026-09-08 passed all five unit test files, all fifteen
desktop/phone wildlife compositions and the complete polish suite. The phone
emulation combat stress sample held 60 FPS with 239 draws and 16.8 ms frame p95.
