# Borderlands campaign balance · v0.6.0

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

Every sector offers linked rewards, first after eight seconds (or immediately in
rift/duel openings), then eighteen seconds
after the last pair resolves or passes. Cards travel for about 11.7 seconds, with
1.2 seconds to read before shooting can start a roughly 1.05-second charge. Taking
one invalidates both targets before any reward is granted. Normal side-lane
supplies pause, preserving their progress; center-lane combat and pods continue.

The left card offers six soldiers or, at full strength, 35 shield capped at 60.
The reward bag shuffles Starfall (eight seconds, three area strikes every 1.35 seconds),
Tesla Halo (ten seconds, three arc drones every 0.8 seconds), and Prism Overload
(eight seconds, 1.5x combat shot damage plus three 65% ricochets), Gravity Well
(eight seconds of infantry pull and pulses, then a nova), and Phoenix Pact
(ten seconds of strafing, 12 immediate integrity, and one lethal-hit rescue).
A rescue consumes the pact, restores 35 integrity, and adds up to six soldiers.
Power damage
does not collect recruit cards or weapon goals. Rewards, timers and airborne
survivors reset on restart; the pause menu freezes gameplay timers.

Large swipes launch 16% of the squad, champions 10%, rounded up. Shield absorption
reduces the fraction launched. The usual eight-damage casualty rule determines
permanent losses; other launched soldiers stop firing and recover over 2.2 seconds.
Fully absorbed hits launch nobody. After an unshielded heavy hit, 0.85 seconds of
recovery prevents overlapping shells from repeatedly hurting the squad in flight;
breaches still deal damage. There is no forced launch on a successfully dodged hit.

## Opening variety and expansion pressure

The introduction is unchanged. Later stages rotate +3 veteran convoys, immediate
reinforcement-versus-power rifts, a central Overdrive crate, a closer first weapon
at 70% cost, and power-versus-power duels. Opening convoys are collected by shooting;
they do not give free starting soldiers. Normal recruits return in +1 bursts.

The five-power bag has its own seeded random generator, independent of combat
randomness. Every power appears before refill and adjacent draws never repeat.
Live deployments choose a fresh seed; test URLs use an explicit reproducible seed.

New sectors keep increasing enemy count, health and speed. Beyond Level 10,
durability growth is gentler because the army and permanent gun are capped.
Expansion wave clears provide five seconds to rearm; a very fast first clear
keeps the opening supply window available until 25 seconds. There is no hidden
equipment scaling or guaranteed victory based on a chosen reward.

## Champion encounters and contact

Levels 1–2 remain introductory. Levels 3–15 have two different champions in wave
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

npm run test:balance checks fifteen sectors, three seeds (731, 19, 2048), and four
movement policies. Tactical decisions occur every 0.2 seconds. The policy only
chooses movement and artillery; all shots, upgrades, recruits and damage use the
ordinary simulation. It retreats from approaching ranks, gives telegraphed guardian swings priority
over infantry distance, chooses one rift reward, and pursues upgrades during lulls.

| Policy | Results across 45 runs |
| --- | --- |
| Neglect recruitment and weapons | 0 victories, 45 defeats |
| Recruit, neglect stronger weapons | 0 victories, 45 defeats |
| Upgrade weapons, neglect recruitment | 2 victories, 43 defeats |
| Blend recruits, weapons, powers, dodging and artillery | 43 victories, 2 defeats |

| Sector | Tactical wins | Winning time | Winning integrity | Soldiers lost in winning runs |
| --- | --- | --- | --- | --- |
| 1 | 3 / 3 | 61–67s | 100 | 0 |
| 2 | 3 / 3 | 71–81s | 100 | 0 |
| 3 | 3 / 3 | 65–73s | 86–100 | 0–4 |
| 4 | 3 / 3 | 71–81s | 100 | 0–1 |
| 5 | 3 / 3 | 77–80s | 100 | 0–2 |
| 6 | 3 / 3 | 76–88s | 48–100 | 0–7 |
| 7 | 3 / 3 | 88–90s | 61–79 | 2–7 |
| 8 | 3 / 3 | 90–94s | 51–78 | 2–8 |
| 9 | 3 / 3 | 90–92s | 73–100 | 0–5 |
| 10 | 3 / 3 | 91–101s | 21–59 | 8–11 |
| 11 | 3 / 3 | 107–116s | 91–100 | 3–5 |
| 12 | 2 / 3 | 100s | 48–74 | 3–9 |
| 13 | 3 / 3 | 103–110s | 60–93 | 3–8 |
| 14 | 3 / 3 | 110–115s | 15–90 | 1–12 |
| 15 | 2 / 3 | 111–115s | 62–96 | 3–12 |

The fixed tactical policy clears the original ten stages on all three draws.
Each expansion stage must clear on at least two of three draws; these harder
stages deliberately permit failed runs. The full browser campaign also verifies
a complete fifteen-stage victory using ordinary inputs. These are sample bot
outcomes, not promised human completion rates. Mechanics tests separately cover
exclusive choices, pull resistance, expiry, phoenix rescue, and shielded launches.

## Browser and progression checks

Cookie tests cover first visits, sequential unlocks, replays, malformed values,
one-year persistence and migration of existing local victories. Client-side
progress is a convenience for a single-player game, not an anti-cheat system.

Desktop checks exercise movement, artillery, pause, all nine Next transitions,
locked click rejection and unlock persistence after reload. Campaign checks play
all fifteen encounters with tactical inputs. Mobile checks cover eight viewports with
safe insets, drag controls, two-finger artillery, rotation, a Level 15 victory and
Deploy visibility without scrolling the menu, including a fully unlocked campaign.

Phone testing uses Chrome emulation; physical iOS/Android performance has not been
benchmarked. Human playtesting should guide the next difficulty adjustment.
