# The Ember Gate — v0.3 balance

Enemy pressure is fixed. Enemies do not scale in response to upgrades, and
there is no scripted requirement to buy a gun. Losses come from enemy contact,
incoming impacts, and breaches.

| Wave | Level 1: formation / base HP / speed | Level 2: formation / base HP / speed |
| --- | --- | --- |
| 1 | 80 / 62 / 1.8 | 104 / 76 / 2.1 |
| 2 | 136 / 120 / 1.95 | 160 / 170 / 2.3 |
| 3 | 184 / 230 / 2.1 | 216 / 310 / 2.5 |
| 4 | 216 + boss / 320 / 2.2 | 260 + boss / 450 / 2.65 |

Level 2 adds more armored troops and grenadiers. Its boss has 17,500 HP instead
of 11,500, fires three impacts instead of two, and gives 1.7 seconds of warning
instead of 2. Each level starts with nine riflemen, the starting rifle, and full
integrity. Wave transitions heal 10 integrity but grant no soldiers or weapons.

## Supply windows and casualties

- Recruits arrive in bursts of up to six, 10 seconds apart in Level 1 and 11 in
  Level 2. The boards travel at 2.4 / 2.9 units per second.
- Hitting the 42-soldier cap removes all recruit boards and invalidates pending
  shots at them. Casualties reopen recruitment within 1.5 seconds.
- Every eight accumulated integrity damage costs one soldier, down to one
  remaining commander. Fallen blue soldiers animate for 4.5 seconds. Integrity
  reaching zero still ends the run.
- Weapon goals start at z = −14 and expire at z = 20, moving at 1.65 / 2.15 units
  per second: about 20.6 / 15.8 seconds to finish the goal.
- Damage persists while switching lanes and between waves until the board
  expires. Expiry invalidates pending bullets and discards partial progress.
  A fresh attempt arrives after 4 / 5 seconds. Successful upgrades also leave
  a 4 / 5 second gap before the next weapon goal.
- Artillery affects enemies only. It cannot collect recruits or unlock weapons.

## Automated strategy checks

Three seeds (731, 19, 2048) were checked using ordinary movement, auto-fire, and
artillery inputs, reconsidered every 0.2 seconds. The policy uses visible supply
availability and deadlines, returns to defense near approaching enemies, and
dodges marked impacts. It targets 15 / 25 / 34 / 42 soldiers in Level 1 and
21 / 30 / 38 / 42 in Level 2, with weapon tiers 2 / 3 / 4 / 4 in both.

| Strategy | Level 1 | Level 2 |
| --- | --- | --- |
| Starting squad and rifle, with artillery | Overrun in wave 3, 70–78s | Overrun in wave 2, 43–51s |
| Recruits only, with artillery | Overrun in wave 4 | Overrun in wave 2 |
| Weapons only, with artillery | Overrun in wave 3 | Overrun in wave 2 |
| Recruits, guns, defense, and artillery | Victory, 72–73s | Victory, 87–88s |
| Recruits, guns, and defense, no artillery | Victory, 94–95s | Victory, 101–102s |

The Level 2 policy misses one weapon opportunity with artillery and two without,
demonstrating that a missed board is recoverable. Without artillery it also
takes 2–4 casualties and recruits replacements. These runs establish a viable
route and the intended tradeoffs; human timing and decisions will differ.

Run `npm run test:balance` to reproduce comparisons. Simulation regression
tests require unupgraded play to lose and blended play to win both levels with
and without artillery across all three seeds. Browser checks complete both
levels, deliberately inflict a casualty at the cap to check replacement visuals,
and exercise the actual next-level, replay, and direct-selection controls.
