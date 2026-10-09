// Charakter-Definitionen V2: Forward-Attacks, Block-Pose, polierte Visuals
(function () {
const FIGHTER_WIDTH = 70;
const FIGHTER_HEIGHT = 170;

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function limb(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawStripes(ctx, x, y, w, h, base, stripe) {
  if (base) { ctx.fillStyle = base; ctx.fillRect(x, y, w, h); }
  ctx.fillStyle = stripe;
  for (let sy = y + 3; sy < y + h - 2; sy += 10) ctx.fillRect(x, sy, w, Math.min(5, y + h - sy));
}

function drawLongHair(ctx, cx, headR, len, color, shine) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, headR + 2, headR * 1.05, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.6, headR * 0.3);
  ctx.quadraticCurveTo(cx - headR * 1.35, headR * 1.2, cx - headR * 1.2, len);
  ctx.lineTo(cx - headR * 0.55, len - 3);
  ctx.quadraticCurveTo(cx - headR * 0.75, headR * 1.4, cx - headR * 0.35, headR * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.75, headR * 0.6);
  ctx.quadraticCurveTo(cx + headR * 1.15, headR * 1.3, cx + headR * 0.95, headR * 2.5);
  ctx.lineTo(cx + headR * 0.7, headR * 2.4);
  ctx.quadraticCurveTo(cx + headR * 0.85, headR * 1.4, cx + headR * 0.6, headR * 0.8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shine; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - headR * 0.9, headR * 1.1); ctx.quadraticCurveTo(cx - headR * 1.05, headR * 1.8, cx - headR * 0.95, len - 6); ctx.stroke();
}

function drawHumanoid(ctx, w, h, fighter, palette, accessories) {
  const { skin, primary, secondary, hair } = palette;
  const outline = palette.outline || '#10101a';
  const t = fighter.animTime || 0;
  const state = fighter.state;
  const airborne = fighter.grounded === false;
  const headR = h * 0.105;
  const cx = w * 0.5;
  const torsoY = h * 0.20;
  const torsoH = h * 0.40;
  const shoulderY = torsoY + h * 0.05;
  const hipY = torsoY + torsoH;
  const limbW = w * 0.16;

  const isPunch = state === 'punch';
  const isKick = state === 'kick';
  const isFwdPunch = state === 'fwd_punch';
  const isFwdKick = state === 'fwd_kick';
  const isSpecial = state === 'special';
  const isParry = state === 'parry';
  const isHit = state === 'hit';
  const isKO = state === 'ko';
  const isWin = state === 'win';
  const isThrown = state === 'thrown';

  const isArmAtk = isPunch || isFwdPunch;
  const isLegAtk = isKick || isFwdKick;
  const atkMove = (isArmAtk || isLegAtk) ? fighter.charDef.moves[state] : null;
  const atkAnim = atkMove ? (atkMove.anim || (isLegAtk ? 'straightkick' : 'straight')) : null;

  // Shared attack phasing: windup (coil back) -> active (strike) -> recovery (retract)
  let AKw = 0, AKs = 0, AKr = 0;
  if (atkMove && atkMove.active) {
    const _a0 = atkMove.active[0], _a1 = atkMove.active[1];
    const _tot = airborne ? Math.round(atkMove.total * 0.7) : atkMove.total;
    const _st = fighter.stateTimer;
    if (_st < _a0) AKw = _st / _a0;
    else if (_st <= _a1) AKs = (_st - _a0) / Math.max(1, _a1 - _a0);
    else AKr = Math.min(1, (_st - _a1) / Math.max(1, _tot - _a1));
  }


  if (isKO) {
    ctx.save();
    ctx.translate(0, h - w * 0.6);
    ctx.fillStyle = primary;
    rr(ctx, w * 0.05, w * 0.18, w * 0.9, w * 0.3, 6);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(w * 0.12, w * 0.3, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(w * 0.1, w * 0.26, headR * 0.9, Math.PI * 0.8, Math.PI * 2.1);
    ctx.fill();
    const spin = t * 0.15;
    for (let i = 0; i < 3; i++) {
      const ang = spin + (i * Math.PI * 2) / 3;
      const sx = w * 0.12 + Math.cos(ang) * headR * 1.8;
      const sy = w * 0.12 + Math.sin(ang) * headR * 0.8;
      drawStar(ctx, sx, sy, 3, '#ffe066');
    }
    ctx.restore();
    return;
  }

  let bob = 0, legSwing = 0, armSwing = 0;
  // classic fighting-stance bounce: quick rhythmic hops on the spot
  if (state === 'idle') bob = -Math.abs(Math.sin(t * 0.13)) * 3.5;
  if (state === 'walk') {
    bob = Math.abs(Math.sin(t * 0.18)) * 3;
    legSwing = Math.sin(t * 0.18) * 11;
    armSwing = Math.sin(t * 0.18) * 6;
  }
  if (isWin) bob = -Math.abs(Math.sin(t * 0.2)) * 10;

  ctx.save();

  ctx.translate(0, bob);

  // subtle life: breathing sway while idle, forward lean while walking
  if (state === 'idle') ctx.transform(1, 0, Math.sin(t * 0.05) * 0.012, 1, 0, 0);
  if (state === 'walk') ctx.transform(1, 0, 0.035, 1, 0, 0);

  if (isHit) {
    ctx.transform(1, 0, 0.08, 1, -0.08 * h, 0);
    ctx.translate(Math.sin(t * 1.4) * 2.5, 0);
  }
  if (atkMove) {
    var lungeMax = atkMove.lunge != null ? atkMove.lunge : (isFwdPunch || isFwdKick ? 12 : 0);
    if (lungeMax) {
      var lunge = Math.min(fighter.stateTimer * 1.5, lungeMax);
      ctx.translate(lunge, 0);
    }
    // per-archetype commit lean
    var lean = 0.05;
    if (atkAnim === 'overhead' || atkAnim === 'axekick' || atkAnim === 'brushkick' || atkAnim === 'stomp') lean = -0.04;
    else if (atkAnim === 'uppercut' || atkAnim === 'chaosupper' || atkAnim === 'risingflash') lean = -0.06;
    else if (atkAnim === 'dashpunch' || atkAnim === 'dashkick' || atkAnim === 'lowslide' || atkAnim === 'bladethrust' || atkAnim === 'runwaykick' || atkAnim === 'lungethrust') lean = 0.10;
    // body english: coil back + dip during windup, drive forward on the strike, ease out in recovery
    var inWind = AKw > 0 && AKs === 0 && AKr === 0 && fighter.stateTimer < atkMove.active[0];
    var drive = inWind ? -0.5 * AKw : (AKr > 0 ? 1 - Math.pow(AKr, 1.3) : 1);
    ctx.translate(4 * Math.max(0, drive), inWind ? 2.5 * AKw : -1.5 * Math.max(0, drive));
    ctx.transform(1, 0, lean * drive, 1, 0, 0);
  }
  if (airborne && !isThrown) {
    let rot = 0.06;
    if (isPunch) rot = 0.18;
    else if (isKick) rot = -0.14;
    ctx.translate(cx, h * 0.45);
    ctx.rotate(rot);
    ctx.translate(-cx, -h * 0.45);
  }
  if (isThrown) {
    const total = fighter.throwTotal || 30;
    const prog = 1 - Math.max(0, fighter.stateTimer) / total;
    ctx.translate(cx, h * 0.45);
    ctx.rotate(prog * Math.PI * 2.4);
    ctx.translate(-cx, -h * 0.45);
  }

  const footY = h;
  let backFoot = { x: cx - w * 0.24 - legSwing, y: footY };
  let frontFoot = { x: cx + w * 0.24 + legSwing, y: footY };
  if (airborne) {
    backFoot = { x: cx - w * 0.18, y: h * 0.82 };
    frontFoot = { x: cx + w * 0.20, y: h * 0.86 };
  }
  // idle bounce: heels lift alternately with the hop rhythm
  if (state === 'idle' && !airborne) {
    backFoot.y -= Math.max(0, Math.sin(t * 0.13)) * 2.5;
    frontFoot.y -= Math.max(0, -Math.sin(t * 0.13)) * 2.5;
  }
  const nFfx = frontFoot.x, nFfy = frontFoot.y, nBfx = backFoot.x, nBfy = backFoot.y;
  if (isLegAtk && atkMove.type === 'grab') {
    // Hand/chain throws keyed to the kick button don't use a kicking leg — keep a neutral stance
  } else if (isLegAtk) {
    const st = fighter.stateTimer;
    if (airborne) {
      const ext = Math.min(st * 3.0, w * 0.62);
      frontFoot = { x: cx + w * 0.25 + ext, y: hipY + h * 0.20 + ext * 0.4 };
      backFoot = { x: cx - w * 0.14, y: h * 0.76 };
    } else if (atkAnim === 'spinkick') {
      const ang = Math.min(st * 0.17, Math.PI * 1.05) - 0.35;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.74, y: hipY + h * 0.04 + Math.sin(ang) * h * 0.20 };
      backFoot = { x: cx - w * 0.16, y: footY };
    } else if (atkAnim === 'swordspin') {
      // smaller leg pivot so the sword's spin reads as the main attack, not the foot
      const ang = Math.min(st * 0.12, Math.PI * 0.55) - 0.2;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.34, y: footY + Math.sin(ang) * h * 0.05 };
      backFoot = { x: cx - w * 0.18, y: footY };
    } else if (atkAnim === 'axekick') {
      const pr = Math.min(1, st / 12);
      if (pr < 0.5) {
        const q = pr / 0.5;
        frontFoot = { x: cx + w * 0.18, y: hipY + h * 0.05 - q * h * 0.55 };
      } else {
        const q = (pr - 0.5) / 0.5;
        frontFoot = { x: cx + w * 0.26, y: hipY - h * 0.50 + q * h * 0.62 };
      }
      backFoot = { x: cx - w * 0.18, y: footY };
    } else if (atkAnim === 'bigsweep') {
      // heavy, slow foot-drag sweep — reaches further than a normal sweep but builds up slower
      const ext = Math.min(Math.max(0, st - 2) * 3.0, w * 0.9);
      frontFoot = { x: cx + w * 0.18 + ext, y: h - h * 0.01 };
      backFoot = { x: cx - w * 0.22, y: footY };
    } else if (atkAnim === 'charleston') {
      // jaunty two-beat dance kick: front foot flicks out, retracts, flicks again
      const beat = Math.sin(st * 0.45);
      frontFoot = { x: cx + w * 0.28 + Math.abs(beat) * w * 0.5, y: hipY + h * 0.05 - beat * h * 0.06 };
      backFoot = { x: cx - w * 0.20 - Math.max(0, -beat) * w * 0.12, y: footY };
    } else if (atkAnim === 'canehook') {
      // cane does the work down low; the legs just brace with a small forward step
      const step = Math.min(st * 1.5, w * 0.18);
      frontFoot = { x: cx + w * 0.22 + step, y: footY };
      backFoot = { x: cx - w * 0.24, y: footY };
    } else if (atkAnim === 'knee') {
      const pr = Math.min(1, st / 6);
      frontFoot = { x: cx + w * 0.16 + pr * w * 0.08, y: hipY + h * 0.06 - pr * h * 0.04 };
      backFoot = { x: cx - w * 0.16, y: footY };
    } else if (atkAnim === 'dashkick') {
      const ext = Math.min(st * 4.2, w * 0.92);
      frontFoot = { x: cx + w * 0.25 + ext, y: hipY + h * 0.10 };
      backFoot = { x: cx - w * 0.22, y: footY };
    } else if (atkAnim === 'legreap') {
      // judo reap: the leg sweeps up from behind-low, across, and through (O-soto-gari)
      const pr = Math.min(1, st / 16);
      const ang = -0.6 + pr * 2.0;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.62, y: hipY + h * 0.10 + Math.sin(ang) * h * 0.18 };
      backFoot = { x: cx - w * 0.12, y: footY };
    } else if (atkAnim === 'crossspin') {
      // grounded cross-spin: legs cross low and horizontal, distinct from a high whip kick
      const ang = Math.min(st * 0.20, Math.PI * 1.3) - 0.2;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.60, y: hipY + h * 0.14 + Math.abs(Math.sin(ang)) * h * 0.06 };
      backFoot = { x: cx - Math.cos(ang) * w * 0.22, y: footY };
    } else if (atkAnim === 'lowslide') {
      // near-ground sliding kick, both legs skim the floor
      const ext = Math.min(st * 4.5, w * 1.0);
      frontFoot = { x: cx + w * 0.25 + ext, y: h - h * 0.01 };
      backFoot = { x: cx - w * 0.28, y: h - h * 0.01 };
    } else if (atkAnim === 'brushkick') {
      // wide arcing roundhouse, higher and rounder than an axe-drop
      const ang = Math.min(st * 0.16, Math.PI * 0.85) - 0.5;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.66, y: hipY - h * 0.02 + Math.sin(ang) * h * 0.28 };
      backFoot = { x: cx - w * 0.16, y: footY };
    } else if (atkAnim === 'wobblekick') {
      // erratic mid-air flail while the chaos-hop keeps him airborne
      const wob = Math.sin(st * 0.6) * w * 0.3;
      frontFoot = { x: cx + w * 0.30 + wob, y: hipY + h * 0.14 + Math.cos(st * 0.5) * h * 0.05 };
      backFoot = { x: cx - w * 0.20 - wob * 0.4, y: hipY + h * 0.22 };
    } else if (atkAnim === 'stomp') {
      // heavy vertical stomp: slower and more grounded than the axe-kick drop
      const pr = Math.min(1, st / 16);
      if (pr < 0.6) {
        const q = pr / 0.6;
        frontFoot = { x: cx + w * 0.16, y: hipY - q * h * 0.62 };
      } else {
        const q = (pr - 0.6) / 0.4;
        frontFoot = { x: cx + w * 0.30, y: hipY - h * 0.62 + q * h * 0.68 };
      }
      backFoot = { x: cx - w * 0.20, y: footY };
    } else if (atkAnim === 'photospin') {
      // high whip spin kick, leg extends well above waist
      const ang = Math.min(st * 0.19, Math.PI * 1.15) - 0.4;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.78, y: hipY - h * 0.04 + Math.sin(ang) * h * 0.22 };
      backFoot = { x: cx - w * 0.14, y: footY };
    } else if (atkAnim === 'runwaykick') {
      // long strutting lunge kick at hip height, catwalk silhouette
      const ext = Math.min(st * 4.6, w * 1.0);
      frontFoot = { x: cx + w * 0.24 + ext, y: hipY + h * 0.06 };
      backFoot = { x: cx - w * 0.20, y: footY };
    } else { // straightkick
      const ext = Math.min(st * 3.2, w * 0.70);
      frontFoot = { x: cx + w * 0.25 + ext, y: hipY + h * (isFwdKick ? 0.15 : 0.10) };
      backFoot = { x: cx - w * 0.20, y: footY };
    }
  }
  if (isParry) {
    backFoot.x = cx - w * 0.30;
    frontFoot.x = cx + w * 0.30;
  }
  if (atkAnim === 'lungethrust') {
    // fencing lunge stance: front leg drives forward and bends, back leg stretches out straight
    const pr = Math.min(1, fighter.stateTimer / 10);
    frontFoot = { x: cx + w * 0.20 + pr * w * 0.30, y: footY };
    backFoot = { x: cx - w * 0.34 - pr * w * 0.06, y: footY };
  }
  let frontFist = { x: cx + w * 0.30, y: shoulderY + h * 0.02 };
  let backFist = { x: cx + w * 0.10, y: shoulderY + h * 0.08 };
  if (state === 'walk') {
    frontFist.y += armSwing * 0.5;
    backFist.y -= armSwing * 0.5;
  }
  // idle bounce: fists pump lightly in counter-rhythm to the hops
  if (state === 'idle') {
    frontFist.y += Math.sin(t * 0.26) * 1.8;
    backFist.y -= Math.sin(t * 0.26) * 1.8;
  }
  const nFFx = frontFist.x, nFFy = frontFist.y, nBFx = backFist.x, nBFy = backFist.y;
  if (isArmAtk) {
    const st = fighter.stateTimer;
    if (atkAnim === 'jab') {
      const ext = Math.min(st * 6.0, w * 0.50);
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * 0.02 };
      backFist = { x: cx + w * 0.06, y: shoulderY + h * 0.07 };
    } else if (atkAnim === 'slap') {
      // open-hand backhand: winds up across the chest, then sweeps outward in an arc
      const pr = Math.min(1, st / 6);
      if (pr < 0.35) {
        const q = pr / 0.35;
        frontFist = { x: cx + w * 0.14 - q * w * 0.16, y: shoulderY - h * 0.03 };
      } else {
        const q = (pr - 0.35) / 0.65;
        frontFist = { x: cx - w * 0.02 + q * w * 0.70, y: shoulderY - h * 0.03 + Math.sin(q * Math.PI) * h * 0.05 };
      }
      backFist = { x: cx + w * 0.06, y: shoulderY + h * 0.08 };
    } else if (atkAnim === 'uppercut') {
      const pr = Math.min(1, st / 8);
      frontFist = { x: cx + w * 0.20 + pr * w * 0.22, y: shoulderY + h * 0.18 - pr * h * 0.55 };
      backFist = { x: cx + w * 0.04, y: shoulderY + h * 0.05 };
    } else if (atkAnim === 'overhead' || atkAnim === 'hammer') {
      const pr = Math.min(1, st / 12);
      if (pr < 0.5) {
        const q = pr / 0.5;
        frontFist = { x: cx + w * 0.08, y: shoulderY - h * 0.05 - q * h * 0.22 };
      } else {
        const q = (pr - 0.5) / 0.5;
        frontFist = { x: cx + w * 0.18 + q * w * 0.30, y: shoulderY - h * 0.27 + q * h * 0.55 };
      }
      backFist = { x: cx + w * 0.02, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'dashpunch') {
      const ext = Math.min(st * 5.0, w * 0.95);
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * 0.05 };
      backFist = { x: cx - w * 0.02, y: shoulderY + h * 0.02 };
    } else if (atkAnim === 'grabreach') {
      // judo grip-and-pull: both hands lunge out to grab the lapel/collar
      const ext = Math.min(st * 3.5, w * 0.55);
      frontFist = { x: cx + w * 0.25 + ext, y: shoulderY + h * 0.05 };
      backFist = { x: cx + w * 0.18 + ext * 0.8, y: shoulderY + h * 0.12 };
    } else if (atkAnim === 'judochop') {
      // open-hand chop, diagonal down-forward
      const pr = Math.min(1, st / 7);
      frontFist = { x: cx + w * 0.10 + pr * w * 0.42, y: shoulderY - h * 0.10 + pr * h * 0.16 };
      backFist = { x: cx + w * 0.02, y: shoulderY + h * 0.05 };
    } else if (atkAnim === 'judogrip') {
      // judo grip-and-pull: both hands lunge out to grab the lapel/collar
      const ext = Math.min(st * 3.5, w * 0.55);
      frontFist = { x: cx + w * 0.25 + ext, y: shoulderY + h * 0.05 };
      backFist = { x: cx + w * 0.18 + ext * 0.8, y: shoulderY + h * 0.12 };
    } else if (atkAnim === 'snapjab') {
      // quick short jab with a tiny feint dip before the extension
      const pr = Math.min(1, st / 5);
      const dip = pr < 0.3 ? Math.sin(pr / 0.3 * Math.PI) * h * 0.02 : 0;
      frontFist = { x: cx + w * 0.26 + Math.min(st * 7.0, w * 0.46), y: shoulderY + h * 0.02 + dip };
      backFist = { x: cx + w * 0.05, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'paintjab') {
      // alternating double-fist splash motion
      const cyc = st % 12;
      const ext = Math.min(cyc * 8.0, w * 0.5);
      if (Math.floor(st / 12) % 2 === 0) {
        frontFist = { x: cx + w * 0.26 + ext, y: shoulderY };
        backFist = { x: cx + w * 0.04, y: shoulderY + h * 0.09 };
      } else {
        backFist = { x: cx + w * 0.02 + ext * 0.8, y: shoulderY + h * 0.10 };
        frontFist = { x: cx + w * 0.20, y: shoulderY - h * 0.02 };
      }
    } else if (atkAnim === 'chaosupper') {
      // erratic rising punch with horizontal jitter
      const pr = Math.min(1, st / 8);
      const jitter = Math.sin(st * 0.9) * w * 0.05;
      frontFist = { x: cx + w * 0.18 + pr * w * 0.24 + jitter, y: shoulderY + h * 0.16 - pr * h * 0.50 };
      backFist = { x: cx + w * 0.02, y: shoulderY + h * 0.05 };
    } else if (atkAnim === 'lazyswing') {
      // slow heavy roundhouse-style swing
      const pr = Math.min(1, st / 11);
      const ang = -0.9 + pr * 1.5;
      frontFist = { x: cx + w * 0.05 + Math.cos(ang) * w * 0.5, y: shoulderY + Math.sin(ang) * h * 0.10 };
      backFist = { x: cx + w * 0.02, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'buckleswing') {
      // quick backhand buckle strike, flicks slightly upward
      const pr = Math.min(1, st / 6);
      frontFist = { x: cx + w * 0.22 + pr * w * 0.42, y: shoulderY + h * 0.06 - pr * h * 0.10 };
      backFist = { x: cx + w * 0.04, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'bladethrust') {
      // fencing thrust, lower and straighter than a jab
      const ext = Math.min(st * 6.5, w * 0.62);
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * 0.09 };
      backFist = { x: cx - w * 0.02, y: shoulderY + h * 0.02 };
    } else if (atkAnim === 'flashjab') {
      // quick jab with a wrist-flick pop at the end
      const pr = Math.min(1, st / 5);
      const pop = pr > 0.7 ? (pr - 0.7) / 0.3 * h * 0.02 : 0;
      frontFist = { x: cx + w * 0.28 + pr * w * 0.48, y: shoulderY + h * 0.02 - pop };
      backFist = { x: cx + w * 0.05, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'risingflash') {
      // uppercut leaning further back with a flash pop at the top
      const pr = Math.min(1, st / 8);
      frontFist = { x: cx + w * 0.16 + pr * w * 0.26, y: shoulderY + h * 0.20 - pr * h * 0.60 };
      backFist = { x: cx - w * 0.02, y: shoulderY + h * 0.06 };
    } else if (atkAnim === 'lungethrust') {
      // fencing lunge: cane/arm drives far forward and low, fully committed
      const ext = Math.min(st * 7.0, w * 0.85);
      frontFist = { x: cx + w * 0.30 + ext, y: shoulderY + h * 0.03 };
      backFist = { x: cx - w * 0.08, y: shoulderY + h * 0.02 };
    } else { // straight
      const ext = Math.min(st * 4.0, w * (isFwdPunch ? 0.72 : 0.65));
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * (isFwdPunch ? 0.08 : 0.03) };
      backFist = { x: cx + w * 0.05, y: shoulderY + h * 0.05 };
    }
  } else if (isLegAtk) {
    // guard-up arms during kicks
    frontFist = { x: cx + w * 0.20, y: shoulderY + h * 0.02 };
    backFist = { x: cx + w * 0.06, y: shoulderY + h * 0.06 };
  }

  // Shared anticipation & follow-through for every normal attack:
  // limbs coil toward the body during windup, then blend back to neutral during recovery
  if (atkMove && !isThrown) {
    if (AKw > 0 && AKs === 0 && AKr === 0 && fighter.stateTimer < atkMove.active[0]) {
      const ck = AKw * 0.55;
      const coilX = cx + w * 0.04, coilY = shoulderY + h * 0.05;
      frontFist.x += (coilX - frontFist.x) * ck;
      frontFist.y += (coilY - frontFist.y) * ck;
      if (isLegAtk && !airborne && atkMove.type !== 'grab') {
        frontFoot.x += ((cx + w * 0.10) - frontFoot.x) * ck;
      }
    } else if (AKr > 0) {
      const rk = Math.pow(AKr, 1.4) * 0.85;
      frontFist.x += (nFFx - frontFist.x) * rk; frontFist.y += (nFFy - frontFist.y) * rk;
      backFist.x += (nBFx - backFist.x) * rk; backFist.y += (nBFy - backFist.y) * rk;
      frontFoot.x += (nFfx - frontFoot.x) * rk; frontFoot.y += (nFfy - frontFoot.y) * rk;
      backFoot.x += (nBfx - backFoot.x) * rk; backFoot.y += (nBfy - backFoot.y) * rk;
    }
  }

  if (isWin) frontFist = { x: cx + w * 0.18, y: -h * 0.06 };
  if (isParry) {
    const prog = Math.min(1, fighter.stateTimer / 6);
    frontFist = { x: cx + w * 0.18 + prog * w * 0.30, y: shoulderY + h * 0.02 };
    backFist = { x: cx + w * 0.12 + prog * w * 0.26, y: shoulderY + h * 0.11 };
  }
  if (isHit) {
    frontFist = { x: cx + w * 0.34, y: shoulderY + h * 0.10 };
    backFist = { x: cx - w * 0.05, y: shoulderY + h * 0.12 };
  }
  if (isSpecial) {
    const m = fighter.charDef.moves.special;
    if (m.type === 'grab') {
      const ext = Math.min(fighter.stateTimer * 3.5, w * 0.55);
      frontFist = { x: cx + w * 0.25 + ext, y: shoulderY + h * 0.05 };
      backFist = { x: cx + w * 0.18 + ext * 0.8, y: shoulderY + h * 0.12 };
    } else if (m.type === 'riposte') {
      // committed fencing thrust: draw arm/cane forward
      const ext = Math.min(fighter.stateTimer * 4.5, w * 0.9);
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * 0.05 };
      backFist = { x: cx - w * 0.02, y: shoulderY + h * 0.02 };
    } else if (m.type === 'projectile') {
      const prog = Math.min(1, fighter.stateTimer / m.active[0]);
      frontFist = {
        x: cx - w * 0.25 + prog * w * 0.95,
        y: shoulderY + h * 0.04 - Math.sin(prog * Math.PI) * h * 0.10,
      };
    } else if (m.type === 'shockwave') {
      const prog = Math.min(1, fighter.stateTimer / (m.active[0] || 10));
      frontFist = { x: cx + w * 0.20, y: shoulderY + prog * h * 0.58 };
      backFist = { x: cx - w * 0.08, y: shoulderY + prog * h * 0.50 };
    } else if (m.type === 'rewind') {
      const jitter = Math.sin(fighter.stateTimer * 0.6) * w * 0.015;
      frontFist = { x: cx + w * 0.10 + jitter, y: shoulderY + h * 0.07 };
      backFist = { x: cx + w * 0.05 - jitter, y: shoulderY + h * 0.09 };
    } else {
      const a = fighter.stateTimer * 0.35;
      frontFist = { x: cx + Math.cos(a) * w * 0.5, y: shoulderY + Math.sin(a) * h * 0.06 };
      backFist = { x: cx - Math.cos(a) * w * 0.45, y: shoulderY - Math.sin(a) * h * 0.05 };
    }
  }
  if (airborne && !isPunch && !isKick && !isSpecial) {
    frontFist = { x: cx + w * 0.32, y: shoulderY - h * 0.02 };
    backFist = { x: cx + w * 0.05, y: shoulderY + h * 0.04 };
  }

  const fistR = w * 0.085;
  function shoe(p) {
    ctx.fillStyle = '#15151a';
    ctx.beginPath();
    ctx.ellipse(p.x + w * 0.03, p.y - 3, w * 0.11, w * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function fist(p) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(p.x, p.y, fistR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  limb(ctx, cx - w * 0.08, hipY, backFoot.x, backFoot.y, secondary, limbW);
  shoe(backFoot);
  limb(ctx, cx - w * 0.10, shoulderY, backFist.x, backFist.y, primary, limbW * 0.9);
  fist(backFist);

  ctx.fillStyle = primary;
  rr(ctx, w * 0.18, torsoY, w * 0.64, torsoH, 7);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, w * 0.18, torsoY, w * 0.16, torsoH, 7);
  ctx.fill();

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, headR + 2, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx, headR * 0.9, headR * 1.02, Math.PI, Math.PI * 2);
  ctx.fill();

  if (!palette.noEyes) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + headR * 0.45, headR * 1.05, headR * 0.28, headR * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx + headR * 0.55, headR * 1.05, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + headR * 0.15, headR * 0.68);
    ctx.lineTo(cx + headR * 0.78, headR * 0.84);
    ctx.stroke();
  }

  limb(ctx, cx + w * 0.08, hipY, frontFoot.x, frontFoot.y, secondary, limbW);
  shoe(frontFoot);

  if (isKick && !airborne) {
    var kickMove = fighter.charDef.moves.kick;
    if (fighter.stateTimer < kickMove.active[0]) {
      var chargeProg = fighter.stateTimer / kickMove.active[0];
      var pulse = 0.5 + 0.5 * Math.sin(fighter.animTime * 0.5);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * chargeProg * pulse;
      ctx.fillStyle = '#ff5252';
      ctx.beginPath();
      ctx.arc(frontFoot.x, frontFoot.y - 5, w * (0.10 + 0.06 * chargeProg), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }


  limb(ctx, cx + w * 0.14, shoulderY, frontFist.x, frontFist.y, skin, limbW * 0.85);
  fist(frontFist);

  // Motion trail on the striking limb, tinted per move
  if (atkMove && fighter.stateTimer > 3 && fighter.stateTimer < (atkMove.active ? atkMove.active[1] + 4 : 99)) {
    const tip = isLegAtk ? frontFoot : frontFist;
    const originX = cx + (isLegAtk ? w * 0.05 : w * 0.18);
    const originY = isLegAtk ? hipY : shoulderY;
    const trailCol = atkMove.fx || '#ffffff';
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = trailCol;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 7;
      ctx.beginPath();
      ctx.moveTo(originX, originY + o);
      ctx.lineTo(tip.x, tip.y + o);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (accessories) {
    accessories({ w, h, cx, headR, torsoY, torsoH, shoulderY, hipY, frontFist, backFist, frontFoot, backFoot, airborne });
  }

  if (isHit && fighter.stunned) {
    const spin = t * 0.12;
    for (let i = 0; i < 3; i++) {
      const ang = spin + (i * Math.PI * 2) / 3;
      const sx = cx + Math.cos(ang) * headR * 1.6;
      const sy = -headR * 0.6 + Math.sin(ang) * headR * 0.5;
      drawStar(ctx, sx, sy, headR * 0.35, '#ffe066');
    }
  }

  ctx.restore();

  if (fighter.hitFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (fighter.hitFlash / 8) + ')';
    ctx.fillRect(0, 0, w, h);
  }
}

const CHARACTERS = [
  {
    id: 'max', name: 'Max', title: 'Der vegane Judo-Meister',
    palette: { skin: '#caa07a', hair: '#2b1c12', primary: '#f2ede1', secondary: '#e3dccb', accent: '#c0392b', outline: '#2a2520' },
    stats: { speed: 2.0, jumpVel: -10.4, health: 100 },
    moves: {
      punch: { name: 'Gi-Ruck', anim: 'judochop', dmg: 4, range: 118, total: 16, active: [4, 8], cooldown: 14, knockback: 3, pullIn: true, fx: '#f2ede1' },
      kick: { name: 'Ippon-Knie', anim: 'knee', dmg: 10, range: 98, total: 18, active: [4, 9], cooldown: 16, knockback: 3, antiAir: true, fx: '#c0392b' },
      fwd_punch: { name: 'Seoi-Nage', anim: 'judogrip', type: 'grab', dmg: 13, range: 100, total: 26, active: [6, 13], cooldown: 30, knockback: 0, throwTotal: 22, throwDist: -1.3, fx: '#e3dccb' },
      fwd_kick: { name: 'Ashi-Barai', anim: 'legreap', dmg: 12, range: 155, total: 34, active: [12, 20], cooldown: 32, knockback: 3, knockdown: true, pullIn: true, stun: 26, fx: '#caa07a' },
      special: { name: 'Judo-Wurf', dmg: 22, range: 125, total: 36, active: [8, 18], knockback: 20, stun: 30, type: 'grab' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH }) => {
        const t = fighter.animTime || 0;
        ctx.strokeStyle = '#b5ab94'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.14, torsoY + 2);
        ctx.lineTo(cx + w * 0.04, torsoY + h * 0.10);
        ctx.lineTo(cx + w * 0.2, torsoY + 2);
        ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.fillRect(w * 0.18, torsoY + torsoH * 0.82, w * 0.64, h * 0.045);
        ctx.fillRect(cx - 4, torsoY + torsoH * 0.82, 10, h * 0.045 + 2);
        ctx.fillRect(cx - 8, torsoY + torsoH * 0.88, 5, h * 0.09);
        ctx.fillRect(cx + 5, torsoY + torsoH * 0.88, 5, h * 0.075);
        ctx.fillStyle = this.palette.accent;
        ctx.fillRect(cx - headR, headR * 0.35, headR * 2, headR * 0.4);
        const flap = Math.sin(t * 0.15) * 4;
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.9, headR * 0.5);
        ctx.lineTo(cx - headR * 2.1, headR * 0.2 + flap);
        ctx.lineTo(cx - headR * 1.9, headR * 0.85 + flap);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.9, headR * 0.55);
        ctx.lineTo(cx - headR * 1.8, headR * 1.1 - flap);
        ctx.lineTo(cx - headR * 1.55, headR * 1.35 - flap);
        ctx.closePath(); ctx.fill();
        if (fighter.state === 'special') {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w * 0.85, h * 0.35, 16 + i * 10, -0.8, 0.8); ctx.stroke(); }
        }
      });
    },
  },
  {
    id: 'jan', name: 'Jan', title: 'Der alternative Denker',
    palette: { skin: '#e3b98f', hair: '#d4b84a', primary: '#111111', secondary: '#1a1a1a', accent: '#ffffff', outline: '#0a0a0a' },
    stats: { speed: 1.8, jumpVel: -10, health: 100 },
    moves: {
      punch: { name: 'Effizienz-Tipp', anim: 'snapjab', dmg: 4, hits: 2, hitGap: 6, range: 118, total: 20, active: [4, 14], cooldown: 16, knockback: 2, cdRefund: 10, fx: '#ffffff' },
      kick: { name: 'Retourkutsche', anim: 'crossspin', dmg: 8, range: 120, total: 30, active: [8, 22], cooldown: 28, knockback: 8, reflect: true, fx: '#d4b84a' },
      fwd_punch: { name: 'Konter-These', anim: 'dashpunch', dmg: 8, range: 130, total: 24, active: [7, 13], cooldown: 26, knockback: 5, counterMult: 2.6, counterLabel: 'KONTER-THESE!', counterMeter: 30, fx: '#ffffff' },
      fwd_kick: { name: 'Unterwanderung', anim: 'lowslide', dmg: 10, range: 150, total: 32, active: [11, 20], cooldown: 28, knockback: 6, adv: 13, lunge: 24, projectileImmune: true, passThrough: true, fx: '#d4b84a' },
      special: { name: 'Laptop-Diebstahl', dmg: 14, range: 999, total: 30, active: [10, 12], type: 'projectile', projectile: 'laptop', speed: 11, meterSteal: 15 },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH }) => {
        var skullX = cx - w * 0.02, skullY = torsoY + torsoH * 0.35, skullR = headR * 0.55;
        ctx.fillStyle = '#ddd';
        ctx.beginPath(); ctx.arc(skullX, skullY, skullR, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(skullX - skullR * 0.65, skullY + skullR * 0.4, skullR * 1.3, skullR * 0.6);
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(skullX - skullR * 0.32, skullY - skullR * 0.1, skullR * 0.22, 0, Math.PI * 2);
        ctx.arc(skullX + skullR * 0.32, skullY - skullR * 0.1, skullR * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(skullX - 1, skullY + skullR * 0.2);
        ctx.lineTo(skullX + 1, skullY + skullR * 0.2);
        ctx.lineTo(skullX, skullY + skullR * 0.35);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        for (var ti = -2; ti <= 2; ti++) {
          ctx.beginPath();
          ctx.moveTo(skullX + ti * skullR * 0.2, skullY + skullR * 0.55);
          ctx.lineTo(skullX + ti * skullR * 0.2, skullY + skullR * 0.85);
          ctx.stroke();
        }
        ctx.fillStyle = '#8a7a3c';
        ctx.beginPath(); ctx.arc(cx, headR * 0.9, headR * 1.04, Math.PI, Math.PI * 1.5); ctx.fill();
        ctx.fillStyle = '#c4a83a';
        ctx.beginPath(); ctx.arc(cx, headR * 0.9, headR * 1.04, Math.PI * 1.5, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d4b84a';
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.6, headR * 0.3);
        ctx.quadraticCurveTo(cx - headR * 0.2, -headR * 0.5, cx + headR * 0.3, -headR * 0.3);
        ctx.quadraticCurveTo(cx + headR * 0.8, -headR * 0.1, cx + headR * 1.3, headR * 0.4);
        ctx.quadraticCurveTo(cx + headR * 1.4, headR * 0.7, cx + headR * 1.2, headR * 0.9);
        ctx.lineTo(cx + headR * 0.7, headR * 0.65);
        ctx.quadraticCurveTo(cx + headR * 0.3, headR * 0.2, cx - headR * 0.1, headR * 0.15);
        ctx.quadraticCurveTo(cx - headR * 0.4, headR * 0.2, cx - headR * 0.6, headR * 0.5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8d06a';
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.3, headR * 0.25);
        ctx.quadraticCurveTo(cx + headR * 0.2, -headR * 0.15, cx + headR * 0.9, headR * 0.45);
        ctx.lineTo(cx + headR * 0.6, headR * 0.6);
        ctx.quadraticCurveTo(cx + headR * 0.1, headR * 0.15, cx - headR * 0.2, headR * 0.4);
        ctx.closePath(); ctx.fill();
        // bright strand highlights in the fringe
        ctx.strokeStyle = '#f4e68c'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.15, headR * 0.28);
        ctx.quadraticCurveTo(cx + headR * 0.35, -headR * 0.02, cx + headR * 0.95, headR * 0.5); ctx.stroke();

        // bunched-up hood around the neck
        ctx.fillStyle = '#1e1e1e';
        ctx.beginPath();
        ctx.ellipse(cx - w * 0.14, torsoY + h * 0.008, w * 0.11, w * 0.065, -0.25, 0, Math.PI * 2);
        ctx.ellipse(cx + w * 0.14, torsoY + h * 0.008, w * 0.11, w * 0.065, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - w * 0.14, torsoY - h * 0.012, w * 0.28, h * 0.035);
        ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.22, torsoY + h * 0.02); ctx.quadraticCurveTo(cx, torsoY + h * 0.045, cx + w * 0.22, torsoY + h * 0.02); ctx.stroke();
        // drawstrings with aglets
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.05, torsoY + h * 0.03); ctx.quadraticCurveTo(cx - w * 0.07, torsoY + h * 0.1, cx - w * 0.05, torsoY + h * 0.14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + w * 0.05, torsoY + h * 0.03); ctx.quadraticCurveTo(cx + w * 0.08, torsoY + h * 0.09, cx + w * 0.06, torsoY + h * 0.12); ctx.stroke();
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(cx - w * 0.06, torsoY + h * 0.14, 2.5, 4);
        ctx.fillRect(cx + w * 0.05, torsoY + h * 0.12, 2.5, 4);
        // kangaroo pocket
        ctx.strokeStyle = '#2e2e2e'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.17, torsoY + torsoH * 0.66);
        ctx.lineTo(cx - w * 0.12, torsoY + torsoH * 0.98);
        ctx.lineTo(cx + w * 0.12, torsoY + torsoH * 0.98);
        ctx.lineTo(cx + w * 0.17, torsoY + torsoH * 0.66);
        ctx.stroke();
        // crossbones under the skull print
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        var cbY = torsoY + torsoH * 0.35 + headR * 0.75;
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.5, cbY - headR * 0.18); ctx.lineTo(cx + headR * 0.46, cbY + headR * 0.18);
        ctx.moveTo(cx + headR * 0.46, cbY - headR * 0.18); ctx.lineTo(cx - headR * 0.5, cbY + headR * 0.18);
        ctx.stroke();
        // question-mark button pin ("der Denker")
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.arc(cx - w * 0.155, torsoY + torsoH * 0.18, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
        ctx.fillText('?', cx - w * 0.155, torsoY + torsoH * 0.18 + 2);
        ctx.textAlign = 'left';
      });
    },
  },
  {
    id: 'tonie', name: 'Tonie', title: 'Das kreative Chaos',
    palette: { skin: '#d9b08c', hair: '#5c3a1e', primary: '#1a1a24', secondary: '#3b5998', accent: '#e8c547', outline: '#0a0a12' },
    stats: { speed: 2.2, jumpVel: -10.8, health: 95 },
    moves: {
      punch: { name: 'Kleks-Kanonade', anim: 'paintjab', dmg: 3, hits: 3, hitGap: 6, range: 120, total: 26, active: [4, 20], cooldown: 18, knockback: 2, dmgRand: [1, 5], fx: '#ff2d95' },
      kick: { name: 'Farbexplosion', anim: 'brushkick', dmg: 10, range: 148, total: 36, active: [14, 22], cooldown: 34, knockback: 5, chaosRoll: true, fx: '#00e6c3' },
      fwd_punch: { name: 'Doppelklecks', anim: 'chaosupper', dmg: 7, hits: 2, hitGap: 7, range: 122, total: 28, active: [6, 18], cooldown: 30, knockback: 5, chaosRoll: true, fx: '#ff2d95' },
      fwd_kick: { name: 'Glücks-Hopser', anim: 'wobblekick', dmg: 11, range: 152, total: 34, active: [12, 24], cooldown: 30, knockback: 8, hopper: true, hopRand: true, fx: '#9b59b6' },
      special: { name: 'Zeit-Rückspul', dmg: 0, range: 0, total: 56, active: [22, 24], type: 'rewind' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH }) => {
        const waistY = torsoY + torsoH * 0.62;
        ctx.fillStyle = '#0e0e14';
        ctx.fillRect(w * 0.2, torsoY, w * 0.6, waistY - torsoY);
        ctx.fillStyle = this.palette.skin;
        ctx.fillRect(w * 0.2, waistY, w * 0.6, torsoH * 0.12);
        ctx.fillStyle = '#23232e';
        ctx.beginPath(); ctx.moveTo(w * 0.12, torsoY - 2); ctx.lineTo(cx - w * 0.04, torsoY - 2);
        ctx.lineTo(cx - w * 0.1, torsoY + torsoH * 0.95); ctx.lineTo(w * 0.1, torsoY + torsoH * 1.0);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w * 0.88, torsoY - 2); ctx.lineTo(cx + w * 0.04, torsoY - 2);
        ctx.lineTo(cx + w * 0.1, torsoY + torsoH * 0.95); ctx.lineTo(w * 0.9, torsoY + torsoH * 1.0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#15151c';
        ctx.fillRect(w * 0.1, torsoY + torsoH * 0.92, w * 0.32, torsoH * 0.1);
        ctx.fillRect(w * 0.58, torsoY + torsoH * 0.92, w * 0.32, torsoH * 0.1);
        ctx.fillStyle = '#3a3a48';
        ctx.beginPath(); ctx.moveTo(w * 0.2, torsoY - 2); ctx.lineTo(cx - w * 0.02, torsoY - 2);
        ctx.lineTo(cx - w * 0.1, torsoY + torsoH * 0.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w * 0.8, torsoY - 2); ctx.lineTo(cx + w * 0.02, torsoY - 2);
        ctx.lineTo(cx + w * 0.1, torsoY + torsoH * 0.3); ctx.closePath(); ctx.fill();
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff2d95'; ctx.fillStyle = '#ff2d95';
        ctx.fillRect(w * 0.16, torsoY + torsoH * 0.25, w * 0.08, h * 0.03);
        ctx.shadowColor = '#00e6c3'; ctx.fillStyle = '#00e6c3';
        ctx.fillRect(w * 0.76, torsoY + torsoH * 0.4, w * 0.06, h * 0.025);
        ctx.restore();
        ctx.fillStyle = '#2a4a82';
        ctx.fillRect(w * 0.2, waistY + torsoH * 0.12, w * 0.6, torsoH * 0.12);
        ctx.fillStyle = '#c9a84c';
        ctx.beginPath(); ctx.arc(cx, waistY + torsoH * 0.18, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b8b8c0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(w * 0.28, waistY + torsoH * 0.18);
        ctx.quadraticCurveTo(w * 0.22, h * 0.62, w * 0.34, h * 0.66); ctx.stroke();
        ctx.strokeStyle = '#6a88c0'; ctx.lineWidth = 2;
        for (var ri = 0; ri < 3; ri++) {
          var ry = h * (0.7 + ri * 0.07);
          ctx.beginPath(); ctx.moveTo(w * 0.32, ry); ctx.lineTo(w * 0.4, ry + 2);
          ctx.moveTo(w * 0.58, ry + 4); ctx.lineTo(w * 0.66, ry + 6); ctx.stroke();
        }
        ctx.fillStyle = this.palette.hair;
        ctx.beginPath(); ctx.arc(cx, headR * 0.9, headR * 1.15, Math.PI * 0.85, Math.PI * 1.0);
        ctx.lineTo(cx - headR * 1.15, headR * 1.3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, headR * 0.9, headR * 1.1, Math.PI, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - headR * 1.1, headR * 0.9);
        ctx.quadraticCurveTo(cx - headR * 1.3, headR * 2.2, cx - headR * 0.9, torsoY + torsoH * 0.2);
        ctx.lineTo(cx - headR * 0.6, torsoY + torsoH * 0.15);
        ctx.quadraticCurveTo(cx - headR * 0.85, headR * 2.0, cx - headR * 0.7, headR * 1.0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.4, headR * 1.0, headR * 0.32, headR * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#5a3520';
        ctx.beginPath(); ctx.arc(cx + headR * 0.48, headR * 1.0, headR * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(cx + headR * 0.5, headR * 1.0, headR * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx + headR * 0.44, headR * 0.93, headR * 0.04, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a0a1a'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.12, headR * 1.2);
        ctx.lineTo(cx + headR * 0.72, headR * 1.18); ctx.lineTo(cx + headR * 0.88, headR * 1.02); ctx.stroke();
        ctx.strokeStyle = '#3d2515'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.1, headR * 0.72);
        ctx.quadraticCurveTo(cx + headR * 0.45, headR * 0.62, cx + headR * 0.75, headR * 0.74); ctx.stroke();
        ctx.strokeStyle = '#a0805a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.25, headR * 1.15);
        ctx.lineTo(cx + headR * 0.2, headR * 1.35); ctx.lineTo(cx + headR * 0.32, headR * 1.38); ctx.stroke();
        ctx.strokeStyle = '#8a4a30'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.1, headR * 1.55);
        ctx.quadraticCurveTo(cx + headR * 0.35, headR * 1.68, cx + headR * 0.6, headR * 1.52); ctx.stroke();
        ctx.strokeStyle = '#c06040'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.15, headR * 1.55);
        ctx.quadraticCurveTo(cx + headR * 0.35, headR * 1.48, cx + headR * 0.55, headR * 1.53); ctx.stroke();
        ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, headR * 2.1, headR * 0.5, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#c9a84c';
        ctx.beginPath(); ctx.arc(cx, headR * 2.55, 2.5, 0, Math.PI * 2); ctx.fill();

        // shine strands in the long hair fall
        ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.95, headR * 1.0);
        ctx.quadraticCurveTo(cx - headR * 1.12, headR * 2.0, cx - headR * 0.85, torsoY + torsoH * 0.12); ctx.stroke();

        // glasses temple arm back toward the ear
        ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.09, headR * 0.98); ctx.lineTo(cx - headR * 0.28, headR * 0.88); ctx.stroke();

        // paintbrush tucked behind the ear
        ctx.save();
        ctx.translate(cx - headR * 0.35, headR * 0.72); ctx.rotate(-0.5);
        ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(headR * 0.85, 0); ctx.stroke();
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(headR * 0.85, -2, 3.5, 4);
        ctx.fillStyle = '#ff2d95';
        ctx.beginPath(); ctx.moveTo(headR * 0.85 + 3.5, -2); ctx.lineTo(headR * 1.25, 0); ctx.lineTo(headR * 0.85 + 3.5, 2); ctx.closePath(); ctx.fill();
        ctx.restore();

        // paint splatters on jacket and jeans
        var splats = [
          [w * 0.30, torsoY + torsoH * 0.5, '#ff2d95', 2.2], [w * 0.68, torsoY + torsoH * 0.32, '#00e6c3', 1.8],
          [w * 0.52, torsoY + torsoH * 0.72, '#9b59b6', 2.5], [w * 0.38, h * 0.80, '#e8c547', 2.0],
          [w * 0.60, h * 0.86, '#ff2d95', 1.6], [w * 0.26, torsoY + torsoH * 0.85, '#00e6c3', 1.4],
        ];
        for (var si2 = 0; si2 < splats.length; si2++) {
          ctx.fillStyle = splats[si2][2];
          ctx.beginPath(); ctx.arc(splats[si2][0], splats[si2][1], splats[si2][3], 0, Math.PI * 2); ctx.fill();
        }
        // one little drip
        ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w * 0.52, torsoY + torsoH * 0.72); ctx.lineTo(w * 0.52, torsoY + torsoH * 0.82); ctx.stroke();

        if (fighter.state === 'special') {
          const orbX = cx + w * 0.1, orbY = torsoY + h * 0.05 + h * 0.08;
          const colors = ['#00e6c3', '#7d5fff', '#ffffff', '#3b5998'];
          ctx.save(); ctx.shadowBlur = 10;
          for (let i = 0; i < 8; i++) {
            const color = colors[i % colors.length];
            ctx.shadowColor = color; ctx.fillStyle = color;
            const ang = -(i / 8) * Math.PI * 2 - fighter.stateTimer * 0.3;
            const dist = Math.max(4, 32 - (fighter.stateTimer % 12) * 2.6);
            ctx.beginPath(); ctx.arc(orbX + Math.cos(ang) * dist, orbY + Math.sin(ang) * dist * 0.7, 4, 0, Math.PI * 2); ctx.fill();
          }
          ctx.shadowBlur = 6; ctx.shadowColor = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(orbX, orbY, 7, 0, Math.PI * 2); ctx.stroke();
          const handAng = -fighter.stateTimer * 0.25;
          ctx.beginPath(); ctx.moveTo(orbX, orbY); ctx.lineTo(orbX + Math.cos(handAng) * 5, orbY + Math.sin(handAng) * 5); ctx.stroke();
          ctx.restore();
        }
      });
    },
  },
  {
    id: 'timo', name: 'Timo', title: 'Der schlafende Toast-Krieger',
    palette: { skin: '#e3b98f', hair: '#d4a843', primary: '#2c3e8c', secondary: '#1c2a5e', accent: '#f4d03f', outline: '#141d3d', noEyes: true },
    stats: { speed: 1.6, jumpVel: -9.2, health: 110 },
    moves: {
      punch: { name: 'Gähn-Schwinger', anim: 'lazyswing', dmg: 7, range: 125, total: 20, active: [6, 11], cooldown: 18, knockback: 4, stun: 18, slowOnHit: true, fx: '#e6b35c' },
      kick: { name: 'Matratzen-Stampf', anim: 'stomp', dmg: 14, range: 105, total: 40, active: [16, 24], cooldown: 38, knockback: 6, groundBounce: true, armor: true, armorBreak: 9, stompWave: true, fx: '#e6b35c' },
      fwd_punch: { name: 'Butterseite', anim: 'overhead', dmg: 14, range: 142, total: 34, active: [14, 22], cooldown: 34, knockback: 6, groundBounce: true, stun: 22, lifesteal: 0.25, fx: '#ffffff' },
      fwd_kick: { name: 'Decken-Zug', anim: 'bigsweep', dmg: 11, range: 155, total: 36, active: [13, 22], cooldown: 32, knockback: 5, pullIn: true, stun: 22, meterDrain: 18, fx: '#e6b35c' },
      special: { name: 'Wachgerüttelt!', dmg: 0, range: 0, total: 24, active: [6, 8], type: 'hyper', duration: 600, speedMult: 3.0, dmgMult: 0.35, atkSpeedMult: 2.3 },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, frontFist }) => {
        const t = fighter.animTime || 0;
        const stars = [[cx - w * 0.12, torsoY + torsoH * 0.3], [cx + w * 0.1, torsoY + torsoH * 0.58], [cx - w * 0.05, torsoY + torsoH * 0.8]];
        stars.forEach(([sx, sy]) => drawStar(ctx, sx, sy, 4.5, this.palette.accent));
        ctx.fillStyle = '#5b4a8a';
        ctx.fillRect(cx - headR * 0.95, headR * 0.15, headR * 1.9, headR * 0.5);
        ctx.strokeStyle = '#3d3160'; ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - headR * 0.95, headR * 0.15, headR * 1.9, headR * 0.5);
        ctx.fillStyle = this.palette.hair;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(cx + i * headR * 0.5, headR * 0.1);
          ctx.lineTo(cx + i * headR * 0.5 - 4, -headR * 0.45);
          ctx.lineTo(cx + i * headR * 0.5 + 4, -headR * 0.12); ctx.fill();
        }
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.6, headR * 1.05); ctx.lineTo(cx - headR * 0.1, headR * 1.05);
        ctx.moveTo(cx + headR * 0.15, headR * 1.05); ctx.lineTo(cx + headR * 0.65, headR * 1.05);
        ctx.stroke();
        if (fighter.state === 'idle') {
          const float = (t % 90) / 90;
          ctx.fillStyle = 'rgba(255,255,255,' + (1 - float) + ')';
          ctx.font = (8 + float * 8) + 'px monospace';
          ctx.fillText('z', cx + headR * 1.4, headR - float * 25);
        }
        if (fighter.state !== 'special') {
          ctx.fillStyle = '#cd853f';
          ctx.beginPath(); ctx.arc(frontFist.x + 4, frontFist.y - 2, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e6b35c';
          ctx.beginPath(); ctx.arc(frontFist.x + 4, frontFist.y - 2, 6, 0, Math.PI * 2); ctx.fill();
        }
      });
    },
  },
  {
    id: 'luka', name: 'Luka', title: 'Der Style-Rebell',
    palette: { skin: '#deb08a', hair: '#e8d5a3', primary: '#8c2340', secondary: '#3a3545', accent: '#1a1a1a', outline: '#1a1018' },
    stats: { speed: 2.1, jumpVel: -10.24, health: 95 },
    moves: {
      punch: { name: 'Gürtel-Peitsche', anim: 'buckleswing', dmg: 5, range: 138, total: 16, active: [4, 9], cooldown: 14, knockback: 3, tipBonus: 1.4, tipThreshold: 0.7, fx: '#8c2340' },
      kick: { name: 'Klingen-Wirbel', anim: 'swordspin', dmg: 7, hits: 2, hitGap: 8, range: 110, total: 34, active: [10, 24], cooldown: 32, knockback: 9, deflect: true, fx: '#d0d0d8' },
      fwd_punch: { name: 'Klingentanz', anim: 'bladethrust', dmg: 5, hits: 3, hitGap: 5, range: 150, total: 26, active: [5, 20], cooldown: 28, knockback: 3, fx: '#d0d0d8' },
      fwd_kick: { name: 'Ketten-Haken', anim: 'chainthrow', type: 'grab', dmg: 14, range: 260, total: 30, active: [8, 16], cooldown: 34, throwTotal: 24, throwDist: 0.5, meterBonus: 10, fx: '#3a3545' },
      special: { name: 'Schwert-Hieb', dmg: 20, range: 190, total: 36, active: [10, 20], knockback: 16, stun: 24, type: 'melee' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, shoulderY, frontFist }) => {
        const t = fighter.animTime || 0;
        ctx.fillStyle = '#8c2340';
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.20, torsoY); ctx.lineTo(cx + w * 0.04, torsoY + torsoH * 0.45);
        ctx.lineTo(cx + w * 0.20, torsoY); ctx.lineTo(cx + w * 0.24, torsoY - h * 0.02);
        ctx.lineTo(cx + w * 0.06, torsoY + torsoH * 0.35); ctx.lineTo(cx - w * 0.24, torsoY - h * 0.02);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let ly = 0; ly < 4; ly++) for (let lx = -2; lx <= 2; lx++) {
          ctx.beginPath(); ctx.arc(cx + lx * w * 0.06, torsoY + torsoH * 0.25 + ly * h * 0.04, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#c0b283';
        ctx.fillRect(cx - w * 0.05, torsoY + torsoH * 0.85, w * 0.10, h * 0.05);
        ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - w * 0.05, torsoY + torsoH * 0.85, w * 0.10, h * 0.05);
        ctx.beginPath(); ctx.arc(cx, torsoY + torsoH * 0.875, w * 0.02, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.fillRect(w * 0.18, torsoY + torsoH * 0.87, w * 0.14, h * 0.025);
        ctx.fillRect(cx + w * 0.05, torsoY + torsoH * 0.87, w * 0.14, h * 0.025);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
        for (let si = -2; si <= 2; si++) {
          ctx.beginPath(); ctx.moveTo(cx + si * w * 0.06, torsoY + torsoH);
          ctx.lineTo(cx + si * w * 0.07, h); ctx.stroke();
        }
        const scarfSway = Math.sin(t * 0.1) * 3;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath(); ctx.moveTo(cx - w * 0.12, shoulderY);
        ctx.quadraticCurveTo(cx - w * 0.18 + scarfSway, shoulderY + torsoH * 0.5, cx - w * 0.22 + scarfSway * 1.5, torsoY + torsoH + h * 0.08);
        ctx.lineTo(cx - w * 0.14 + scarfSway * 1.5, torsoY + torsoH + h * 0.08);
        ctx.quadraticCurveTo(cx - w * 0.12 + scarfSway, shoulderY + torsoH * 0.4, cx - w * 0.06, shoulderY);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.08, shoulderY + h * 0.02);
        ctx.quadraticCurveTo(cx, shoulderY + h * 0.12, cx + w * 0.04, shoulderY + h * 0.06); ctx.stroke();
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath(); ctx.arc(cx, shoulderY + h * 0.11, 3, 0, Math.PI * 2); ctx.fill();
        // Emo makeup
        ctx.fillStyle = 'rgba(30,10,30,0.4)';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.45, headR * 1.05, headR * 0.42, headR * 0.34, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a0a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.15, headR * 1.08);
        ctx.quadraticCurveTo(cx + headR * 0.45, headR * 1.28, cx + headR * 0.85, headR * 1.02); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.82, headR * 1.02);
        ctx.lineTo(cx + headR * 0.98, headR * 0.85); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.45, headR * 1.05, headR * 0.28, headR * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(cx + headR * 0.55, headR * 1.05, headR * 0.12, 0, Math.PI * 2); ctx.fill();
        // Emo hair
        ctx.fillStyle = this.palette.hair;
        ctx.beginPath();
        ctx.moveTo(cx + headR * 0.8, headR * 0.1);
        ctx.quadraticCurveTo(cx + headR * 0.2, headR * 0.3, cx - headR * 0.7, headR * 1.4);
        ctx.lineTo(cx - headR * 1.1, headR * 1.2);
        ctx.quadraticCurveTo(cx - headR * 0.3, headR * 0.5, cx - headR * 0.1, headR * 0.05);
        ctx.quadraticCurveTo(cx + headR * 0.4, headR * -0.1, cx + headR * 0.8, headR * 0.1);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.7, headR * 1.4);
        ctx.lineTo(cx - headR * 0.9, headR * 1.65); ctx.lineTo(cx - headR * 0.5, headR * 1.3);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.9, headR * 1.25);
        ctx.lineTo(cx - headR * 1.2, headR * 1.5); ctx.lineTo(cx - headR * 0.75, headR * 1.15);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.85, headR * 0.3);
        ctx.quadraticCurveTo(cx + headR * 1.2, headR * 0.7, cx + headR * 1.0, headR * 1.2);
        ctx.lineTo(cx + headR * 0.8, headR * 1.0);
        ctx.quadraticCurveTo(cx + headR * 0.95, headR * 0.6, cx + headR * 0.7, headR * 0.35);
        ctx.closePath(); ctx.fill();
        // Chain hook
        if (fighter.state === 'fwd_kick' && fighter.stateTimer >= 4) {
          var hprog = Math.min(1, (fighter.stateTimer - 4) / 10);
          var chainLen = w * 3.0 * hprog;
          var ox = frontFist.x, oy = frontFist.y;
          ctx.strokeStyle = '#3a3545'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath();
          var segs = 9;
          for (var seg = 0; seg <= segs; seg++) {
            var px = ox + chainLen * (seg / segs);
            var py = oy + Math.sin(seg * 1.4 + t * 0.3) * 5;
            if (seg === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.fillStyle = '#8a8a90';
          ctx.beginPath(); ctx.arc(ox + chainLen, oy, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Sword — drawn during the special swing, the quick blade thrust, and the spinning slash kick
        var drawsSword = fighter.state === 'special' || fighter.state === 'fwd_punch' || fighter.state === 'kick';
        if (drawsSword) {
          var st = fighter.stateTimer;
          var swordLen, rot;
          if (fighter.state === 'special') {
            var ext = Math.min(1, Math.max(0, st - 6) / 6);
            swordLen = w * 1.6 * ext;
            rot = -0.15;
          } else if (fighter.state === 'fwd_punch') {
            var ext2 = Math.min(1, st / 6);
            swordLen = w * 1.1 * ext2;
            rot = 0;
          } else {
            swordLen = w * 1.0;
            rot = st * 0.12;
          }
          var sx = frontFist.x, sy = frontFist.y;
          ctx.fillStyle = '#d0d0d8';
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
          ctx.fillRect(0, -3, swordLen, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(0, -3, swordLen, 2);
          ctx.beginPath(); ctx.moveTo(swordLen, -4); ctx.lineTo(swordLen + 10, 0);
          ctx.lineTo(swordLen, 4); ctx.closePath(); ctx.fillStyle = '#c0c0c8'; ctx.fill();
          ctx.fillStyle = '#c0b283'; ctx.fillRect(-4, -8, 8, 16);
          ctx.restore();
          if (fighter.state === 'special') {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
            for (var si = 0; si < 3; si++) {
              ctx.beginPath(); ctx.arc(sx, sy, swordLen * 0.5 + si * 12, -0.4, 0.3); ctx.stroke();
            }
          }
        } else {
          ctx.fillStyle = '#2a2a2a';
          ctx.save(); ctx.translate(cx + w * 0.15, torsoY + torsoH * 0.8); ctx.rotate(0.25);
          ctx.fillRect(0, 0, 4, h * 0.28);
          ctx.fillStyle = '#c0b283'; ctx.fillRect(-2, 0, 8, 5);
          ctx.restore();
        }
      });
    },
  },
  {
    id: 'nova', name: 'Nova', title: 'Die Studio-Rebellin',
    palette: { skin: '#e7c19a', hair: '#d9c069', primary: '#18181f', secondary: '#2c2c3a', accent: '#e8c34a', outline: '#101015' },
    stats: { speed: 2.2, jumpVel: -10.6, health: 95 },
    moves: {
      punch: { name: 'Stich-Jab', anim: 'flashjab', dmg: 4, range: 118, total: 15, active: [4, 8], cooldown: 13, knockback: 2, applyMark: true, fx: '#f5d76e' },
      kick: { name: 'Nadel-Absatz', anim: 'photospin', dmg: 11, range: 145, total: 32, active: [12, 20], cooldown: 30, knockback: 7, retreat: true, fx: '#e8c34a' },
      fwd_punch: { name: 'Pose-Upper', anim: 'risingflash', dmg: 9, range: 122, total: 26, active: [6, 14], cooldown: 28, knockback: 6, launcher: true, consumeMark: true, fx: '#f5d76e' },
      fwd_kick: { name: 'Blitzlicht-Ansturm', anim: 'runwaykick', dmg: 11, range: 165, total: 32, active: [11, 20], cooldown: 30, knockback: 9, adv: 10, lunge: 24, consumeMark: true, flashOnConsume: true, fx: '#e8c34a' },
      special: { name: 'Express-Piercing', dmg: 24, range: 120, total: 40, active: [8, 18], knockback: 18, stun: 30, type: 'grab' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, frontFist }) => {
        // gold necklace
        ctx.strokeStyle = '#e8c34a'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.10, torsoY + h * 0.015);
        ctx.quadraticCurveTo(cx, torsoY + h * 0.07, cx + w * 0.10, torsoY + h * 0.015);
        ctx.stroke();
        ctx.fillStyle = '#e8c34a';
        ctx.beginPath(); ctx.arc(cx, torsoY + h * 0.06, 1.8, 0, Math.PI * 2); ctx.fill();

        // side wavy locks
        ctx.strokeStyle = '#cdb45c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.85, headR * 0.95);
        ctx.quadraticCurveTo(cx - headR * 1.05, headR * 1.5, cx - headR * 0.7, headR * 1.95); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.85, headR * 0.95);
        ctx.quadraticCurveTo(cx + headR * 1.05, headR * 1.5, cx + headR * 0.7, headR * 1.95); ctx.stroke();

        // shaggy blonde bangs over the forehead
        ctx.fillStyle = '#d9c069';
        for (let i = -2; i <= 2; i++) {
          const bx = cx + i * headR * 0.34;
          ctx.beginPath();
          ctx.moveTo(bx - headR * 0.18, headR * 0.9);
          ctx.lineTo(bx + (i % 2 ? headR * 0.12 : -headR * 0.06), headR * 1.22);
          ctx.lineTo(bx + headR * 0.18, headR * 0.9);
          ctx.closePath(); ctx.fill();
        }

        // striped headband (clipped to head)
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, headR + 2, headR, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#101015';
        ctx.fillRect(cx - headR, headR * 0.46, headR * 2, headR * 0.46);
        ctx.strokeStyle = '#f3f3f3'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx - headR, headR * 0.59); ctx.lineTo(cx + headR, headR * 0.59); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - headR, headR * 0.78); ctx.lineTo(cx + headR, headR * 0.78); ctx.stroke();
        ctx.restore();

        // eyebrow piercing
        ctx.fillStyle = '#f5d76e';
        ctx.beginPath(); ctx.arc(cx + headR * 0.32, headR * 0.96, 1.7, 0, Math.PI * 2); ctx.fill();

        // septum nose ring
        ctx.strokeStyle = '#e8c34a'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx + headR * 0.22, headR * 1.42, 2.3, 0.15 * Math.PI, 0.9 * Math.PI); ctx.stroke();

        // berry lips
        ctx.fillStyle = '#7a2e34';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.32, headR * 1.6, headR * 0.22, headR * 0.1, 0, 0, Math.PI * 2); ctx.fill();

        // camera + flash during special
        if (fighter.state === 'special') {
          ctx.fillStyle = '#222';
          ctx.fillRect(frontFist.x - 9, frontFist.y - 8, 20, 15);
          ctx.fillStyle = '#4fc3f7';
          ctx.beginPath(); ctx.arc(frontFist.x + 1, frontFist.y, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillRect(frontFist.x + 6, frontFist.y - 12, 6, 4);
          if (fighter.stateTimer >= 10) {
            const fl = Math.max(0, 1 - (fighter.stateTimer - 10) / 8);
            ctx.strokeStyle = 'rgba(255,247,200,' + fl + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            for (let i = 0; i < 7; i++) {
              const a = (i / 7) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(frontFist.x + 8 + Math.cos(a) * 6, frontFist.y - 10 + Math.sin(a) * 6);
              ctx.lineTo(frontFist.x + 8 + Math.cos(a) * 18, frontFist.y - 10 + Math.sin(a) * 18);
              ctx.stroke();
            }
          }
        }
      });
    },
  },
  {
    id: 'yorick', name: 'Yorick', title: 'Der Dandy',
    palette: { skin: '#dba978', hair: '#5c3a20', primary: '#1c1824', secondary: '#241f2e', accent: '#d4af6a', outline: '#14101c' },
    stats: { speed: 2.0, jumpVel: -10.5, health: 100 },
    moves: {
      punch: { name: 'Doppel-Ohrfeige', anim: 'slap', dmg: 3, hits: 2, hitGap: 6, range: 98, total: 20, active: [5, 14], cooldown: 12, knockback: 2, meterDrain: 3, fx: '#fdf6e8' },
      kick: { name: 'Steppschritt', anim: 'charleston', dmg: 6, hits: 2, hitGap: 8, range: 120, total: 34, active: [8, 24], cooldown: 30, knockback: 8, adv: 4, fx: '#d4af6a' },
      fwd_punch: { name: 'Degen-Finte', anim: 'lungethrust', dmg: 6, range: 180, total: 20, active: [5, 10], cooldown: 22, knockback: 4, counterMult: 2.8, counterLabel: 'RIPOSTE!', whiffPunish: true, whiffStun: 30, fx: '#d4af6a' },
      fwd_kick: { name: 'Manieren-Lektion', anim: 'canehook', dmg: 10, range: 148, total: 32, active: [12, 20], cooldown: 30, knockback: 0, pullIn: true, stun: 30, fx: '#d4af6a' },
      special: { name: 'Coup de Grâce', anim: 'lungethrust', dmg: 40, range: 175, total: 32, active: [8, 16], knockback: 18, stun: 30, type: 'riposte', fx: '#ffd700' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, frontFist, backFist }) => {
        const t = fighter.animTime || 0;
        // White dress glove on the back hand (front hand gets one after the sleeve draw below)
        const glove = function (p, r) {
          ctx.fillStyle = '#fdf6e8';
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#c9bfa8'; ctx.lineWidth = 1; ctx.stroke();
        };
        glove(backFist, w * 0.075);
        glove(frontFist, w * 0.085);
        // slap swoosh trailing the open glove during the backhand
        if (fighter.state === 'punch' && fighter.stateTimer >= 4 && fighter.stateTimer <= 12) {
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx + w * 0.06, frontFist.y, w * 0.44, -1.0, 0.4);
          ctx.stroke();
          ctx.restore();
        }
        // Double-breasted jacket overlap
        ctx.fillStyle = this.palette.secondary;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.20, torsoY); ctx.lineTo(cx + w * 0.04, torsoY + torsoH * 0.42);
        ctx.lineTo(cx + w * 0.20, torsoY); ctx.lineTo(cx + w * 0.24, torsoY - h * 0.02);
        ctx.lineTo(cx + w * 0.06, torsoY + torsoH * 0.32); ctx.lineTo(cx - w * 0.24, torsoY - h * 0.02);
        ctx.closePath(); ctx.fill();
        // gold piping on lapel edges
        ctx.strokeStyle = this.palette.accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.20, torsoY); ctx.lineTo(cx - w * 0.24, torsoY - h * 0.02); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + w * 0.20, torsoY); ctx.lineTo(cx + w * 0.24, torsoY - h * 0.02); ctx.stroke();
        // twin gold button rows
        ctx.fillStyle = this.palette.accent;
        for (let by = 0; by < 3; by++) {
          ctx.beginPath(); ctx.arc(cx - w * 0.06, torsoY + torsoH * (0.18 + by * 0.16), 1.3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + w * 0.06, torsoY + torsoH * (0.18 + by * 0.16), 1.3, 0, Math.PI * 2); ctx.fill();
        }
        // shirt collar + slim tie + pin
        ctx.fillStyle = '#fdf6e8';
        ctx.beginPath(); ctx.moveTo(cx - w * 0.05, torsoY); ctx.lineTo(cx, torsoY + h * 0.04); ctx.lineTo(cx + w * 0.05, torsoY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7a1f2b';
        ctx.fillRect(cx - w * 0.018, torsoY + h * 0.01, w * 0.036, torsoH * 0.5);
        ctx.fillStyle = this.palette.accent;
        ctx.beginPath(); ctx.arc(cx, torsoY + h * 0.075, 1.6, 0, Math.PI * 2); ctx.fill();
        // pocket square
        ctx.fillStyle = this.palette.accent;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.16, torsoY + torsoH * 0.22);
        ctx.lineTo(cx - w * 0.10, torsoY + torsoH * 0.16);
        ctx.lineTo(cx - w * 0.11, torsoY + torsoH * 0.30);
        ctx.closePath(); ctx.fill();
        // ---- Long hair, combed straight back, flowing past the shoulder (face stays open) ----
        const hairC = this.palette.hair;       // base brown
        const hairD = '#3f2715';               // shadow strands
        const hairL = '#8a5a30';               // highlight strands
        ctx.lineJoin = 'round';

        // Back lengths (drawn first, behind the crown) — layered locks for volume
        ctx.fillStyle = hairD;
        ctx.beginPath();
        ctx.moveTo(cx - headR * 1.05, headR * 0.7);
        ctx.quadraticCurveTo(cx - headR * 1.5, headR * 2.3, cx - headR * 0.95, headR * 3.7);
        ctx.quadraticCurveTo(cx - headR * 0.72, headR * 4.45, cx - headR * 0.45, headR * 4.25);
        ctx.quadraticCurveTo(cx - headR * 0.58, headR * 3.0, cx - headR * 0.42, headR * 1.7);
        ctx.quadraticCurveTo(cx - headR * 0.38, headR * 1.05, cx - headR * 0.6, headR * 0.75);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = hairC;
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.55, headR * 0.8);
        ctx.quadraticCurveTo(cx - headR * 0.95, headR * 2.1, cx - headR * 0.55, headR * 3.25);
        ctx.quadraticCurveTo(cx - headR * 0.32, headR * 3.7, cx - headR * 0.12, headR * 3.2);
        ctx.quadraticCurveTo(cx - headR * 0.2, headR * 2.0, cx - headR * 0.08, headR * 0.95);
        ctx.closePath(); ctx.fill();

        // Crown — swept up off the forehead and back over the skull
        ctx.fillStyle = hairC;
        ctx.beginPath();
        ctx.moveTo(cx + headR * 0.80, headR * 0.52);
        ctx.quadraticCurveTo(cx + headR * 0.45, headR * -0.22, cx - headR * 0.15, headR * -0.32);
        ctx.quadraticCurveTo(cx - headR * 1.0, headR * -0.08, cx - headR * 1.12, headR * 0.88);
        ctx.quadraticCurveTo(cx - headR * 1.15, headR * 1.5, cx - headR * 0.76, headR * 1.68);
        ctx.quadraticCurveTo(cx - headR * 0.2, headR * 1.05, cx + headR * 0.36, headR * 0.92);
        ctx.quadraticCurveTo(cx + headR * 0.72, headR * 0.82, cx + headR * 0.80, headR * 0.52);
        ctx.closePath(); ctx.fill();

        // Comb-back shadow strands over the crown
        ctx.strokeStyle = hairD; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.62, headR * 0.42); ctx.quadraticCurveTo(cx - headR * 0.1, headR * -0.12, cx - headR * 0.85, headR * 0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.30, headR * 0.30); ctx.quadraticCurveTo(cx - headR * 0.45, headR * -0.02, cx - headR * 1.0, headR * 0.7); ctx.stroke();
        // Highlight strand catching the light
        ctx.strokeStyle = hairL; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.46, headR * 0.34); ctx.quadraticCurveTo(cx - headR * 0.25, headR * -0.05, cx - headR * 0.9, headR * 0.55); ctx.stroke();
        // Flowing strand texture down the long hair
        ctx.strokeStyle = hairL; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.5, headR * 1.2); ctx.quadraticCurveTo(cx - headR * 0.72, headR * 2.3, cx - headR * 0.5, headR * 3.1); ctx.stroke();
        ctx.strokeStyle = hairD; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.82, headR * 1.3); ctx.quadraticCurveTo(cx - headR * 1.02, headR * 2.5, cx - headR * 0.72, headR * 3.5); ctx.stroke();

        // Sideburn framing the jaw in front of the ear (below the eye, face stays clear)
        ctx.strokeStyle = hairC; ctx.lineWidth = headR * 0.18;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.82, headR * 0.95); ctx.lineTo(cx + headR * 0.86, headR * 1.5); ctx.stroke();

        // Cane — swung during heavy attacks/special, otherwise resting at his hip
        const isThrust = fighter.state === 'fwd_punch' || fighter.state === 'special';
        const isHook = fighter.state === 'fwd_kick';
        if (isHook && fighter.stateTimer >= 2) {
          // Low hooking sweep: cane reaches down and forward, the crook yanks the leg in
          const sw = Math.min(1, (fighter.stateTimer - 2) / 10);
          const reach = w * 0.9 * sw;
          const sx = frontFist.x, sy = frontFist.y;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.85 - sw * 0.35);
          ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(reach, 0); ctx.stroke();
          // gold crook (J-hook) at the tip
          ctx.strokeStyle = this.palette.accent; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(reach, -6, 6, Math.PI * 0.5, Math.PI * 1.6); ctx.stroke();
          ctx.restore();
          // motion arc of the hooking sweep
          ctx.strokeStyle = 'rgba(212,175,106,0.45)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(sx, sy, reach * 0.9, 0.3, 1.1); ctx.stroke();
        } else if (isThrust && fighter.stateTimer >= 3) {
          const ext = Math.min(1, (fighter.stateTimer - 3) / 7);
          const caneLen = w * (fighter.state === 'special' ? 1.3 : 1.0) * ext;
          const sx = frontFist.x, sy = frontFist.y;
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.1);
          ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(caneLen, 0); ctx.stroke();
          ctx.fillStyle = this.palette.accent;
          ctx.beginPath(); ctx.arc(caneLen, 0, 4, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          if (fighter.state === 'special') {
            ctx.strokeStyle = 'rgba(212,175,106,0.5)'; ctx.lineWidth = 1.5;
            for (let si = 0; si < 3; si++) { ctx.beginPath(); ctx.arc(sx, sy, caneLen * 0.5 + si * 10, -0.4, 0.4); ctx.stroke(); }
          }
        } else {
          ctx.save(); ctx.translate(cx + w * 0.16, torsoY + torsoH * 0.78); ctx.rotate(0.2);
          ctx.strokeStyle = '#1a120a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h * 0.30); ctx.stroke();
          ctx.fillStyle = this.palette.accent;
          ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });
    },
  },
  {
    id: 'kata', name: 'Kata', title: 'Die Immobilien-Haiin',
    palette: { skin: '#e2b48f', hair: '#4a3426', primary: '#1f2a4d', secondary: '#2a3760', accent: '#c9a227', outline: '#10141f' },
    stats: { speed: 2.1, jumpVel: -10.4, health: 100 },
    moves: {
      punch: { name: 'Schlüsselbund-Jab', anim: 'snapjab', dmg: 3, hits: 2, hitGap: 6, range: 116, total: 18, active: [4, 13], cooldown: 14, knockback: 2, fx: '#c9a227' },
      kick: { name: 'Besichtigungstermin', anim: 'overhead', dmg: 12, range: 150, total: 34, active: [13, 21], cooldown: 32, knockback: 6, groundBounce: true, fx: '#e74c3c' },
      fwd_punch: { name: 'Mieterhöhung', anim: 'dashpunch', dmg: 8, range: 128, total: 24, active: [7, 13], cooldown: 26, knockback: 5, meterDrain: 15, drainLabel: 'MIETERHÖHUNG!', fx: '#c9a227' },
      fwd_kick: { name: 'Zwangsräumung', anim: 'judogrip', type: 'grab', dmg: 12, range: 105, total: 28, active: [6, 13], cooldown: 32, knockback: 0, throwTotal: 26, throwDist: 3.4, fx: '#f2efe8' },
      special: { name: 'Abriss!', dmg: 25, range: 999, total: 40, active: [14, 16], type: 'projectile', projectile: 'wreckball', speed: 8 },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, hipY, frontFist, backFist }) => {
        // striped sweater peeking out of the open blazer
        drawStripes(ctx, cx - w * 0.11, torsoY + 2, w * 0.22, torsoH * 0.8, '#f2efe8', '#1f2a4d');
        ctx.fillStyle = '#1f2a4d';
        ctx.beginPath(); ctx.moveTo(cx - w * 0.13, torsoY); ctx.lineTo(cx - w * 0.02, torsoY + torsoH * 0.45); ctx.lineTo(cx - w * 0.13, torsoY + torsoH * 0.8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + w * 0.13, torsoY); ctx.lineTo(cx + w * 0.02, torsoY + torsoH * 0.45); ctx.lineTo(cx + w * 0.13, torsoY + torsoH * 0.8); ctx.fill();
        // gold blazer button + keys on the belt
        ctx.fillStyle = '#c9a227';
        ctx.beginPath(); ctx.arc(cx + w * 0.1, torsoY + torsoH * 0.62, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx - w * 0.2, hipY - 4, 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillRect(cx - w * 0.22, hipY, 2, 7); ctx.fillRect(cx - w * 0.18, hipY, 2, 6);
        drawLongHair(ctx, cx, headR, h * 0.27, '#4a3426', '#5e4433');
        // sunglasses pushed up into the hair
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - headR * 0.55, headR * 0.35, headR * 0.5, headR * 0.22);
        ctx.fillRect(cx + headR * 0.1, headR * 0.35, headR * 0.5, headR * 0.22);
        // red lips
        ctx.fillStyle = '#a8323e';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.32, headR * 1.6, headR * 0.2, headR * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        // "ZU VERKAUFEN" sign during the overhead slam
        if (fighter.state === 'kick') {
          ctx.save(); ctx.translate(frontFist.x, frontFist.y);
          ctx.strokeStyle = '#6b4b2a'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -34); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.fillRect(-2, -52, 46, 24);
          ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2; ctx.strokeRect(-2, -52, 46, 24);
          ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
          ctx.fillText('ZU', 21, -42); ctx.fillText('VERKAUFEN', 21, -33);
          ctx.restore();
        } else if (fighter.state === 'special') {
          // remote control for the crane
          ctx.fillStyle = '#333'; ctx.fillRect(frontFist.x - 4, frontFist.y - 10, 9, 14);
          ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(frontFist.x + 0.5, frontFist.y - 6, 2, 0, Math.PI * 2); ctx.fill();
        } else {
          // clipboard with listing
          ctx.fillStyle = '#8b5a2b'; ctx.fillRect(backFist.x - 7, backFist.y - 12, 14, 18);
          ctx.fillStyle = '#fff'; ctx.fillRect(backFist.x - 5, backFist.y - 9, 10, 13);
        }
      });
    },
  },
  {
    id: 'lisa', name: 'Lisa', title: 'Die Fahrlehrerin',
    palette: { skin: '#f0cfb4', hair: '#d8c08a', primary: '#ece8de', secondary: '#1f2a4d', accent: '#d7f02a', outline: '#14161f' },
    stats: { speed: 2.2, jumpVel: -10.6, health: 95 },
    moves: {
      punch: { name: 'Kellen-Stopp', anim: 'flashjab', dmg: 5, range: 125, total: 16, active: [4, 8], cooldown: 14, knockback: 3, faultPoint: true, fx: '#e74c3c' },
      kick: { name: 'Vollbremsung', anim: 'stomp', dmg: 11, range: 110, total: 30, active: [10, 18], cooldown: 30, knockback: 5, antiAir: true, knockdown: true, faultPoint: true, fx: '#d7f02a' },
      fwd_punch: { name: 'Schulterblick', anim: 'dashpunch', dmg: 7, range: 130, total: 24, active: [7, 13], cooldown: 26, knockback: 5, counterMult: 2.5, counterLabel: 'SCHULTERBLICK!', faultPoint: true, fx: '#ffffff' },
      fwd_kick: { name: 'Rückwärts einparken', anim: 'lowslide', dmg: 10, range: 150, total: 32, active: [11, 20], cooldown: 30, knockback: 6, lunge: 24, retreat: true, faultPoint: true, fx: '#d7f02a' },
      special: { name: 'Prüfungsfahrt', dmg: 17, range: 130, total: 36, active: [8, 18], knockback: 16, stun: 30, type: 'grab' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, frontFist }) => {
        drawStripes(ctx, w * 0.18 + 1, torsoY + 2, w * 0.64 - 2, torsoH - 4, null, '#1f2a4d');
        // hi-vis vest panels with reflective strip
        ctx.fillStyle = '#d7f02a';
        ctx.fillRect(w * 0.18, torsoY, w * 0.17, torsoH * 0.92);
        ctx.fillRect(w * 0.65, torsoY, w * 0.17, torsoH * 0.92);
        ctx.fillStyle = '#d9d9d9';
        ctx.fillRect(w * 0.18, torsoY + torsoH * 0.6, w * 0.17, 4);
        ctx.fillRect(w * 0.65, torsoY + torsoH * 0.6, w * 0.17, 4);
        // "L" learner plate on her back
        ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.19, torsoY + torsoH * 0.18, 13, 13);
        ctx.strokeStyle = '#1a4fd0'; ctx.lineWidth = 1.5; ctx.strokeRect(w * 0.19, torsoY + torsoH * 0.18, 13, 13);
        ctx.fillStyle = '#1a4fd0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('L', w * 0.19 + 6.5, torsoY + torsoH * 0.18 + 10);
        drawLongHair(ctx, cx, headR, h * 0.24, '#d8c08a', '#e8d6a6');
        ctx.fillStyle = '#c4566a';
        ctx.beginPath(); ctx.ellipse(cx + headR * 0.32, headR * 1.6, headR * 0.2, headR * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        // traffic paddle (Kelle)
        ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(frontFist.x, frontFist.y + 4); ctx.lineTo(frontFist.x + 4, frontFist.y - 14); ctx.stroke();
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(frontFist.x + 5, frontFist.y - 21, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(frontFist.x + 5, frontFist.y - 21, 4.5, 0, Math.PI * 2); ctx.fill();
      });
    },
  },
  {
    id: 'niklas', name: 'Niklas', title: 'Der Lokführer',
    palette: { skin: '#f1c9a8', hair: '#8a4b26', primary: '#f2f2f2', secondary: '#2b2f3a', accent: '#e2001a', outline: '#14161c' },
    stats: { speed: 2.0, jumpVel: -10.5, health: 100 },
    moves: {
      punch: { name: 'Fahrkartenkontrolle', anim: 'snapjab', dmg: 5, range: 118, total: 18, active: [4, 9], cooldown: 15, knockback: 3, noJump: 120, fx: '#e2001a' },
      kick: { name: 'Schranke runter!', anim: 'axekick', dmg: 9, range: 125, total: 30, active: [10, 18], cooldown: 70, knockback: 6, spawnBarrier: true, fx: '#e2001a' },
      fwd_punch: { name: 'Rotes Signal', anim: 'dashpunch', dmg: 7, range: 128, total: 24, active: [7, 13], cooldown: 40, knockback: 2, root: 90, fx: '#ff2a2a' },
      fwd_kick: { name: 'Gleis verlegen', anim: 'lowslide', dmg: 0, range: 0, total: 28, active: [10, 12], cooldown: 90, knockback: 0, spawnRail: true, fx: '#8a8a8a' },
      special: { name: 'Bahnübergang', dmg: 30, range: 0, total: 30, active: [8, 10], type: 'crossing' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, frontFist }) => {
        // black shirt under the open track jacket, blue shoulder panels, zipper
        ctx.fillStyle = '#16161a';
        ctx.beginPath(); ctx.moveTo(cx - w * 0.1, torsoY); ctx.lineTo(cx + w * 0.1, torsoY); ctx.lineTo(cx + w * 0.03, torsoY + torsoH * 0.55); ctx.lineTo(cx - w * 0.03, torsoY + torsoH * 0.55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1d5fbf';
        ctx.fillRect(w * 0.18, torsoY, w * 0.18, torsoH * 0.16);
        ctx.fillRect(w * 0.64, torsoY, w * 0.18, torsoH * 0.16);
        ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, torsoY + torsoH * 0.55); ctx.lineTo(cx, torsoY + torsoH); ctx.stroke();
        // messy auburn fringe
        ctx.fillStyle = '#8a4b26';
        for (let i = -2; i <= 2; i++) {
          const bx = cx + i * headR * 0.36;
          ctx.beginPath(); ctx.moveTo(bx - headR * 0.22, headR * 0.7);
          ctx.lineTo(bx + headR * (0.1 + (i & 1) * 0.12), headR * (1.05 + (i & 1) * 0.12));
          ctx.lineTo(bx + headR * 0.24, headR * 0.7); ctx.closePath(); ctx.fill();
        }
        // headphones: band, ear cup, cable
        ctx.strokeStyle = '#141414'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(cx, headR + 2, headR * 1.12, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
        ctx.fillStyle = '#141414';
        ctx.beginPath(); ctx.ellipse(cx - headR * 0.25, headR * 1.3, headR * 0.32, headR * 0.45, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#141414'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.25, headR * 1.7); ctx.quadraticCurveTo(cx - w * 0.05, torsoY + torsoH * 0.3, cx + w * 0.02, torsoY + torsoH * 0.7); ctx.stroke();
        // rectangular dark glasses
        ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 1.6;
        ctx.strokeRect(cx + headR * 0.14, headR * 0.86, headR * 0.66, headR * 0.4);
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.14, headR * 1.0); ctx.lineTo(cx - headR * 0.05, headR * 1.05); ctx.stroke();
        // props
        if (fighter.state === 'punch') {
          // ticket punch
          ctx.fillStyle = '#9aa0a6'; ctx.fillRect(frontFist.x - 2, frontFist.y - 4, 14, 5);
          ctx.fillRect(frontFist.x - 2, frontFist.y + 2, 14, 3);
        } else if (fighter.state === 'fwd_punch') {
          // red signal lamp
          ctx.fillStyle = '#222'; ctx.fillRect(frontFist.x - 6, frontFist.y - 18, 13, 18);
          ctx.fillStyle = '#ff2a2a'; ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(frontFist.x + 0.5, frontFist.y - 9, 5, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else if (fighter.state === 'special') {
          // signal paddle raised: green disc = "Abfahrt"
          ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(frontFist.x, frontFist.y); ctx.lineTo(frontFist.x + 3, frontFist.y - 16); ctx.stroke();
          ctx.fillStyle = '#1aa34a'; ctx.beginPath(); ctx.arc(frontFist.x + 4, frontFist.y - 23, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(frontFist.x + 4, frontFist.y - 23, 3.5, 0, Math.PI * 2); ctx.fill();
        }
      });
    },
  },
  {
    id: 'ben', name: 'Ben', title: 'Der Millionärssohn',
    palette: { skin: '#f0c8a8', hair: '#d9b45a', primary: '#f4f4f2', secondary: '#2a2a2e', accent: '#d4af37', outline: '#16161a' },
    stats: { speed: 2.1, jumpVel: -10.6, health: 95 },
    moves: {
      punch: { name: 'Scheinklatsche', anim: 'slap', dmg: 4, hits: 2, hitGap: 6, range: 110, total: 20, active: [5, 14], cooldown: 14, knockback: 2, fx: '#3fae5a' },
      kick: { name: 'Leibwächter', anim: 'snapjab', dmg: 0, range: 0, total: 22, active: [8, 10], cooldown: 120, knockback: 0, spawn: 'bodyguard', cost: 300, fx: '#111' },
      fwd_punch: { name: 'Bestechung', anim: 'flashjab', dmg: 0, range: 0, total: 22, active: [7, 9], cooldown: 80, knockback: 0, spawn: 'bribe', cost: 200, fx: '#3fae5a' },
      fwd_kick: { name: 'Goldene Kreditkarte', anim: 'snapjab', dmg: 0, range: 0, total: 24, active: [8, 10], cooldown: 60, knockback: 0, spawn: 'card', fx: '#d4af37' },
      special: { name: 'Geldregen', dmg: 8, range: 0, total: 30, active: [8, 10], type: 'moneyrain' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, hipY, frontFist, backFist }) => {
        // pink chest print
        ctx.fillStyle = '#f2b8c6'; ctx.fillRect(cx + w * 0.02, torsoY + torsoH * 0.18, w * 0.16, torsoH * 0.22);
        ctx.fillStyle = '#b05a78'; ctx.fillRect(cx + w * 0.05, torsoY + torsoH * 0.22, w * 0.1, torsoH * 0.08);
        // gold chain
        ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.11, torsoY + 1); ctx.quadraticCurveTo(cx, torsoY + h * 0.08, cx + w * 0.11, torsoY + 1); ctx.stroke();
        // brown belt with gold buckle, cash bundle in the pocket
        ctx.fillStyle = '#7a4a22'; ctx.fillRect(w * 0.18, hipY - 6, w * 0.64, 6);
        ctx.fillStyle = '#d4af37'; ctx.fillRect(cx - 4, hipY - 7, 8, 8);
        ctx.fillStyle = '#3fae5a'; ctx.fillRect(cx + w * 0.16, hipY + 2, 8, 10);
        // styled-up blonde quiff
        ctx.fillStyle = '#d9b45a';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.arc(cx + i * headR * 0.38, headR * (0.2 + Math.abs(i) * 0.12), headR * 0.36, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#ecd08a';
        ctx.beginPath(); ctx.arc(cx + headR * 0.2, headR * 0.05, headR * 0.22, 0, Math.PI * 2); ctx.fill();
        // gold watch
        ctx.fillStyle = '#d4af37'; ctx.fillRect(backFist.x - 5, backFist.y - 7, 10, 4);
        if (fighter.state === 'punch' || fighter.state === 'fwd_punch') {
          // cash bundle / banknote in hand
          ctx.fillStyle = '#3fae5a'; ctx.fillRect(frontFist.x - 4, frontFist.y - 12, 16, 9);
          ctx.fillStyle = '#d4af37'; ctx.fillRect(frontFist.x + 2, frontFist.y - 12, 3, 9);
        } else if (fighter.state === 'special' || fighter.state === 'kick') {
          // phone: calling the heli / the bodyguard
          ctx.fillStyle = '#111'; ctx.fillRect(frontFist.x - 3, frontFist.y - 14, 8, 14);
          ctx.fillStyle = '#4fc3f7'; ctx.fillRect(frontFist.x - 2, frontFist.y - 12, 6, 9);
        }
      });
    },
  },
  {
    id: 'felix', name: 'Felix', title: 'Der Analog-Fotograf',
    palette: { skin: '#eac3a3', hair: '#3b2418', primary: '#4a4232', secondary: '#9cb8d4', accent: '#c0c0c8', outline: '#15130f' },
    stats: { speed: 2.1, jumpVel: -10.6, health: 95 },
    moves: {
      punch: { name: 'Stativ-Stoß', anim: 'lungethrust', dmg: 6, range: 165, total: 22, active: [6, 12], cooldown: 16, knockback: 4, fx: '#c0c0c8' },
      kick: { name: 'Selbstauslöser', anim: 'snapjab', dmg: 0, range: 0, total: 22, active: [8, 10], cooldown: 120, knockback: 0, spawn: 'selftimer', film: 1, fx: '#fff' },
      fwd_punch: { name: 'Negativ', anim: 'flashjab', dmg: 6, range: 125, total: 22, active: [6, 11], cooldown: 50, knockback: 3, invert: 150, film: 1, fx: '#ffffff' },
      fwd_kick: { name: 'Polaroid-Fächer', anim: 'snapjab', dmg: 0, range: 0, total: 22, active: [8, 10], cooldown: 70, knockback: 0, spawn: 'polaroids', film: 1, fx: '#fff' },
      special: { name: 'Doppelbelichtung', dmg: 0, range: 0, total: 24, active: [8, 10], type: 'clone', duration: 360 },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, torsoH, frontFist, backFist }) => {
        // ribbed knit: vertical ribs
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
        for (let rx = w * 0.22; rx < w * 0.8; rx += 4) { ctx.beginPath(); ctx.moveTo(rx, torsoY + 3); ctx.lineTo(rx, torsoY + torsoH - 3); ctx.stroke(); }
        // camera strap + analog camera on the chest
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.14, torsoY); ctx.lineTo(cx, torsoY + torsoH * 0.42); ctx.lineTo(cx + w * 0.14, torsoY); ctx.stroke();
        if (fighter.state !== 'fwd_punch' && fighter.state !== 'kick') {
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx - 9, torsoY + torsoH * 0.38, 18, 11);
          ctx.fillStyle = '#c0c0c8'; ctx.fillRect(cx - 9, torsoY + torsoH * 0.38, 18, 3);
          ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(cx + 2, torsoY + torsoH * 0.38 + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        // wolf cut: voluminous shaggy crown, choppy layered sides, longer mullet-ish back
        ctx.fillStyle = '#3b2418';
        ctx.beginPath(); ctx.arc(cx - headR * 0.05, headR * 0.75, headR * 1.18, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
        // jagged layers down the back to the neck
        ctx.beginPath();
        ctx.moveTo(cx - headR * 0.2, headR * 0.3);
        ctx.lineTo(cx - headR * 1.25, headR * 0.9);
        ctx.lineTo(cx - headR * 1.05, headR * 1.35); ctx.lineTo(cx - headR * 1.3, headR * 1.7);
        ctx.lineTo(cx - headR * 1.0, headR * 2.0); ctx.lineTo(cx - headR * 1.2, headR * 2.45);
        ctx.lineTo(cx - headR * 0.75, headR * 2.35); ctx.lineTo(cx - headR * 0.55, headR * 1.3);
        ctx.closePath(); ctx.fill();
        // choppy side layer in front of the ear
        ctx.beginPath();
        ctx.moveTo(cx + headR * 0.55, headR * 0.6); ctx.lineTo(cx + headR * 1.05, headR * 1.0);
        ctx.lineTo(cx + headR * 0.85, headR * 1.25); ctx.lineTo(cx + headR * 1.0, headR * 1.6);
        ctx.lineTo(cx + headR * 0.72, headR * 1.45); ctx.lineTo(cx + headR * 0.7, headR * 0.9);
        ctx.closePath(); ctx.fill();
        // curtain-bang spikes over the forehead
        for (let i = -1; i <= 2; i++) {
          const bx = cx + i * headR * 0.36;
          ctx.beginPath(); ctx.moveTo(bx - headR * 0.24, headR * 0.55);
          ctx.lineTo(bx + headR * 0.02, headR * (0.98 + (i & 1) * 0.14));
          ctx.lineTo(bx + headR * 0.22, headR * 0.55); ctx.closePath(); ctx.fill();
        }
        // spiky top texture
        for (let i = -3; i <= 3; i++) {
          const tx = cx + i * headR * 0.3;
          ctx.beginPath(); ctx.moveTo(tx - headR * 0.16, -headR * 0.15 + Math.abs(i) * headR * 0.08);
          ctx.lineTo(tx + headR * 0.05, -headR * 0.42 + Math.abs(i) * headR * 0.12);
          ctx.lineTo(tx + headR * 0.18, -headR * 0.1 + Math.abs(i) * headR * 0.08); ctx.closePath(); ctx.fill();
        }
        ctx.strokeStyle = '#5a3a26'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.9, headR * 1.0); ctx.lineTo(cx - headR * 1.0, headR * 1.9); ctx.stroke();
        // thin moustache
        ctx.strokeStyle = '#3b2418'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.15, headR * 1.48); ctx.quadraticCurveTo(cx + headR * 0.38, headR * 1.4, cx + headR * 0.62, headR * 1.5); ctx.stroke();
        // silver rings
        ctx.fillStyle = '#c0c0c8'; ctx.fillRect(backFist.x - 2, backFist.y - 1, 4, 2);
        // props
        if (fighter.state === 'punch') {
          ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(frontFist.x - 18, frontFist.y + 2); ctx.lineTo(frontFist.x + 34, frontFist.y - 2); ctx.stroke();
          ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(frontFist.x + 34, frontFist.y - 2); ctx.lineTo(frontFist.x + 40, frontFist.y - 6); ctx.moveTo(frontFist.x + 34, frontFist.y - 2); ctx.lineTo(frontFist.x + 40, frontFist.y + 3); ctx.stroke();
        } else if (fighter.state === 'fwd_punch' || fighter.state === 'kick' || fighter.state === 'special') {
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(frontFist.x - 8, frontFist.y - 14, 20, 13);
          ctx.fillStyle = '#c0c0c8'; ctx.fillRect(frontFist.x - 8, frontFist.y - 14, 20, 3);
          ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(frontFist.x + 6, frontFist.y - 7, 4, 0, Math.PI * 2); ctx.fill();
        } else if (fighter.state === 'fwd_kick') {
          ctx.fillStyle = '#f7f7f2';
          for (let k = 0; k < 3; k++) { ctx.fillRect(frontFist.x - 4 + k * 3, frontFist.y - 14 + k * 2, 12, 14); }
        }
      });
    },
  },
  {
    id: 'bin', name: 'Bin', title: 'Die Wild Card',
    palette: { skin: '#ecc9a6', hair: '#6b3a24', primary: '#151517', secondary: '#2b2b33', accent: '#e6e6e6', outline: '#0c0c0e' },
    stats: { speed: 2.15, jumpVel: -10.6, health: 95 },
    moves: {
      punch: { name: 'Augenrollen', anim: 'slap', dmg: 5, dmgRand: [1, 10], range: 112, total: 18, active: [5, 10], cooldown: 14, knockback: 3, fx: '#e6e6e6' },
      kick: { name: 'Irgendwas rollen', anim: 'snapjab', dmg: 0, range: 0, total: 22, active: [8, 10], cooldown: 70, knockback: 0, spawn: 'roller', fx: '#e6e6e6' },
      fwd_punch: { name: 'Copy-Paste', anim: 'dashpunch', dmg: 7, range: 128, total: 24, active: [7, 13], cooldown: 30, knockback: 5, copy: true, fx: '#e6e6e6' },
      fwd_kick: { name: 'Glitch', anim: 'snapjab', dmg: 0, range: 0, total: 16, active: [4, 6], cooldown: 60, knockback: 0, glitch: true, fx: '#ff00ff' },
      special: { name: 'WILD CARD', dmg: 25, range: 220, total: 36, active: [8, 18], knockback: 16, stun: 30, type: 'grab' },
    },
    draw(ctx, fighter, w, h) {
      drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, h, cx, headR, torsoY, frontFist, backFist }) => {
        // thin black straps
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - w * 0.12, torsoY); ctx.lineTo(cx - w * 0.1, torsoY - 4); ctx.moveTo(cx + w * 0.12, torsoY); ctx.lineTo(cx + w * 0.1, torsoY - 4); ctx.stroke();
        drawLongHair(ctx, cx, headR, h * 0.25, '#6b3a24', '#8a4e30');
        // blunt fringe
        ctx.fillStyle = '#6b3a24';
        ctx.beginPath(); ctx.moveTo(cx - headR * 0.85, headR * 0.5); ctx.lineTo(cx + headR * 0.9, headR * 0.5);
        ctx.lineTo(cx + headR * 0.85, headR * 0.84); ctx.lineTo(cx - headR * 0.6, headR * 0.8); ctx.closePath(); ctx.fill();
        // half-closed, deeply unimpressed eyelid
        ctx.fillStyle = '#ecc9a6';
        ctx.fillRect(cx + headR * 0.15, headR * 0.82, headR * 0.6, headR * 0.24);
        ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.18, headR * 1.06); ctx.lineTo(cx + headR * 0.74, headR * 1.06); ctx.stroke();
        // flat mouth
        ctx.strokeStyle = '#9a5a50'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx + headR * 0.2, headR * 1.62); ctx.lineTo(cx + headR * 0.5, headR * 1.62); ctx.stroke();
        // joker card
        const hand = fighter.state === 'special' || fighter.state === 'win' ? frontFist : backFist;
        ctx.save(); ctx.translate(hand.x, hand.y - 6); ctx.rotate(-0.25);
        ctx.fillStyle = '#fff'; ctx.fillRect(-6, -9, 12, 17);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(-6, -9, 12, 17);
        ctx.fillStyle = '#d0021b'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('J', 0, 3);
        ctx.restore();
      });
    },
  },
];

function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation || 0);
  if (p.type === 'laptop') {
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-14, -3, 28, 6);
    ctx.fillStyle = '#3498db'; ctx.fillRect(-12, -14, 24, 11);
    ctx.strokeStyle = '#bdc3c7'; ctx.strokeRect(-12, -14, 24, 11);
  } else if (p.type === 'roller') {
    const r = p.r;
    if (p.kind === 'tonne') {
      ctx.rotate(-(p.rotation || 0));
      ctx.rotate(p.rotation * 0.5);
      ctx.fillStyle = '#5f6b73'; ctx.fillRect(-r, -r * 0.8, r * 2, r * 1.6);
      ctx.fillStyle = '#48535a'; for (let k = -1; k <= 1; k++) ctx.fillRect(-r, k * r * 0.45 - 2, r * 2, 4);
      ctx.fillStyle = '#2f373c'; ctx.fillRect(-r - 3, -r * 0.85, r * 2 + 6, 5);
    } else if (p.kind === 'kuehlschrank') {
      ctx.rotate(-(p.rotation || 0) + Math.sin(p.rotation) * 0.15);
      ctx.fillStyle = '#e9edf0'; ctx.fillRect(-r * 0.75, -r, r * 1.5, r * 2);
      ctx.strokeStyle = '#9aa4ab'; ctx.lineWidth = 2; ctx.strokeRect(-r * 0.75, -r, r * 1.5, r * 2);
      ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.25); ctx.lineTo(r * 0.75, -r * 0.25); ctx.stroke();
      ctx.fillStyle = '#9aa4ab'; ctx.fillRect(r * 0.45, -r * 0.8, 3, 10); ctx.fillRect(r * 0.45, 0, 3, 14);
    } else {
      ctx.fillStyle = p.kind === 'bowling' ? '#1b2a6b' : '#2f8a3a';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      if (p.kind === 'bowling') { ctx.fillStyle = '#000'; [[-4, -5], [3, -6], [0, 1]].forEach(function (d) { ctx.beginPath(); ctx.arc(d[0], d[1], 2.2, 0, Math.PI * 2); ctx.fill(); }); }
      else { ctx.strokeStyle = '#1d5e26'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * r * 0.3, 0, r * 0.12, r * 0.95, 0, 0, Math.PI * 2); ctx.stroke(); } }
    }
  } else if (p.type === 'polaroid') {
    ctx.rotate(-(p.rotation || 0) + Math.sin(p.rotation * 2) * 0.3);
    ctx.fillStyle = '#f7f7f2'; ctx.fillRect(-11, -12, 22, 25);
    ctx.fillStyle = '#3d4b5c'; ctx.fillRect(-8, -9, 16, 15);
    ctx.fillStyle = '#e8c39a'; ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === 'bribe') {
    ctx.rotate(Math.sin(p.rotation) * 0.4 - p.rotation);
    ctx.fillStyle = '#b48ad8'; ctx.fillRect(-16, -8, 32, 16);
    ctx.strokeStyle = '#6d4a91'; ctx.lineWidth = 1.5; ctx.strokeRect(-16, -8, 32, 16);
    ctx.fillStyle = '#3d2457'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('500€', 0, 3);
  } else if (p.type === 'card') {
    ctx.fillStyle = '#d4af37'; ctx.fillRect(-14, -9, 28, 18);
    ctx.fillStyle = '#8a6d1a'; ctx.fillRect(-14, -4, 28, 3);
    ctx.fillStyle = '#fff3c4'; ctx.fillRect(-10, 3, 6, 4);
  } else if (p.type === 'wreckball') {
    ctx.rotate(-(p.rotation || 0));
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, -p.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2b2b2f'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(-8, -9, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a227'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('ABRISS', 0, 4);
  } else if (p.type === 'shockwave') {
    const colors = ['#ff2d95', '#e8c547', '#00e6c3', '#3b5998', '#9b59b6'];
    const dir = p.vx >= 0 ? 1 : -1;
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath(); ctx.ellipse(-i * 9 * dir, -90 - i * 3, 22 - i * 2, 95 - i * 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -90, 22, 95, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (p.type === 'toast') {
    ctx.fillStyle = '#cd853f'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e6b35c'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cd853f'; ctx.beginPath(); ctx.arc(9, -8, 6, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === 'tremor') {
    // low ground ripple: cracked earth ridges rolling forward
    ctx.rotate(-(p.rotation || 0));
    const dir = p.vx >= 0 ? 1 : -1;
    ctx.strokeStyle = '#b0a48c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-i * 8 * dir, -2, 12 - i * 3, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(176,164,140,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -4, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'flash') {
    ctx.rotate(-(p.rotation || 0));
    ctx.fillStyle = 'rgba(255,247,200,0.35)';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7cc';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (p.rotation || 0);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11);
      ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Ben's hired muscle: not selectable, drawn by the stage-object system
const BODYGUARD = {
  id: 'bodyguard', name: 'Leibwächter',
  palette: { skin: '#d9a77c', hair: '#1a1a1a', primary: '#16161a', secondary: '#16161a', outline: '#000' },
  moves: { punch: { anim: 'jab', dmg: 0, range: 0, total: 20, active: [6, 10] } },
  draw(ctx, fighter, w, h) {
    drawHumanoid(ctx, w, h, fighter, this.palette, ({ w, cx, headR, torsoY, torsoH }) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(cx - w * 0.06, torsoY); ctx.lineTo(cx + w * 0.06, torsoY); ctx.lineTo(cx, torsoY + torsoH * 0.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#16161a'; ctx.fillRect(cx - 1.5, torsoY + 4, 3, torsoH * 0.3);
      ctx.fillStyle = '#000'; ctx.fillRect(cx + headR * 0.05, headR * 0.88, headR * 0.85, headR * 0.3);
    });
  },
};

window.SF = { FIGHTER_WIDTH, FIGHTER_HEIGHT, CHARACTERS, drawProjectile, BODYGUARD };
})();
