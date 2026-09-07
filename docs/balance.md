# Borderlands campaign balance · v0.5.0

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

## Rift choices and heavy impacts

Every sector offers linked rewards, first after eight seconds, then eighteen seconds
after the last pair resolves or passes. Cards travel for about 11.7 seconds, with
1.2 seconds to read before shooting can start a roughly 1.05-second charge. Taking
one invalidates both targets before any reward is granted. Normal side-lane
supplies pause, preserving their progress; center-lane combat and pods continue.

The left card offers six soldiers or, at full strength, 35 shield capped at 60.
The right rotates Starfall (eight seconds, three area strikes every 1.35 seconds),
Tesla Halo (ten seconds, three arc drones every 0.8 seconds), and Prism Overload
(eight seconds, 1.5x combat shot damage plus three 65% ricochets). Power damage
does not collect recruit cards or weapon goals. Rewards, timers and airborne
survivors reset on restart; the pause menu freezes gameplay timers.

Large swipes launch 16% of the squad, champions 10%, rounded up. Shield absorption
reduces the fraction launched. The usual eight-damage casualty rule determines
permanent losses; other launched soldiers stop firing and recover over 2.2 seconds.
Fully absorbed hits launch nobody. After an unshielded heavy hit, 0.85 seconds of
recovery prevents overlapping shells from repeatedly hurting the squad in flight;
breaches still deal damage. There is no forced launch on a successfully dodged hit.

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
ordinary simulation. It retreats from approaching ranks, gives telegraphed guardian swings priority
over infantry distance, chooses one rift reward, and pursues upgrades during lulls.

| Policy | Results across 30 runs |
| --- | --- |
| Neglect recruitment and weapon upgrades | 30 defeats |
| Focus recruitment, neglect stronger weapons | 30 defeats |
| Focus weapons, neglect recruitment | 28 defeats; 2 introductory-sector victories |
| Blend recruitment, weapons, defense, dodging and artillery | 30 victories |

| Sector | Completion time | Remaining integrity | Soldiers lost during run | Soldiers launched |
| --- | --- | --- | --- | --- |
| 1 | 70–74s | 100 | 0 | 0 |
| 2 | 83–85s | 100 | 0–1 | 0 |
| 3 | 69–74s | 83–100 | 1–4 | 0–7 |
| 4 | 78–81s | 100 | 0–2 | 0 |
| 5 | 78–79s | 86–100 | 0–4 | 0 |
| 6 | 80–82s | 69–100 | 0–6 | 0–3 |
| 7 | 88–89s | 50–91 | 1–8 | 0–14 |
| 8 | 86–93s | 7–34 | 10–13 | 14–20 |
| 9 | 87–90s | 34–91 | 1–10 | 0–15 |
| 10 | 93–98s | 19–53 | 8–12 | 4–24 |

These are automated sample outcomes, not promised human completion rates. Strong
weapons plus a rift power can carry the introductory sector without recruits;
the same policy loses in every later sector in these checks. Strong
power timing or a shield can prevent a hit entirely, so individual late runs need
not lose soldiers. Separate mechanics tests verify percentage launches, casualties,
shield protection, invulnerability and survivors resuming fire after recovery.
Replacement recruits mean final squad size alone does not measure losses.

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
