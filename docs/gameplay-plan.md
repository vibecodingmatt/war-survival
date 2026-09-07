# Ashen Crossing: reference and first-playable scope

## Reference observations

The supplied local video is `references/gameplay/war-survival.mp4`, approximately
36 seconds long. Useful sections:

- **0–2 seconds:** blue squad attacks a large red armored opponent on a narrow
  elevated causeway. Bright weapon flashes and an overhead enemy health bar.
- **12–35 seconds:** a fixed elevated perspective looks up a weathered stone
  bridge. A tight blue rifle squad fires forward into dense red ranks.
- Jungle foliage, cliffs, mist, warm daylight, rounded helmets, colored armor,
  recruit/weapon bonuses, and oversized enemies establish the visual direction.

## Implemented interpretation

- A fixed bridge arena instead of an endless scrolling runner.
- Direct squad movement with automatic firing into a selected lane:
  left recruit boards, central enemies, or the right weapon goal.
- Four finite enemy formations per level, including armored troops, grenadiers, and a
  giant final commander.
- A shared squad integrity meter; damage costs riflemen, reducing firepower.
- Small approaching bursts of +1 boards, hidden at 42 soldiers and reopened by
  casualties. Four weapon tiers earned by shooting floating goals before their
  countdown expires, plus rechargeable artillery.
- 617 enemies in Ashen Crossing and 741 in Ember Gate. Side targets trade
  immediate defense for the firepower needed to survive later ranks.
- Enemy ranged attacks and boss attacks use red warning circles that allow dodging.
- Original geometry, animation, effects, and interface; CC0 surface textures
  add weathering and material detail.

The two levels share the bridge layout. Ashen Crossing uses warm dawn light;
Ember Gate adds dusk lighting and drifting embers. The second assault has faster
troops, more armor and grenadiers, shorter weapon windows, and a stronger boss.
Volley rifles upgrade to repeaters, Gatlings, and splash-damage siege cannons.
Each level starts fresh, with direct selection and a next-level victory flow.
Completion checkmarks persist locally. There is no multiplayer or endless mode.

## Useful playtest feedback

- Camera distance and how clearly you can see the soldiers and effects.
- Squad handling with keyboard, mouse drag, or touch drag.
- Rifle and artillery impact, enemy deaths, and boss readability.
- Visual differences you most want brought closer to the reference.
- Whether the waves feel too easy, too fast, or too punishing.
- Device, browser, and graphics setting if performance needs attention.
