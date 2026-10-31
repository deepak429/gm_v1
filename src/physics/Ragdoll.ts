export interface RagdollNode {
  name: string;
  baseX: number;
  baseY: number;
  baseRadius: number;
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  radius: number;
  mass: number;
}

export type BoneKind = 'spine' | 'arm' | 'leg' | 'cross';

export interface RagdollBone {
  p1: string;
  p2: string;
  baseLength: number;
  length: number;
  stiffness: number;
  kind: BoneKind;
}

export interface AngleConstraint {
  a: string;
  joint: string;
  c: string;
  baseRestAngle: number;
  restAngle: number;
  tolerance: number;
  stiffness: number;
}

export interface StuckArrow {
  boneName: string;
  offsetRatio: number;
  angleOffset: number;
  type: string;
}

interface BloodPool {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export class RagdollPhysics {
  public nodes: Map<string, RagdollNode> = new Map();
  public bones: RagdollBone[] = [];
  public angleConstraints: AngleConstraint[] = [];
  public stuckArrows: StuckArrow[] = [];
  public isActive = false;
  public groundY = 540;
  public gravity = 980;
  public friction = 0.9;
  public bounce = 0.22;

  // Muscle feel
  public scale = 1;
  public facingRight = true;
  public muscleTone = 1; // 1 = fresh kill (stiff, twitchy), 0 = fully slack
  public timeDead = 0;
  public settled = false;
  public spasmCooldown = 0;

  private bloodPools: BloodPool[] = [];

  constructor() {
    this.initSkeleton();
  }

  // ----- Setup -----

  private initSkeleton() {
    // Pelvis-centred rest pose
    const defs: [string, number, number, number, number][] = [
      ['head', 0, -68, 12, 1.2],
      ['neck', 0, -50, 6, 0.9],
      ['torso', 0, -32, 10, 2.0],
      ['pelvis', 0, 0, 10, 2.0],
      ['leftShoulder', -12, -45, 6, 0.8],
      ['leftElbow', -18, -25, 5, 0.6],
      ['leftHand', -20, -6, 5, 0.5],
      ['rightShoulder', 14, -45, 6, 0.8],
      ['rightElbow', 22, -25, 5, 0.6],
      ['rightHand', 28, -6, 5, 0.5],
      ['leftHip', -9, 4, 6, 1.0],
      ['leftKnee', -12, 28, 6, 0.8],
      ['leftFoot', -14, 52, 6, 0.7],
      ['rightHip', 9, 4, 6, 1.0],
      ['rightKnee', 12, 28, 6, 0.8],
      ['rightFoot', 14, 52, 6, 0.7],
    ];

    defs.forEach(([name, x, y, radius, mass]) => {
      this.nodes.set(name, {
        name,
        baseX: x,
        baseY: y,
        baseRadius: radius,
        x,
        y,
        oldX: x,
        oldY: y,
        radius,
        mass,
      });
    });

    const boneDefs: [string, string, number, BoneKind][] = [
      ['head', 'neck', 1.0, 'spine'],
      ['neck', 'torso', 1.0, 'spine'],
      ['torso', 'pelvis', 1.0, 'spine'],
      ['head', 'torso', 0.6, 'cross'],
      ['neck', 'pelvis', 0.7, 'cross'],
      ['neck', 'leftShoulder', 1.0, 'arm'],
      ['leftShoulder', 'leftElbow', 1.0, 'arm'],
      ['leftElbow', 'leftHand', 1.0, 'arm'],
      ['neck', 'rightShoulder', 1.0, 'arm'],
      ['rightShoulder', 'rightElbow', 1.0, 'arm'],
      ['rightElbow', 'rightHand', 1.0, 'arm'],
      ['pelvis', 'leftHip', 1.0, 'leg'],
      ['leftHip', 'leftKnee', 1.0, 'leg'],
      ['leftKnee', 'leftFoot', 1.0, 'leg'],
      ['pelvis', 'rightHip', 1.0, 'leg'],
      ['rightHip', 'rightKnee', 1.0, 'leg'],
      ['rightKnee', 'rightFoot', 1.0, 'leg'],
      ['leftShoulder', 'rightShoulder', 0.9, 'cross'],
      ['leftHip', 'rightHip', 0.9, 'cross'],
      ['leftShoulder', 'pelvis', 0.8, 'cross'],
      ['rightShoulder', 'pelvis', 0.8, 'cross'],
    ];

    this.bones = boneDefs.map(([p1, p2, stiffness, kind]) => {
      const n1 = this.nodes.get(p1)!;
      const n2 = this.nodes.get(p2)!;
      const dist = Math.hypot(n1.baseX - n2.baseX, n1.baseY - n2.baseY);
      return { p1, p2, baseLength: dist, length: dist, stiffness, kind };
    });

    // Joint angle limits (prevent inside-out limbs). Rest angles are measured
    // at the T-pose and the tolerance clamps how far they can swing from there.
    const jointDefs: [string, string, string, number][] = [
      ['leftShoulder', 'leftElbow', 'leftHand', 0.9],
      ['rightShoulder', 'rightElbow', 'rightHand', 0.9],
      ['leftHip', 'leftKnee', 'leftFoot', 0.75],
      ['rightHip', 'rightKnee', 'rightFoot', 0.75],
      ['torso', 'neck', 'head', 0.55],
      ['torso', 'leftShoulder', 'leftElbow', 1.5],
      ['torso', 'rightShoulder', 'rightElbow', 1.5],
      ['pelvis', 'leftHip', 'leftKnee', 1.2],
      ['pelvis', 'rightHip', 'rightKnee', 1.2],
    ];

    this.angleConstraints = jointDefs.map(([a, joint, c, tolerance]) => {
      const na = this.nodes.get(a)!;
      const nj = this.nodes.get(joint)!;
      const nc = this.nodes.get(c)!;
      const restAngle = this.signedAngle(
        na.baseX - nj.baseX,
        na.baseY - nj.baseY,
        nc.baseX - nj.baseX,
        nc.baseY - nj.baseY
      );
      return { a, joint, c, baseRestAngle: restAngle, restAngle, tolerance, stiffness: 0.45 };
    });
  }

  public setScale(s: number) {
    this.scale = s;
    this.nodes.forEach((n) => {
      n.radius = n.baseRadius * s;
    });
    this.bones.forEach((b) => {
      b.length = b.baseLength * s;
    });
  }

  public setPose(originX: number, originY: number, facingRight: boolean) {
    this.facingRight = facingRight;
    const flip = facingRight ? 1 : -1;
    this.nodes.forEach((n) => {
      const isLateral = n.name.startsWith('left') || n.name.startsWith('right');
      const bx = (isLateral ? n.baseX * flip : n.baseX) * this.scale;
      const by = n.baseY * this.scale;
      n.x = originX + bx;
      n.y = originY + by;
      n.oldX = n.x;
      n.oldY = n.y;
    });
    // Mirror rest angles so joint limits track the facing direction.
    // Recompute from the stored base each call so it never double-flips across respawns.
    const sign = facingRight ? 1 : -1;
    this.angleConstraints.forEach((ac) => {
      ac.restAngle = ac.baseRestAngle * sign;
    });
  }

  public activate(impulseX: number, impulseY: number, targetNodeName: string = 'torso') {
    this.isActive = true;
    this.timeDead = 0;
    this.muscleTone = 1;
    this.settled = false;
    this.spasmCooldown = 0;
    this.bloodPools = [];

    const target = this.nodes.get(targetNodeName) || this.nodes.get('torso')!;
    target.oldX = target.x - impulseX * 0.06;
    target.oldY = target.y - impulseY * 0.06;

    // Spread momentum but weight by distance so impact point feels concentrated.
    this.nodes.forEach((n) => {
      if (n === target) return;
      const d = Math.hypot(n.x - target.x, n.y - target.y) + 1;
      const falloff = 40 / (40 + d);
      n.oldX = n.x - impulseX * 0.03 * falloff;
      n.oldY = n.y - impulseY * 0.03 * falloff;
    });
  }

  public applyImpulse(nodeName: string, vx: number, vy: number) {
    const n = this.nodes.get(nodeName);
    if (!n) return;
    n.oldX = n.x - vx * 0.04;
    n.oldY = n.y - vy * 0.04;
  }

  public stickArrow(boneName: string, offsetRatio: number, angleOffset: number, type: string) {
    this.stuckArrows.push({ boneName, offsetRatio, angleOffset, type });
  }

  // ----- Simulation -----

  public update(dt: number, boundsWidth: number, groundLevel: number) {
    if (!this.isActive) return;
    this.groundY = groundLevel;
    const clampedDt = Math.min(dt, 0.033);
    this.timeDead += dt;

    // Muscle tone bleeds off over ~1.5s — body goes from stiff/twitchy to limp.
    this.muscleTone = Math.max(0, 1 - this.timeDead / 1.5);

    // Random involuntary twitches shortly after death. Reads as nerve spasms.
    this.spasmCooldown -= dt;
    if (this.muscleTone > 0.15 && this.spasmCooldown <= 0 && Math.random() < 0.4) {
      const twitchy = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot', 'head'];
      const pick = twitchy[Math.floor(Math.random() * twitchy.length)];
      const node = this.nodes.get(pick);
      if (node) {
        const kick = (2 + Math.random() * 3) * this.muscleTone * this.scale;
        node.oldX = node.x - (Math.random() - 0.5) * kick;
        node.oldY = node.y - Math.random() * kick;
      }
      this.spasmCooldown = 0.08 + Math.random() * 0.22;
    }

    // 1. Verlet integration with per-bone-ish damping.
    this.nodes.forEach((n) => {
      // Hands/feet drag through air a touch more — looks weightier than lines.
      const extraDrag = n.name.includes('Hand') || n.name.includes('Foot') ? 0.015 : 0;
      const damp = this.friction - extraDrag;

      const vx = (n.x - n.oldX) * damp;
      const vy = (n.y - n.oldY) * damp;

      n.oldX = n.x;
      n.oldY = n.y;

      n.x += vx;
      n.y += vy + this.gravity * clampedDt * clampedDt;

      // Ground collision — heavier parts bounce less, feet don't skate.
      if (n.y + n.radius > this.groundY) {
        n.y = this.groundY - n.radius;
        const massFactor = 1 / (1 + n.mass * 0.25);
        n.oldY = n.y + vy * this.bounce * massFactor;
        n.oldX = n.x - vx * (0.45 + 0.1 * n.mass);
      }

      // Arena walls
      if (n.x - n.radius < 20) {
        n.x = 20 + n.radius;
        n.oldX = n.x + vx * 0.3;
      } else if (n.x + n.radius > boundsWidth - 20) {
        n.x = boundsWidth - 20 - n.radius;
        n.oldX = n.x + vx * 0.3;
      }
    });

    // 2. Constraint relaxation — distances + angle limits for a few iterations.
    const iterations = 5;
    for (let iter = 0; iter < iterations; iter++) {
      // Distance (bones)
      this.bones.forEach((b) => {
        const n1 = this.nodes.get(b.p1);
        const n2 = this.nodes.get(b.p2);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const diff = (dist - b.length) / dist;

        const totalMass = n1.mass + n2.mass;
        const m1Ratio = n2.mass / totalMass;
        const m2Ratio = n1.mass / totalMass;

        // Cross-braces get stiffer while muscle tone is high (fresh body is tauter).
        const stiff =
          b.kind === 'cross' ? b.stiffness * (0.5 + 0.5 * this.muscleTone) : b.stiffness;

        const offsetX = dx * diff * 0.5 * stiff;
        const offsetY = dy * diff * 0.5 * stiff;

        n1.x += offsetX * m1Ratio;
        n1.y += offsetY * m1Ratio;
        n2.x -= offsetX * m2Ratio;
        n2.y -= offsetY * m2Ratio;
      });

      // Angle (joints)
      this.angleConstraints.forEach((ac) => {
        const na = this.nodes.get(ac.a);
        const nj = this.nodes.get(ac.joint);
        const nc = this.nodes.get(ac.c);
        if (!na || !nj || !nc) return;

        const v1x = na.x - nj.x;
        const v1y = na.y - nj.y;
        const v2x = nc.x - nj.x;
        const v2y = nc.y - nj.y;

        const current = this.signedAngle(v1x, v1y, v2x, v2y);
        let delta = current - ac.restAngle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;

        const limit = ac.tolerance;
        let correction = 0;
        if (delta > limit) correction = limit - delta;
        else if (delta < -limit) correction = -limit - delta;
        if (correction === 0) return;

        // Muscle tone keeps joints closer to rest pose; dead-slack still clamps extremes.
        const stiff = ac.stiffness * (0.35 + 0.65 * this.muscleTone);
        const rot = correction * stiff * 0.5;
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);

        // Rotate C around joint — joint & A are heavier anchors.
        const totalMass = na.mass + nc.mass + nj.mass * 2;
        const cShare = (na.mass + nj.mass) / totalMass;
        const aShare = nc.mass / totalMass;

        const rx = cosR * v2x - sinR * v2y;
        const ry = sinR * v2x + cosR * v2y;
        nc.x += (rx - v2x) * cShare;
        nc.y += (ry - v2y) * cShare;

        // Counter-rotate A slightly to conserve a bit of momentum.
        const cosA = Math.cos(-rot * 0.4);
        const sinA = Math.sin(-rot * 0.4);
        const ax = cosA * v1x - sinA * v1y;
        const ay = sinA * v1x + cosA * v1y;
        na.x += (ax - v1x) * aShare;
        na.y += (ay - v1y) * aShare;
      });

      // Keep everything above the ground inside the relaxation loop.
      this.nodes.forEach((n) => {
        if (n.y + n.radius > this.groundY) n.y = this.groundY - n.radius;
      });
    }

    // 3. Settle detection + blood pool
    if (!this.settled && this.timeDead > 0.6) {
      let totalKE = 0;
      this.nodes.forEach((n) => {
        totalKE += Math.abs(n.x - n.oldX) + Math.abs(n.y - n.oldY);
      });
      if (totalKE < 1.5) {
        this.settled = true;
        this.spawnBloodPools();
      }
    }
  }

  private spawnBloodPools() {
    const torso = this.nodes.get('torso');
    const head = this.nodes.get('head');
    if (torso) {
      this.bloodPools.push({
        x: torso.x,
        y: this.groundY - 0.5,
        radius: (16 + this.stuckArrows.length * 3) * this.scale,
        alpha: 0.75,
      });
    }
    const headHit = this.stuckArrows.some(
      (s) => s.boneName.includes('head') || s.boneName.includes('neck')
    );
    if (headHit && head) {
      this.bloodPools.push({
        x: head.x,
        y: this.groundY - 0.5,
        radius: 10 * this.scale,
        alpha: 0.65,
      });
    }
  }

  // ----- Rendering -----

  public render(
    graphics: Phaser.GameObjects.Graphics,
    colors: { body: number; limb: number; head: number; armor?: number }
  ) {
    if (!this.isActive) return;
    graphics.clear();

    // Contact shadow — hugs the ground near feet / torso so the body feels grounded.
    const leftFoot = this.nodes.get('leftFoot');
    const rightFoot = this.nodes.get('rightFoot');
    const torso = this.nodes.get('torso');
    graphics.fillStyle(0x010408, 0.42);
    if (leftFoot) graphics.fillEllipse(leftFoot.x, this.groundY - 0.5, 26 * this.scale, 7 * this.scale);
    if (rightFoot) graphics.fillEllipse(rightFoot.x, this.groundY - 0.5, 26 * this.scale, 7 * this.scale);
    if (torso && this.settled) {
      graphics.fillStyle(0x010408, 0.3);
      graphics.fillEllipse(torso.x, this.groundY - 0.5, 48 * this.scale, 10 * this.scale);
    }

    // Blood pools under the body (drawn below limbs).
    this.bloodPools.forEach((pool) => {
      graphics.fillStyle(0x3a0606, pool.alpha * 0.75);
      graphics.fillEllipse(pool.x, pool.y, pool.radius * 2.6, pool.radius * 0.7);
      graphics.fillStyle(0x8a0f0f, pool.alpha);
      graphics.fillEllipse(pool.x, pool.y, pool.radius * 1.9, pool.radius * 0.5);
      graphics.fillStyle(0xc01919, pool.alpha * 0.9);
      graphics.fillEllipse(pool.x, pool.y, pool.radius * 1.1, pool.radius * 0.3);
    });

    // Limbs: tapered strokes with muscle shading for a more fleshy read.
    const limbColor = colors.limb;
    const shadeColor = this.darken(limbColor, 0.55);
    const sheenColor = this.lighten(limbColor, 0.35);

    this.bones.forEach((b) => {
      if (b.kind === 'cross') return;
      // Skip the virtual spine cross-braces not drawn previously
      const n1 = this.nodes.get(b.p1)!;
      const n2 = this.nodes.get(b.p2)!;

      let baseThickness: number;
      switch (b.kind) {
        case 'spine':
          baseThickness = (b.p1 === 'torso' || b.p2 === 'torso' ? 14 : 10) * this.scale;
          break;
        case 'leg':
          baseThickness = (b.p2 === 'leftFoot' || b.p2 === 'rightFoot' ? 7 : 9) * this.scale;
          break;
        case 'arm':
          baseThickness = (b.p2 === 'leftHand' || b.p2 === 'rightHand' ? 5 : 7) * this.scale;
          break;
        default:
          baseThickness = 5 * this.scale;
      }

      // Dark backing (shadow side of the muscle)
      graphics.lineStyle(baseThickness + 1.2, shadeColor, 0.95);
      graphics.lineBetween(n1.x, n1.y, n2.x, n2.y);

      // Main muscle body
      graphics.lineStyle(baseThickness, limbColor, 1);
      graphics.lineBetween(n1.x, n1.y, n2.x, n2.y);

      // Narrow sheen running along the top edge (fake specular from above)
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      // sheen biased toward the "up" side
      const sign = py < 0 ? 1 : -1;
      const off = baseThickness * 0.3 * sign;
      graphics.lineStyle(baseThickness * 0.35, sheenColor, 0.55);
      graphics.lineBetween(n1.x + px * off, n1.y + py * off, n2.x + px * off, n2.y + py * off);
    });

    // Joints — rounded caps so limb intersections read as flesh, not sticks.
    this.nodes.forEach((n) => {
      if (n.name === 'head') {
        graphics.fillStyle(colors.head, 1);
        graphics.fillCircle(n.x, n.y, n.radius);
        graphics.lineStyle(2, 0x111d28, 1);
        graphics.strokeCircle(n.x, n.y, n.radius);
        // Eye glint stays visible so the body still reads as a character
        const dir = this.facingRight ? 1 : -1;
        graphics.fillStyle(0x0b0b0b, 0.75);
        graphics.fillCircle(n.x + dir * n.radius * 0.3, n.y - n.radius * 0.1, n.radius * 0.15);
      } else if (n.name === 'torso') {
        graphics.fillStyle(colors.body, 1);
        graphics.fillCircle(n.x, n.y, n.radius * 1.15);
        graphics.fillStyle(this.lighten(colors.body, 0.2), 0.4);
        graphics.fillCircle(n.x - n.radius * 0.4, n.y - n.radius * 0.4, n.radius * 0.55);
      } else if (n.name === 'pelvis') {
        graphics.fillStyle(colors.body, 1);
        graphics.fillCircle(n.x, n.y, n.radius * 1.0);
      } else {
        // Shoulders/hips sit a touch bigger than hands/feet to read as muscle bulk.
        const bulk = n.name.includes('Shoulder') || n.name.includes('Hip') ? 0.85 : 0.65;
        graphics.fillStyle(shadeColor, 1);
        graphics.fillCircle(n.x, n.y, n.radius * (bulk + 0.1));
        graphics.fillStyle(colors.limb, 1);
        graphics.fillCircle(n.x, n.y, n.radius * bulk);
      }
    });

    // Stuck arrows — now with a visible shaft, fletching and a slow drip once settled.
    this.stuckArrows.forEach((sa) => {
      const bone = this.bones.find(
        (b) => `${b.p1}-${b.p2}` === sa.boneName || `${b.p2}-${b.p1}` === sa.boneName
      );
      if (!bone) return;
      const n1 = this.nodes.get(bone.p1)!;
      const n2 = this.nodes.get(bone.p2)!;
      const ax = n1.x + (n2.x - n1.x) * sa.offsetRatio;
      const ay = n1.y + (n2.y - n1.y) * sa.offsetRatio;
      const boneAngle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
      const arrowAngle = boneAngle + sa.angleOffset;

      const len = 32 * this.scale;
      const endX = ax - Math.cos(arrowAngle) * len;
      const endY = ay - Math.sin(arrowAngle) * len;

      // Shaft shadow
      graphics.lineStyle(3.5, 0x1b140a, 0.85);
      graphics.lineBetween(ax, ay, endX, endY);
      // Shaft
      graphics.lineStyle(2, 0xdfcfb2, 1);
      graphics.lineBetween(ax, ay, endX, endY);

      // Fletching
      const perp = arrowAngle + Math.PI / 2;
      const fx = endX;
      const fy = endY;
      const fletchLen = 7 * this.scale;
      graphics.fillStyle(0xd82b22, 0.95);
      graphics.fillTriangle(
        fx,
        fy,
        fx + Math.cos(perp) * fletchLen - Math.cos(arrowAngle) * fletchLen * 0.6,
        fy + Math.sin(perp) * fletchLen - Math.sin(arrowAngle) * fletchLen * 0.6,
        fx - Math.cos(arrowAngle) * fletchLen,
        fy - Math.sin(arrowAngle) * fletchLen
      );
      graphics.fillStyle(0xf2f2f2, 0.9);
      graphics.fillTriangle(
        fx,
        fy,
        fx - Math.cos(perp) * fletchLen - Math.cos(arrowAngle) * fletchLen * 0.6,
        fy - Math.sin(perp) * fletchLen - Math.sin(arrowAngle) * fletchLen * 0.6,
        fx - Math.cos(arrowAngle) * fletchLen,
        fy - Math.sin(arrowAngle) * fletchLen
      );

      // Blood smear at entry point
      graphics.fillStyle(0x8a0f0f, 0.9);
      graphics.fillCircle(ax, ay, 2.5 * this.scale);
      if (this.settled) {
        graphics.fillStyle(0x6a0909, 0.6);
        graphics.fillEllipse(ax, ay + 4 * this.scale, 3 * this.scale, 7 * this.scale);
      }
    });
  }

  // ----- Helpers -----

  private signedAngle(ax: number, ay: number, bx: number, by: number): number {
    // Signed angle from vector A to vector B, in (-pi, pi].
    const dot = ax * bx + ay * by;
    const cross = ax * by - ay * bx;
    return Math.atan2(cross, dot);
  }

  private darken(color: number, factor: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) * factor);
    const g = Math.max(0, ((color >> 8) & 0xff) * factor);
    const b = Math.max(0, (color & 0xff) * factor);
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
  }

  private lighten(color: number, factor: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * factor);
    const g = Math.min(255, ((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * factor);
    const b = Math.min(255, (color & 0xff) + (255 - (color & 0xff)) * factor);
    return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
  }
}
