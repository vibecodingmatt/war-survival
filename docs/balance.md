# Borderlands campaign balance · v0.4.0

Pressure is fixed in `data/waves.js`. Each successive sector increases the four
waves' enemy count, base health, and movement speed. It does not secretly scale
enemies against the player's equipment. New weapon routes and bosses change which
tactics work well, so perceived difficulty is not a simple linear curve.

Every sector starts with nine riflemen and 100 integrity. Recruit bursts add one
soldier per shot, capped at 42. Full squads hide the boards until casualties.
Moving weapon goals cost 650, 2,800, and 8,500 damage; they expire at z = 20 and
return after a short gap. Partial damage survives switching lanes and wave changes
only until the board passes. Later sectors offer the second upgrade during wave
one; postponing it until the next wave can waste that opportunity.

Supply pods and powder carts enter from sector three. Their benefits are earned
by shooting them. Overdrive lasts nine seconds, Rally twelve, Shield absorbs up
to 30 damage per pod (50 maximum), and Repair restores 20 integrity. Incoming
damage costs one soldier per eight damage that reaches squad integrity. Wave
clears restore 10 integrity but do not restore soldiers.

Bosses use four warning patterns across five body types. Sectors 3–10 also put a
champion in wave two or three, at 32% of the final guardian's health. If a boss
wave lasts over 65 seconds, it enrages, attacks more often, and summons elite
guards. This prevents a weak squad from indefinitely dodging one stationary boss
while repeatedly failing to finish the weapon board. Normal tactical victories
complete boss waves before enrage.

## Reproducible simulation checks

`npm run test:balance` runs ten sectors, three seeds (731, 19, 2048), and four
policies. Inputs are ordinary movement, automatic firing, and artillery, selected
every 0.2 seconds. No policy grants free soldiers, damage, weapons, or health.

| Policy | Result across 30 runs |
| --- | --- |
| Starting squad and rifle, with artillery | 30 defeats |
| Recruit soldiers but keep the starting rifle | 30 defeats |
| Upgrade weapons but skip recruiting | 30 defeats |
| Blend recruitment, upgrades, defense, dodging and artillery | 30 victories |

The blended policy targets 15/25/34/42 soldiers in sector one and 21/30/38/42
afterward. It pursues weapon tier three during the first wave from sector three,
then the final gun during wave three. It reacts to the board's remaining time
and moves between three depths to evade ground attacks.

| Sector | Sample completion time | Remaining integrity |
| --- | --- | --- |
| 1 | 71–72s | 100 |
| 2 | 86s | 100 |
| 3 | 67–68s | 100 |
| 4 | 72s | 100 |
| 5 | 70–74s | 100 |
| 6 | 71–73s | 100 |
| 7 | 77–79s | 100 |
| 8 | 76–78s | 100 |
| 9 | 77–80s | 65–74 |
| 10 | 82–84s | 86 |

These are an automated policy's results, not predicted human completion times.
Area damage and cart chains shorten some later encounters even though their
formations are stronger. Human playtesting should guide further tuning.

## Browser checks

`test:campaign` completes all ten sectors with tactical inputs, captures each
world and guardian, encounters all ten weapons, and verifies saved completion.
`test:browser` checks keyboard/mouse controls, pause, immediate Space artillery,
all nine Next Level transitions, fresh starts, and the final campaign result.
`test:mobile` checks eight touch viewports with safe insets, removal of persistent
lane panels, drag targeting, two-finger artillery, rotation, and a Level 10 win.

Physical phone GPU performance and human difficulty have not been benchmarked.
