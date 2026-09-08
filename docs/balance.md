# Borderlands campaign balance · v0.7.0

Pressure is fixed in data/waves.js. Successive sectors increase enemy count,
health and speed, with different equipment and boss patterns. There is no hidden
scaling against the player's equipment and no scripted damage to force casualties.

Each sector starts with nine riflemen and 100 integrity. Recruit bursts add one
soldier per shot, up to 42. Full squads hide boards until casualties. Moving weapon
goals cost 650, 2,800 and 8,500 damage; partial progress is lost when a board passes.
Returning goals create another opportunity. Use the end of a thinning wave to work
on the next weapon instead of waiting for its replacement to arrive under pressure.

Supply pods grant Overdrive (nine seconds), Rally (twelve seconds), Shield (30,
capped at 50), Repair (20 integrity), or one of five temporary ammo modifiers.
Each of the four support rewards appears twice and each ammo once in an independent
13-entry shuffled bag. See [the combat guide](visual-combat-guide.md) for exact ammo
damage/cadence values and the rare Rainbow Rush. Every eight unshielded damage costs a
soldier. Wave clears restore ten integrity, but soldiers must be recruited again.

## Rift choices and heavy impacts

Every sector offers linked rewards, first after eight seconds (or immediately in
rift/duel openings), then eighteen seconds
after the last pair resolves or passes. Cards travel for about 11.7 seconds, with
1.2 seconds to read before shooting can start a roughly 1.05-second charge. Taking
one invalidates both targets before any reward is granted. Normal side-lane
supplies pause, preserving their progress; center-lane combat and pods continue.

The left card usually offers six soldiers or, at full strength, 35 shield capped at 60.
Every third recurring encounter offers two different major powers instead.
The reward bag shuffles Starfall (eight seconds, three area strikes every 1.35 seconds),
Tesla Halo (ten seconds, three arc drones every 0.8 seconds), and Prism Overload
(eight seconds, 1.5x combat shot damage plus three 65% ricochets), Gravity Well
(eight seconds of infantry pull and pulses, then a nova), and Phoenix Pact
(ten seconds of strafing, 12 immediate integrity, and one lethal-hit rescue).
A rescue consumes the pact, restores 35 integrity, and adds up to six soldiers.
Quack Attack adds four giant duck drops over eight seconds, each dealing
`760 + zeroBasedSector * 32` in a 5.2-unit radius. Toy Tanks sends three tanks every
2.65 seconds for ten seconds; each hits a given enemy once for
`250 + zeroBasedSector * 18` (80% against bosses, whose wider hitboxes span more lanes).
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

The seven-power bag has its own seeded random generator, independent of combat
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
over infantry distance, compares the two offered powers, avoids spending a whole
rift on one or two recruits, and pursues upgrades during lulls.

| Policy | Results across 45 runs |
| --- | --- |
| Neglect recruitment and weapons | 0 victories, 45 defeats |
| Recruit, neglect stronger weapons | 0 victories, 45 defeats |
| Upgrade weapons, neglect recruitment | 2 victories, 43 defeats |
| Blend recruits, weapons, powers, dodging and artillery | 43 victories, 2 defeats |

| Sector | Tactical wins | Winning time | Winning integrity | Soldiers lost in winning runs |
| --- | --- | --- | --- | --- |
| 1 | 3 / 3 | 65–66s | 100 | 0 |
| 2 | 3 / 3 | 70–82s | 100 | 0 |
| 3 | 3 / 3 | 78–79s | 83–100 | 0–2 |
| 4 | 3 / 3 | 71–81s | 80–100 | 2–6 |
| 5 | 3 / 3 | 74–80s | 94–100 | 0–2 |
| 6 | 3 / 3 | 76–79s | 92–100 | 0–2 |
| 7 | 3 / 3 | 83–89s | 75–82 | 2–5 |
| 8 | 3 / 3 | 90–93s | 16–74 | 5–15 |
| 9 | 3 / 3 | 87–93s | 35–71 | 6–10 |
| 10 | 3 / 3 | 100–105s | 62–100 | 0–8 |
| 11 | 3 / 3 | 103–110s | 61–71 | 3–9 |
| 12 | 3 / 3 | 99–107s | 22–100 | 0–9 |
| 13 | 3 / 3 | 99–107s | 63–100 | 0–7 |
| 14 | 2 / 3 | 97–109s | 33–55 | 8–13 |
| 15 | 2 / 3 | 121–123s | 11–51 | 11–16 |

The fixed tactical policy clears the original ten stages on all three draws.
Each expansion stage must clear on at least two of three draws; these harder
stages deliberately permit failed runs. The full browser campaign also verifies
a complete fifteen-stage victory using ordinary inputs and seed 19. The two failed
expansion samples are sector 14/seed 2048 and sector 15/seed 731; they remain in the
balance suite, whose original thresholds are unchanged. These are sample bot
outcomes, not promised human completion rates. Mechanics tests separately cover
exclusive choices, pull resistance, expiry, phoenix rescue, and shielded launches.

## Browser and progression checks

Cookie tests cover first visits, sequential unlocks, replays, malformed values,
one-year persistence and migration of existing local victories. Client-side
progress is a convenience for a single-player game, not an anti-cheat system.

Desktop checks exercise movement, artillery, pause, all fourteen Next transitions,
locked click rejection and unlock persistence after reload. Campaign checks play
all fifteen encounters with tactical inputs. Mobile checks cover eight viewports with
safe insets, drag controls, two-finger artillery, rotation, a Level 15 victory and
Deploy visibility without scrolling the menu, including a fully unlocked campaign.

Phone testing uses Chrome emulation; physical iOS/Android performance has not been
benchmarked. Human playtesting should guide the next difficulty adjustment.
