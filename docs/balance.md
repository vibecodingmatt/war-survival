# Borderlands campaign balance · v0.4.1

Pressure is fixed in data/waves.js. Successive sectors increase enemy count,
health and speed, with different equipment and boss patterns. There is no hidden
scaling against the player's equipment and no scripted damage to force casualties.

Each sector starts with nine riflemen and 100 integrity. Recruit bursts add one
soldier per shot, up to 42. Full squads hide boards until casualties. Moving weapon
goals cost 650, 2,800 and 8,500 damage; partial progress is lost when a board passes.
Returning goals create another opportunity. Use the end of a thinning wave to work
on the next weapon instead of waiting for its replacement to arrive under pressure.

Supply pods grant Overdrive (nine seconds), Rally (twelve seconds), Shield (30,
capped at 50), or Repair (20 integrity). Every eight unshielded damage costs a
soldier. Wave clears restore ten integrity, but soldiers must be recruited again.

## Champion encounters and contact

Levels 1–2 remain introductory. Levels 3–10 have two different champions in wave
two and another in wave three; from Level 5, wave three also has a pair. The final
wave has its sector guardian. Wave-two champions have 9% of final boss health,
wave-three champions 20%; pairs have separate positions and staggered approaches.

Later bosses advance past the old stopping point into squad range. They stop to
wind up a swipe for 1.05 seconds, then recover before pursuing again. Large
guardians cover a wider area than champions. Killing the attacker cancels its
pending swipe, and moving the squad clear avoids the damage. Frost slows bosses
less than infantry. Ranged impacts have lower damage than a final guardian's
swipe, keeping repeated close encounters dangerous without making one stray shell
decide the run. Boss waves lasting more than 65 seconds enrage and summon guards.

## Reproducible simulation checks

npm run test:balance checks ten sectors, three seeds (731, 19, 2048), and four
movement policies. Tactical decisions occur every 0.2 seconds. The policy only
chooses movement and artillery; all shots, upgrades, recruits and damage use the
ordinary simulation. It retreats from approaching ranks, dodges laterally when
needed, and pursues upgrades during the lull at the end of a wave.

| Policy | Results across 30 runs |
| --- | --- |
| Neglect recruitment and weapon upgrades | 30 defeats |
| Focus recruitment, neglect stronger weapons | 30 defeats |
| Focus weapons, neglect recruitment | 30 defeats |
| Blend recruitment, weapons, defense, dodging and artillery | 30 victories |

| Sector | Completion time | Remaining integrity | Soldiers lost during run |
| --- | --- | --- | --- |
| 1 | 68–71s | 100 | 0 |
| 2 | 86–88s | 100 | 0 |
| 3 | 69–73s | 100 | 0 |
| 4 | 75–76s | 100 | 0 |
| 5 | 74–75s | 94–100 | 0–3 |
| 6 | 81s | 80–84 | 2–5 |
| 7 | 83–90s | 79–100 | 1–3 |
| 8 | 87–90s | 51–78 | 5–8 |
| 9 | 88–91s | 27–68 | 6–11 |
| 10 | 93–97s | 30–44 | 9–11 |

The final three sectors also assert at least one completed melee hit, boss swipe
and soldier casualty per tactical run, followed by victory. These are automated
sample outcomes, not promised human completion rates. Replacement recruits mean
the final squad size does not by itself measure the losses sustained.

## Browser and progression checks

Cookie tests cover first visits, sequential unlocks, replays, malformed values,
one-year persistence and migration of existing local victories. Client-side
progress is a convenience for a single-player game, not an anti-cheat system.

Desktop checks exercise movement, artillery, pause, all nine Next transitions,
locked click rejection and unlock persistence after reload. Campaign checks play
all ten encounters with tactical inputs. Mobile checks cover eight viewports with
safe insets, drag controls, two-finger artillery, rotation, a Level 10 victory and
Deploy visibility without scrolling the menu, including a fully unlocked campaign.

Phone testing uses Chrome emulation; physical iOS/Android performance has not been
benchmarked. Human playtesting should guide the next difficulty adjustment.
