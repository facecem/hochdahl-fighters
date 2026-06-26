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
  if (state === 'idle') bob = Math.sin(t * 0.07) * 2.2;
  if (state === 'walk') {
    bob = Math.abs(Math.sin(t * 0.18)) * 3;
    legSwing = Math.sin(t * 0.18) * 11;
    armSwing = Math.sin(t * 0.18) * 6;
  }
  if (isWin) bob = -Math.abs(Math.sin(t * 0.2)) * 10;

  ctx.save();

  ctx.translate(0, bob);

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
    // forward body lean for committed attacks
    var lean = 0.04;
    if (atkAnim === 'overhead' || atkAnim === 'axekick') lean = -0.03;
    else if (atkAnim === 'uppercut') lean = -0.05;
    else if (atkAnim === 'dashpunch' || atkAnim === 'dashkick') lean = 0.08;
    ctx.transform(1, 0, lean, 1, 0, 0);
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
  if (isLegAtk) {
    const st = fighter.stateTimer;
    if (airborne) {
      const ext = Math.min(st * 3.0, w * 0.62);
      frontFoot = { x: cx + w * 0.25 + ext, y: hipY + h * 0.20 + ext * 0.4 };
      backFoot = { x: cx - w * 0.14, y: h * 0.76 };
    } else if (atkAnim === 'spinkick') {
      const ang = Math.min(st * 0.17, Math.PI * 1.05) - 0.35;
      frontFoot = { x: cx + Math.cos(ang) * w * 0.74, y: hipY + h * 0.04 + Math.sin(ang) * h * 0.20 };
      backFoot = { x: cx - w * 0.16, y: footY };
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
    } else if (atkAnim === 'sweep') {
      const ext = Math.min(st * 4.0, w * 0.78);
      frontFoot = { x: cx + w * 0.20 + ext, y: h - h * 0.015 };
      backFoot = { x: cx - w * 0.18, y: footY };
    } else if (atkAnim === 'knee') {
      const pr = Math.min(1, st / 6);
      frontFoot = { x: cx + w * 0.16 + pr * w * 0.08, y: hipY + h * 0.06 - pr * h * 0.04 };
      backFoot = { x: cx - w * 0.16, y: footY };
    } else if (atkAnim === 'dashkick') {
      const ext = Math.min(st * 4.2, w * 0.92);
      frontFoot = { x: cx + w * 0.25 + ext, y: hipY + h * 0.10 };
      backFoot = { x: cx - w * 0.22, y: footY };
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
  let frontFist = { x: cx + w * 0.30, y: shoulderY + h * 0.02 };
  let backFist = { x: cx + w * 0.10, y: shoulderY + h * 0.08 };
  if (state === 'walk') {
    frontFist.y += armSwing * 0.5;
    backFist.y -= armSwing * 0.5;
  }
  if (isArmAtk) {
    const st = fighter.stateTimer;
    if (atkAnim === 'jab') {
      const ext = Math.min(st * 6.0, w * 0.50);
      frontFist = { x: cx + w * 0.28 + ext, y: shoulderY + h * 0.02 };
      backFist = { x: cx + w * 0.06, y: shoulderY + h * 0.07 };
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

  if (isKick && fighter.stateTimer > 4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.2, frontFoot.y - 8 + i * 6);
      ctx.lineTo(frontFoot.x - 6, frontFoot.y - 8 + i * 6);
      ctx.stroke();
    }
  }

  if (isFwdKick && fighter.stateTimer > 3) {
    ctx.strokeStyle = 'rgba(255,200,100,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.2, frontFoot.y - 6 + i * 6);
      ctx.lineTo(frontFoot.x - 4, frontFoot.y - 6 + i * 6);
      ctx.stroke();
    }
  }

  if (isFwdPunch && fighter.stateTimer > 3) {
    ctx.strokeStyle = 'rgba(255,180,80,0.6)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.25, frontFist.y - 6 + i * 6);
      ctx.lineTo(frontFist.x - 4, frontFist.y - 6 + i * 6);
      ctx.stroke();
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
      punch: { name: 'Konter-Jab', anim: 'jab', dmg: 5, range: 115, total: 16, active: [4, 8], cooldown: 14, knockback: 3, fx: '#f2ede1' },
      kick: { name: 'Clinch-Tritt', anim: 'straightkick', dmg: 13, range: 140, total: 34, active: [12, 18], cooldown: 30, knockback: 4, pullIn: true, fx: '#c0392b' },
      fwd_punch: { name: 'Schulter-Wucht', anim: 'dashpunch', dmg: 11, range: 150, total: 28, active: [10, 16], cooldown: 30, knockback: 9, adv: 9, lunge: 22, fx: '#e3dccb' },
      fwd_kick: { name: 'Bein-Feger', anim: 'sweep', dmg: 12, range: 160, total: 34, active: [12, 20], cooldown: 32, knockback: 5, knockdown: true, stun: 24, fx: '#caa07a' },
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
      punch: { name: 'Jab', anim: 'jab', dmg: 5, range: 118, total: 16, active: [4, 8], cooldown: 14, knockback: 3, fx: '#ffffff' },
      kick: { name: 'Wirbel-Tritt', anim: 'spinkick', dmg: 7, hits: 2, hitGap: 7, range: 150, total: 38, active: [12, 26], cooldown: 34, knockback: 8, fx: '#d4b84a' },
      fwd_punch: { name: 'Schädel-Hammer', anim: 'overhead', dmg: 13, range: 135, total: 32, active: [14, 22], cooldown: 32, knockback: 6, knockdown: true, stun: 22, fx: '#ffffff' },
      fwd_kick: { name: 'Slide-Kick', anim: 'dashkick', dmg: 11, range: 165, total: 32, active: [11, 20], cooldown: 30, knockback: 9, adv: 10, lunge: 24, fx: '#d4b84a' },
      special: { name: 'Laptop-Wurf', dmg: 14, range: 999, total: 30, active: [10, 12], cooldown: 360, type: 'projectile', projectile: 'laptop', speed: 9 },
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
      });
    },
  },
  {
    id: 'tonie', name: 'Tonie', title: 'Das kreative Chaos',
    palette: { skin: '#d9b08c', hair: '#5c3a1e', primary: '#1a1a24', secondary: '#3b5998', accent: '#e8c547', outline: '#0a0a12' },
    stats: { speed: 2.2, jumpVel: -10.8, health: 95 },
    moves: {
      punch: { name: 'Doppel-Pinsel', anim: 'jab', dmg: 4, hits: 2, hitGap: 6, range: 120, total: 20, active: [4, 12], cooldown: 16, knockback: 3, fx: '#ff2d95' },
      kick: { name: 'Axt-Tritt', anim: 'axekick', dmg: 12, range: 150, total: 36, active: [14, 22], cooldown: 34, knockback: 5, groundBounce: true, fx: '#00e6c3' },
      fwd_punch: { name: 'Farb-Upper', anim: 'uppercut', dmg: 9, range: 122, total: 26, active: [6, 14], cooldown: 28, knockback: 5, launcher: true, fx: '#ff2d95' },
      fwd_kick: { name: 'Wirbel-Kick', anim: 'spinkick', dmg: 11, range: 152, total: 34, active: [12, 24], cooldown: 30, knockback: 8, fx: '#9b59b6' },
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
      punch: { name: 'Toast-Schlag', anim: 'straight', dmg: 7, range: 125, total: 20, active: [6, 11], cooldown: 18, knockback: 4, fx: '#e6b35c' },
      kick: { name: 'Stampf-Tritt', anim: 'axekick', dmg: 14, range: 145, total: 40, active: [16, 24], cooldown: 38, knockback: 6, groundBounce: true, fx: '#e6b35c' },
      fwd_punch: { name: 'Toast-Hammer', anim: 'overhead', dmg: 14, range: 142, total: 34, active: [14, 22], cooldown: 34, knockback: 8, knockdown: true, stun: 24, fx: '#ffffff' },
      fwd_kick: { name: 'Schlaf-Feger', anim: 'sweep', dmg: 12, range: 155, total: 36, active: [13, 22], cooldown: 32, knockback: 5, knockdown: true, stun: 22, fx: '#e6b35c' },
      special: { name: 'Toast-Wurf', dmg: 13, range: 999, total: 32, active: [12, 14], cooldown: 360, type: 'projectile', projectile: 'toast', speed: 7.5 },
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
      punch: { name: 'Schnalle', anim: 'jab', dmg: 5, range: 118, total: 15, active: [4, 8], cooldown: 13, knockback: 3, fx: '#8c2340' },
      kick: { name: 'Style-Wirbel', anim: 'spinkick', dmg: 12, range: 150, total: 34, active: [12, 22], cooldown: 32, knockback: 9, fx: '#8c2340' },
      fwd_punch: { name: 'Ketten-Upper', anim: 'uppercut', dmg: 9, range: 122, total: 26, active: [6, 14], cooldown: 28, knockback: 6, launcher: true, fx: '#3a3545' },
      fwd_kick: { name: 'Stiefel-Stoß', anim: 'dashkick', dmg: 11, range: 165, total: 32, active: [11, 20], cooldown: 30, knockback: 9, adv: 10, lunge: 24, fx: '#8c2340' },
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
        // Sword
        if (fighter.state === 'special' && fighter.stateTimer >= 6) {
          var ext = Math.min(1, (fighter.stateTimer - 6) / 6);
          var swordLen = w * 1.6 * ext;
          var sx = frontFist.x, sy = frontFist.y;
          ctx.fillStyle = '#d0d0d8';
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.15);
          ctx.fillRect(0, -3, swordLen, 6);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(0, -3, swordLen, 2);
          ctx.beginPath(); ctx.moveTo(swordLen, -4); ctx.lineTo(swordLen + 10, 0);
          ctx.lineTo(swordLen, 4); ctx.closePath(); ctx.fillStyle = '#c0c0c8'; ctx.fill();
          ctx.fillStyle = '#c0b283'; ctx.fillRect(-4, -8, 8, 16);
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
          for (var si = 0; si < 3; si++) {
            ctx.beginPath(); ctx.arc(sx, sy, swordLen * 0.5 + si * 12, -0.4, 0.3); ctx.stroke();
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
];

function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation || 0);
  if (p.type === 'laptop') {
    ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-14, -3, 28, 6);
    ctx.fillStyle = '#3498db'; ctx.fillRect(-12, -14, 24, 11);
    ctx.strokeStyle = '#bdc3c7'; ctx.strokeRect(-12, -14, 24, 11);
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
  }
  ctx.restore();
}

window.SF = { FIGHTER_WIDTH, FIGHTER_HEIGHT, CHARACTERS, drawProjectile };
})();
