# Shadow Archer — The Lost Fortress (Remastered)

A browser-based 2.5D archery combat game built with React, TypeScript, Vite, and Phaser 3.

## ✨ Implemented Features

### 🦴 Ragdoll Physics
- **Articulated Skeletal Solver:** Verlet particle integration with distance constraints and joint angle stiffness.
- **Dynamic Knockback & Tumble:** Directional impulse applied directly to hit limbs upon defeat (e.g. violent headshot recoil, torso airborne throw).
- **Stuck Arrows:** Projectiles stick into hit body parts and tumble along with the ragdoll.
- **Ground & Wall Collision:** Realistic bounce, sliding friction, and physics settlement.

### 🏃 Character Animations
- **Procedural Bone Animation:** Breathing idle, cape sway, and head tracking.
- **Dynamic Bow Tension:** Bow arms pull string back proportionally to draw power; bow stave flexes under spring tension.
- **Combat Postures:** Shoot recoil snap, dodging roll with shadow after-images, raised shield defensive stance with hexagonal barrier, and hit flinch reactions.

### 🎨 Premium Graphics
- **Parallax Environments:** 3 handcrafted themes (*The Lost Fortress*, *Frostfang Peak*, *Molten Caldera*).
- **Atmospheric Weather FX:** Drifting blizzard snow, fiery embers, and twilight dust particles.
- **Dynamic Lighting:** Warm torch flames with additive light blending.
- **Elemental Visual FX:** Fire explosion bursts, ice crystal shattering, corrosive acid bubbles, and arcane warp rings.

### 🤖 Smart Enemy AI
- **Ballistic Trajectory Solver:** Accounts for distance, elevation, gravity, and current wind.
- **Reactive Defense:** Enemies detect incoming player arrows in flight; agile scouts dodge/roll while armored guards raise shields.
- **Boss Mechanics:** Multi-arrow spread volleys, enrage states below 50% HP, and dynamic wind shifts.

### 🏰 Campaign Mode & Stages
- **3 Acts / Chapters:**
  1. *The Lost Fortress* (5 Stages, Boss: Fortress Champion)
  2. *Frostfang Peak* (5 Stages, Boss: Frost Overlord)
  3. *Molten Caldera* (5 Stages, Boss: Infernal Warlord)
- **War Map Modal:** Interactive map with 1–3 star ratings based on health remaining and accuracy.

### 🔊 Procedural Sound Design (Web Audio API)
- Zero external audio file dependencies — synthesized in real-time.
- Tension creak on bow draw, twang & swoosh on release, flesh impact thud, metallic headshot critical chime, shield deflection clang, elemental sound effects, victory/defeat fanfares, and an ambient fantasy BGM chord arpeggiator.

### ⚔️ Advanced Combat & Arrows
- **5 Arrow Types:**
  - `Normal (1)`: High speed, 2.5x headshot critical multiplier.
  - `Fire (2)`: Explosive area burst + burning DoT.
  - `Ice (3)`: Freezes enemy in place, halting their attacks.
  - `Poison (4)`: Stacking corrosive venom damage.
  - `Arcane (5)`: Pierces shields and barriers, gentle homing curve toward weak points.
- **Body-Part Hit Detection:** Head (Critical 2.5x dmg + screen shake), Torso (1.0x), Legs (0.75x), Shield (Blocked).

### 📈 Difficulty Progression
- Increasing enemy HP, reduced reaction delay, higher arrow speed, dynamic wind shifts, and tougher boss encounters.

### ✨ Premium Interface (Desktop & Touch Friendly)
- Responsive glassmorphism HUD with animated health bars and chip-damage flashing.
- Enemy aiming telegraph bar.
- Floating combat text with critical and elemental indicators.
- Cooldown sweep animations on ability buttons.
- Touch controls bar for mobile and tablet screens.

### 💾 Persistent Save System (`localStorage`)
- Saves coins, high scores, campaign stage progress, and star ratings.
- **Armory Upgrades:**
  - *Longbow Mastery:* +Velocity and base damage.
  - *Expanded Quiver:* +Starting elemental arrows.
  - *Fortified Armor:* +Maximum player HP.
  - *Runic Barrier:* Faster shield cooldown and extra block charges.
  - *Arcane Alchemy:* Increased elemental durations and damage.

---

## 🎮 Controls

### Desktop Keyboard & Mouse
- **Mouse Drag (Left Arena):** Aim angle and power; release to shoot.
- **Space:** Shoot current arrow.
- **1 – 5:** Select Normal, Fire, Ice, Poison, or Arcane arrow.
- **Q:** Activate Runic Shield.
- **E:** Shadow Dash / Evade.
- **F:** Slow Motion (Bullet Time).
- **R:** Restart current stage.

### Mobile & Touch
- **Drag Anywhere on Left Half:** Adjust aim trajectory and power.
- **On-Screen Touch Bar:** Quick Fire, Shield, Dash, and Bullet Time buttons.

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Build production bundle:
```bash
npm run build
npm run preview
```
# gm_v1
