# The Growing Horde — v0.2 balance

Enemy pressure is fixed and does not scale in response to the player's upgrades.
The loss condition uses actual enemy contact and breaches, not a scripted
requirement to purchase a particular gun or reach a squad size.

| Wave | Regular formation, including specialist troops | Base enemy health |
| --- | ---: | ---: |
| Vanguard | 80 | 62 |
| Red Tide | 136 | 120 |
| Iron Company | 184 | 230 |
| Crimson Warden | 216, plus the boss | 320 |

The starting nine riflemen cannot keep pace with the later formations. Recruiting
adds shooters; weapon upgrades increase their per-soldier output. The final cannon
also damages nearby enemies, making tight ranks vulnerable. Holding either side
lane stops new rifle shots at the horde; artillery remains a limited relief tool.
Bullets already in flight still finish their shots.

Partial damage on the right-side goal survives lane changes and wave transitions.
There are no free weapon or squad upgrades between waves. Each escaped enemy
damages squad integrity, including simultaneous breaches.

## Automated strategy checks

Three seeds (731, 19, 2048) were checked using ordinary movement, firing, and
artillery inputs. The blended policy aims for roughly 16 / 24 / 32 / 38 soldiers
and weapon tiers 2 / 3 / 4 / 4, returns to defense when enemies approach, and
dodges marked impacts. Decisions are reconsidered every 0.2 seconds.

| Strategy | Result in the checked seeds |
| --- | --- |
| Starting squad and rifle, with artillery | Overrun in wave 3 |
| Recruit investment, starting rifle | Overrun in wave 3 |
| Weapon investment, nine soldiers | Overrun in wave 3 |
| Recruits, guns, defense, and artillery | Victory, about 71 seconds |
| Recruits, guns, and defense without artillery | Victory, about 86–88 seconds |

This establishes the intended tradeoff and a viable path, rather than proving
every possible strategy. A human player's timing and movement will differ.
The full browser run also completed all four waves through these same mechanics.

Run `npm run test:balance` to reproduce the comparisons. Core regression tests
require unupgraded play to lose and blended play to remain winnable with and
without artillery. The fixed seed is currently deliberate for repeatable
playtest feedback.
