(function () {
const { CHARACTERS, FIGHTER_WIDTH, FIGHTER_HEIGHT, drawProjectile } = window.SF;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

const FLOOR_Y = 640;
const GROUND_Y = FLOOR_Y - FIGHTER_HEIGHT;
const GRAVITY = 0.55;

const PARRY_ACTIVE = 20;
const PARRY_TOTAL = 36;
const PARRY_COOLDOWN = 50;
const PARRY_STUN = 120;
const WHIFF_STUN = 14;

const METER_MAX = 100;
const METER_GAIN_ATTACKER = 2.2;
const METER_GAIN_DEFENDER = 1.4;
const METER_GAIN_PARRY = 22;

const ATTACK_STATES = ['punch', 'kick', 'fwd_punch', 'fwd_kick', 'special'];

const P1_CONTROLS = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyF', kick: 'KeyG', special: 'KeyH' };
const P2_CONTROLS = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyK', kick: 'KeyL', special: 'Semicolon' };

// --- Audio ---
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(kind) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  switch (kind) {
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.12);
      gain.gain.setValueAtTime(0.25, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      osc.start(t0); osc.stop(t0 + 0.15);
      break;
    case 'parry':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t0);
      osc.frequency.exponentialRampToValueAtTime(1400, t0 + 0.06);
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.start(t0); osc.stop(t0 + 0.18);
      break;
    case 'jump':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(440, t0 + 0.12);
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
      osc.start(t0); osc.stop(t0 + 0.14);
      break;
    case 'special':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(500, t0 + 0.25);
      gain.gain.setValueAtTime(0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.start(t0); osc.stop(t0 + 0.3);
      break;
    case 'ko':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.6);
      gain.gain.setValueAtTime(0.3, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.65);
      osc.start(t0); osc.stop(t0 + 0.65);
      break;
    case 'select':
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, t0);
      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
      osc.start(t0); osc.stop(t0 + 0.06);
      break;
    case 'confirm':
      osc.type = 'square';
      osc.frequency.setValueAtTime(392, t0);
      osc.frequency.setValueAtTime(523, t0 + 0.08);
      osc.frequency.setValueAtTime(659, t0 + 0.16);
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      osc.start(t0); osc.stop(t0 + 0.3);
      break;
    case 'fight':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t0);
      osc.frequency.exponentialRampToValueAtTime(640, t0 + 0.18);
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.start(t0); osc.stop(t0 + 0.35);
      break;
    case 'airhit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t0);
      osc.frequency.exponentialRampToValueAtTime(100, t0 + 0.10);
      gain.gain.setValueAtTime(0.20, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      osc.start(t0); osc.stop(t0 + 0.12);
      break;
    case 'rewind':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t0);
      osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.35);
      osc.frequency.exponentialRampToValueAtTime(200, t0 + 0.5);
      gain.gain.setValueAtTime(0.2, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      osc.start(t0); osc.stop(t0 + 0.55);
      break;
    case 'uppercut':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t0);
      osc.frequency.exponentialRampToValueAtTime(600, t0 + 0.1);
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
      osc.start(t0); osc.stop(t0 + 0.15);
      break;
    case 'sweep':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t0);
      osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.15);
      gain.gain.setValueAtTime(0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.start(t0); osc.stop(t0 + 0.18);
      break;
    case 'whoosh':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t0);
      osc.frequency.exponentialRampToValueAtTime(200, t0 + 0.08);
      gain.gain.setValueAtTime(0.06, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      osc.start(t0); osc.stop(t0 + 0.1);
      break;
    case 'slash':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, t0);
      osc.frequency.exponentialRampToValueAtTime(300, t0 + 0.09);
      gain.gain.setValueAtTime(0.16, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
      osc.start(t0); osc.stop(t0 + 0.12);
      break;
    case 'boom':
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.3);
      gain.gain.setValueAtTime(0.3, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      osc.start(t0); osc.stop(t0 + 0.35);
      break;
  }
}

// --- Input ---
const keys = new Set();
let prevKeys = new Set();
function justPressed(code) { return keys.has(code) && !prevKeys.has(code); }
function anyKeyPressed() {
  for (var k of keys) { if (!prevKeys.has(k)) return true; }
  return false;
}
window.addEventListener('keydown', function (e) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  ensureAudio();
  keys.add(e.code);
});
window.addEventListener('keyup', function (e) { keys.delete(e.code); });

// --- Gamepad support ---
// Controller input is translated each frame into the same `keys` set the keyboard uses,
// so every existing input check (movement, justPressed, dash double-tap) works unchanged.
// P1 = gamepad 0, P2 = gamepad 1. Layout (standard mapping):
//   Stick/D-Pad = nur links/rechts; X/Cross (0) = jump; Dreieck/Triangle (3) = parry
//   Viereck/Square (2) = punch, Kreis/Circle (1) = kick, Schultertasten (LB/RB/LT/RT) = special
const PAD_CONTROLS = [P1_CONTROLS, P2_CONTROLS];
const padHeld = [new Set(), new Set()];
let padConnected = false;

window.addEventListener('gamepadconnected', function () { padConnected = true; });

function pollGamepads() {
  if (!padConnected || !navigator.getGamepads) return;
  var pads = navigator.getGamepads();
  for (var p = 0; p < 2; p++) {
    var gp = pads[p];
    var c = PAD_CONTROLS[p];
    var now = new Set();
    if (gp) {
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      var b = gp.buttons;
      var down = function (i) { return b[i] && b[i].pressed; };
      if (ax < -0.45 || down(14)) now.add(c.left);
      if (ax > 0.45 || down(15)) now.add(c.right);
      if (down(0)) now.add(c.up);                                     // jump: X/Cross only
      if (down(3)) now.add(c.down);                                   // parry: Dreieck/Triangle only
      if (down(2)) now.add(c.punch);                                  // Viereck / Square
      if (down(1)) now.add(c.kick);                                   // Kreis / Circle
      if (down(4) || down(5) || down(6) || down(7)) now.add(c.special); // shoulders / triggers
      if (now.size) ensureAudio();
    }
    var prev = padHeld[p];
    prev.forEach(function (code) { if (!now.has(code)) keys.delete(code); });
    now.forEach(function (code) { keys.add(code); });
    padHeld[p] = now;
  }
}

// --- State ---
let gameState = 'TITLE';
let fighter1, fighter2;
let projectiles = [];
let particles = [];
let popups = [];
let roundTimer = 99;
let roundNumber = 1;
let roundsWon = { p1: 0, p2: 0 };
let stateTimer = 0;
let roundResultText = '';
let matchResultText = '';
let shake = 0;
let hitstop = 0;
let globalTime = 0;
let slowmo = 0;

let history = [];
let rewindEffect = 0;
let rewindGhosts = [];
const REWIND_FRAMES = 180;

let impactEffect = null;
let slashStreak = null;
let flashBurst = 0;

function triggerImpactEffect(x, y, color, label, life) {
  impactEffect = { x: x, y: y, color: color, label: label, life: life || 26, maxLife: life || 26 };
}

function triggerSlashStreak(x, y, facing, color) {
  slashStreak = { x: x, y: y, facing: facing, color: color, life: 14, maxLife: 14 };
}

let cinematic = null;
let prevGameState = 'FIGHT';

const select = { p1Index: 0, p2Index: 1, p1Locked: false, p2Locked: false, countdown: 0 };

const bgStars = Array.from({ length: 80 }, function () {
  return { x: Math.random() * CANVAS_W, y: Math.random() * 340, r: Math.random() * 1.5 + 0.5, tw: Math.random() * Math.PI * 2 };
});
const BUILDINGS = [[50, 345, 120, 215], [210, 290, 95, 270], [345, 370, 135, 190], [520, 320, 100, 240], [830, 305, 105, 255], [975, 345, 145, 215], [1150, 280, 105, 280]];
const bgWindows = [];
BUILDINGS.forEach(function (b) {
  for (var wx = b[0] + 10; wx < b[0] + b[2] - 14; wx += 22)
    for (var wy = b[1] + 12; wy < b[1] + b[3] - 14; wy += 26)
      if (Math.random() < 0.55) bgWindows.push([wx, wy, Math.random() < 0.25]);
});

// --- Helpers ---
function inState(f, states) {
  for (var i = 0; i < states.length; i++) if (f.state === states[i]) return true;
  return false;
}

function isAttackState(f) { return inState(f, ATTACK_STATES); }

function specialReady(f) {
  var m = f.charDef.moves.special;
  return m.cooldown ? f.cooldowns.special === 0 : f.meter >= METER_MAX;
}

function createFighter(charDef, x, facing, controls) {
  return {
    charDef: charDef,
    x: x, y: GROUND_Y,
    vx: 0, vy: 0,
    facing: facing,
    hp: charDef.stats.health,
    maxHp: charDef.stats.health,
    displayHp: charDef.stats.health,
    state: 'idle',
    stateTimer: 0,
    animTime: Math.random() * 100,
    hasHit: false,
    cooldowns: { punch: 0, kick: 0, fwd_punch: 0, fwd_kick: 0, special: 0, parry: 0 },
    meter: 0,
    parryStunned: false,
    stunned: false,
    blocking: false,
    hitFlash: 0,
    grounded: true,
    controls: controls,
    comboCount: 0,
    comboTimer: 0,
    airAttacked: false,
    tap: { left: -999, right: -999 },
    dashCd: 0,
    dashTime: 0,
    afterimages: [],
    wallBounced: false,
    hitCount: 0,
    lastHitFrame: -99,
    groundBounce: false,
    hyperTimer: 0,
    hyperMove: null,
  };
}

function spawnParticles(x, y, color, count, speed) {
  speed = speed || 4;
  for (var i = 0; i < count; i++) {
    var ang = Math.random() * Math.PI * 2;
    var v = Math.random() * speed + 1;
    particles.push({ x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 2, life: 25 + Math.random() * 15, maxLife: 40, color: color, size: Math.random() * 4 + 2 });
  }
}

function spawnSparks(x, y, dir, color, count) {
  for (var i = 0; i < count; i++) {
    var ang = (Math.random() - 0.5) * 1.2 + (dir > 0 ? 0 : Math.PI);
    var v = Math.random() * 6 + 3;
    particles.push({ x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 3, life: 15 + Math.random() * 10, maxLife: 25, color: color, size: Math.random() * 3 + 1 });
  }
}

function spawnPopup(x, y, text, color) {
  popups.push({ x: x, y: y, text: text, color: color, life: 45 });
}

function startAttack(f, type) {
  f.state = type;
  f.stateTimer = 0;
  f.hasHit = false;
  f.hitCount = 0;
  f.lastHitFrame = -99;
  f.blocking = false;
  if (!f.grounded) f.vx *= 0.5;
  else f.vx = 0;
  // Advancing moves (dash punch/kick) lunge the whole body forward
  var mv = f.charDef.moves[type];
  if (mv && mv.adv && f.grounded) f.vx = f.facing * mv.adv;
  // Hopper moves briefly leave the ground mid-attack (unpredictable spacing, dodges low pokes)
  if (mv && mv.hopper && f.grounded) { f.vy = mv.hopVel || -6; f.grounded = false; }
  if (type === 'special') {
    if (!f.charDef.moves.special.cooldown) f.meter = 0;
    playSound('special');
  } else if (type === 'fwd_punch') {
    playSound('uppercut');
  } else if (type === 'fwd_kick') {
    playSound('sweep');
  }
}

// --- Fighter Update ---
function updateFighter(f) {
  var c = f.controls;
  f.animTime++;

  if (f.state === 'thrown') {
    f.stateTimer--;
    var total = f.throwTotal || 30;
    var prog = 1 - Math.max(0, f.stateTimer) / total;
    f.x = f.throwStartX + (f.throwEndX - f.throwStartX) * prog;
    f.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, f.x));
    f.y = f.throwStartY - Math.sin(prog * Math.PI) * 110;
    f.grounded = false;
    if (f.stateTimer <= 0) {
      f.y = GROUND_Y;
      f.grounded = true;
      f.vx = 0; f.vy = 0;
      f.airAttacked = false;
      f.state = 'hit';
      f.stateTimer = 16;
      spawnParticles(f.x + FIGHTER_WIDTH / 2, FLOOR_Y, '#cfa86b', 16, 5);
      shake = 14;
      hitstop = 6;
    }
    return;
  }

  for (var k in f.cooldowns) if (f.cooldowns[k] > 0) f.cooldowns[k]--;
  if (f.dashCd > 0) f.dashCd--;
  if (f.dashTime > 0) f.dashTime--;
  // Jan's special is meter-gated rather than on a flat cooldown, so it passively trickles up
  if (f.charDef.id === 'jan' && f.meter < METER_MAX) {
    f.meter = Math.min(METER_MAX, f.meter + 0.3);
  }
  // Timo's hyper window: extremely fast, extremely weak, ticks down in real time
  if (f.hyperTimer > 0) {
    f.hyperTimer--;
    if (globalTime % 4 === 0) spawnParticles(f.x + FIGHTER_WIDTH / 2, f.y + FIGHTER_HEIGHT * 0.6, '#ffe066', 1, 2);
    if (f.hyperTimer === 0) { f.hyperMove = null; spawnPopup(f.x + FIGHTER_WIDTH / 2, f.y, 'MÜDE...', '#9fa8c0'); }
  }
  if (f.comboTimer > 0) {
    f.comboTimer--;
    if (f.comboTimer === 0) f.comboCount = 0;
  }
  // Dash afterimage trail
  if (f.afterimages.length) {
    for (var ai = f.afterimages.length - 1; ai >= 0; ai--) {
      f.afterimages[ai].life--;
      if (f.afterimages[ai].life <= 0) f.afterimages.splice(ai, 1);
    }
  }
  if (f.dashTime > 0) f.afterimages.push({ x: f.x, y: f.y, facing: f.facing, state: f.state, animTime: f.animTime, life: 8 });

  var opp = f === fighter1 ? fighter2 : fighter1;
  if (!inState(f, ATTACK_STATES.concat(['hit', 'ko', 'win', 'thrown']))) {
    f.facing = opp.x > f.x ? 1 : -1;
  }

  var canAct = inState(f, ['idle', 'walk', 'jump']);

  if (canAct) {
    // Dash / backdash via double-tap
    var DASH_WINDOW = 13;
    var dashDir = 0;
    if (justPressed(c.left)) { if (globalTime - f.tap.left < DASH_WINDOW) dashDir = -1; f.tap.left = globalTime; }
    if (justPressed(c.right)) { if (globalTime - f.tap.right < DASH_WINDOW) dashDir = 1; f.tap.right = globalTime; }
    if (dashDir !== 0 && f.grounded && f.dashCd === 0) {
      f.vx = dashDir * f.charDef.stats.speed * 5;
      f.dashCd = 30;
      f.dashTime = 9;
      playSound('whoosh');
    }

    var spdMult = f.hyperTimer > 0 && f.hyperMove ? (f.hyperMove.speedMult || 1) : 1;
    var targetVx = 0;
    if (keys.has(c.left)) targetVx = -f.charDef.stats.speed * spdMult;
    else if (keys.has(c.right)) targetVx = f.charDef.stats.speed * spdMult;
    if (f.dashTime > 0) {
      // preserve dash burst, just let it bleed off
      f.vx *= 0.86;
    } else if (f.grounded) {
      if (targetVx !== 0) { f.vx += (targetVx - f.vx) * 0.22; }
      else { f.vx *= 0.55; if (Math.abs(f.vx) < 0.1) f.vx = 0; }
    } else {
      if (targetVx !== 0) { f.vx += (targetVx - f.vx) * 0.12; }
      else { f.vx *= 0.92; }
    }

    // Jump
    if (justPressed(c.up) && f.grounded) {
      f.vy = f.charDef.stats.jumpVel;
      f.grounded = false;
      f.state = 'jump';
      f.airAttacked = false;
      f.blocking = false;
      playSound('jump');
    }

    // Parry (tap down)
    if (justPressed(c.down) && f.grounded && f.cooldowns.parry === 0) {
      f.state = 'parry';
      f.stateTimer = 0;
      f.vx = 0;
      f.blocking = false;
    }

    // Ground state update
    if (f.grounded && f.state !== 'parry') {
      f.state = Math.abs(f.vx) > 0.3 ? 'walk' : 'idle';
    }

    // Standing attacks (forward+attack = stronger variant)
    if (f.grounded && inState(f, ['idle', 'walk'])) {
      var fwdKey = f.facing > 0 ? c.right : c.left;
      var holdingFwd = keys.has(fwdKey);
      if (justPressed(c.punch)) {
        if (holdingFwd && f.cooldowns.fwd_punch === 0) startAttack(f, 'fwd_punch');
        else if (f.cooldowns.punch === 0) startAttack(f, 'punch');
      } else if (justPressed(c.kick)) {
        if (holdingFwd && f.cooldowns.fwd_kick === 0) startAttack(f, 'fwd_kick');
        else if (f.cooldowns.kick === 0) startAttack(f, 'kick');
      } else if (justPressed(c.special) && specialReady(f)) startAttack(f, 'special');
    }

    // Air attacks
    if (!f.grounded && !f.airAttacked && f.state === 'jump') {
      if (justPressed(c.punch)) { startAttack(f, 'punch'); f.airAttacked = true; playSound('airhit'); }
      else if (justPressed(c.kick)) { startAttack(f, 'kick'); f.airAttacked = true; playSound('airhit'); }
    }
  }

  // Gravity
  f.vy += GRAVITY;
  f.y += f.vy;
  if (f.y >= GROUND_Y) {
    f.y = GROUND_Y;
    f.vy = 0;
    if (!f.grounded) {
      f.grounded = true;
      f.airAttacked = false;
      if (f.groundBounce && f.state === 'hit') {
        // Ground bounce: pop back up once for extended juggles
        f.groundBounce = false;
        f.vy = -7;
        f.grounded = false;
        f.stateTimer = Math.max(f.stateTimer, 20);
        spawnParticles(f.x + FIGHTER_WIDTH / 2, FLOOR_Y, '#ffd166', 12, 6);
        spawnPopup(f.x + FIGHTER_WIDTH / 2, f.y, 'BOUNCE!', '#ffd166');
      } else {
        spawnParticles(f.x + FIGHTER_WIDTH / 2, FLOOR_Y, '#888', 5, 2);
        if (f.state === 'jump') f.state = 'idle';
      }
    }
  }

  // Friction for advancing attacks so the lunge bleeds off
  if (isAttackState(f) && f.grounded) f.vx *= 0.86;

  f.x += f.vx;
  // Wall bounce: a hard knockback into the screen edge ricochets back (corner combos)
  if (f.state === 'hit' && !f.wallBounced && Math.abs(f.vx) > 7) {
    if (f.x <= 0 || f.x >= CANVAS_W - FIGHTER_WIDTH) {
      f.vx = -f.vx * 0.55;
      f.vy = -5.5;
      f.grounded = false;
      f.wallBounced = true;
      f.stateTimer += 8;
      shake = Math.min(18, shake + 6);
      var wbx = f.x <= 0 ? 6 : CANVAS_W - 6;
      spawnParticles(wbx, f.y + FIGHTER_HEIGHT * 0.4, '#ffd166', 14, 7);
      spawnPopup(f.x + FIGHTER_WIDTH / 2, f.y, 'WALL BOUNCE!', '#4fc3f7');
    }
  }
  f.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, f.x));
  if (f.state !== 'hit' && f.state !== 'thrown') f.wallBounced = false;

  var overlap = FIGHTER_WIDTH - Math.abs(fighter1.x - fighter2.x);
  if (overlap > 0 && f.grounded) {
    var pushDir = f.x < opp.x ? -1 : 1;
    f.x += pushDir * overlap * 0.5;
    f.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, f.x));
  }

  // Attack state timer
  if (isAttackState(f)) {
    f.stateTimer += (f.hyperTimer > 0 && f.hyperMove ? (f.hyperMove.atkSpeedMult || 1) : 1);
    var move = f.charDef.moves[f.state];
    var totalFrames = !f.grounded ? Math.round(move.total * 0.7) : move.total;
    if (f.stateTimer >= totalFrames) {
      if (f.state !== 'special' || move.cooldown) {
        f.cooldowns[f.state] = f.grounded ? (move.cooldown || 0) : Math.round((move.cooldown || 0) * 0.5);
      }
      var wasKickWhiff = (f.state === 'kick' || f.state === 'fwd_kick') && f.grounded && !f.hasHit;
      var wasCommitWhiff = move.whiffPunish && f.grounded && !f.hasHit;
      var whiffLag = wasCommitWhiff ? (move.whiffStun || 30) : WHIFF_STUN;
      var wasParryStunned = f.parryStunned;
      f.parryStunned = false;
      f.hasHit = false;
      f.hitCount = 0;
      if (wasParryStunned) {
        f.state = 'hit';
        f.stateTimer = PARRY_STUN;
        f.stunned = true;
      } else if (wasKickWhiff || wasCommitWhiff) {
        f.state = 'hit';
        f.stateTimer = whiffLag;
        f.stunned = true;
      } else {
        f.state = f.grounded ? 'idle' : 'jump';
        f.stateTimer = 0;
      }
    }
  } else if (f.state === 'hit') {
    f.vx *= 0.85;
    f.stateTimer--;
    if (f.stateTimer <= 0) {
      f.state = f.grounded ? 'idle' : 'jump';
      f.stunned = false;
    }
  } else if (f.state === 'parry') {
    f.stateTimer++;
    if (f.stateTimer >= PARRY_TOTAL) {
      f.state = f.grounded ? 'idle' : 'jump';
      f.stateTimer = 0;
      f.cooldowns.parry = PARRY_COOLDOWN;
    }
  }

  if (f.hitFlash > 0) f.hitFlash--;
  if (f.displayHp > f.hp) f.displayHp = Math.max(f.hp, f.displayHp - 0.7);
}

function applyDamage(defender, dmg, attacker, knockback, ignoreBlock, stun, isCounter, isProjectile, moveFlags) {
  ignoreBlock = ignoreBlock || false;
  stun = stun || 14;
  isCounter = isCounter || false;
  isProjectile = isProjectile || false;
  moveFlags = moveFlags || {};

  var hx = defender.x + FIGHTER_WIDTH / 2;
  var hy = defender.y + FIGHTER_HEIGHT * 0.3;

  // Parry check
  var parried = defender.state === 'parry' && defender.stateTimer <= PARRY_ACTIVE && !ignoreBlock;
  if (parried) {
    playSound('parry');
    spawnParticles(hx, hy, '#ffffff', 14, 6);
    spawnPopup(hx, hy - 30, 'PARRY!', '#ffffff');
    shake = Math.min(14, shake + 5);
    hitstop = 6;
    defender.meter = Math.min(METER_MAX, defender.meter + METER_GAIN_PARRY);
    if (!isProjectile) {
      attacker.comboCount = 0;
      attacker.comboTimer = 0;
      attacker.parryStunned = true;
    }
    return;
  }

  // Normal damage
  var finalDmg = dmg;
  var finalKnock = knockback;
  if (isCounter) {
    finalDmg = Math.round(dmg * (moveFlags.counterMult || 1.5));
    finalKnock *= 1.3;
    stun += 6;
  }
  // Tip precision: hitting at the far end of a thrust's reach deals bonus damage
  if (moveFlags.tipHit) {
    finalDmg = Math.round(finalDmg * (moveFlags.tipBonus || 1.5));
    finalKnock *= 1.15;
  }
  // Combo damage scaling — long combos deal less per hit
  var comboSoFar = attacker.comboTimer > 0 ? attacker.comboCount : 0;
  var scaleTable = [1, 1, 0.85, 0.72, 0.6, 0.5, 0.42, 0.35];
  var dmgScale = scaleTable[Math.min(scaleTable.length - 1, comboSoFar)];
  finalDmg = Math.max(1, Math.round(finalDmg * dmgScale));
  // Timo's hyper window trades all his power for speed
  if (attacker.hyperTimer > 0 && attacker.hyperMove) {
    finalDmg = Math.max(1, Math.round(finalDmg * (attacker.hyperMove.dmgMult || 1)));
  }
  defender.hp = Math.max(0, defender.hp - finalDmg);
  defender.hitFlash = 8;
  var dir = defender.x < attacker.x ? -1 : 1;
  // Pull-in moves drag the opponent toward the attacker instead of away
  defender.vx = (moveFlags.pullIn ? -dir * Math.min(finalKnock, 7) : dir * finalKnock);
  if (!defender.grounded) defender.vy = -4.5;

  // Launcher
  if (moveFlags.launcher && defender.grounded) {
    defender.vy = -8;
    defender.grounded = false;
  }
  // Ground bounce: mark so the defender pops back up when they land
  if (moveFlags.groundBounce) defender.groundBounce = true;

  var fxColor = moveFlags.fx || '#ffe066';
  playSound('hit');
  spawnSparks(hx, hy, dir, fxColor, 12);
  spawnParticles(hx, hy, '#ff8844', 6, 4);
  spawnPopup(hx, hy - 20, '-' + finalDmg, finalDmg >= 15 ? '#ff5252' : '#ffd166');
  if (moveFlags.tipHit) {
    spawnPopup(hx, hy - 42, 'SPITZE!', '#d4af6a');
    shake = Math.min(20, shake + 6);
    spawnParticles(hx, hy, '#d4af6a', 12, 6);
  }
  if (moveFlags.chaosRoll != null) {
    var chaosLabels = ['LAUNCHER!', 'BOUNCE!', 'KNOCKDOWN!'];
    var rainbow = ['#ff2d95', '#e8c547', '#00e6c3', '#3b5998', '#9b59b6'];
    spawnPopup(hx, hy - 55, chaosLabels[moveFlags.chaosRoll], rainbow[moveFlags.chaosRoll * 2 % rainbow.length]);
    for (var ci = 0; ci < rainbow.length; ci++) spawnParticles(hx, hy, rainbow[ci], 3, 5);
  }
  if (isCounter) {
    spawnPopup(hx, hy - 40, moveFlags.counterLabel || 'COUNTER!', '#ff8800');
    if (moveFlags.counterLabel) { shake = Math.min(20, shake + 8); spawnParticles(hx, hy, '#ffffff', 14, 6); }
  }
  // Super armor: a defender mid-armored-move tanks through light hits without flinching
  var defenderMove = isAttackState(defender) ? defender.charDef.moves[defender.state] : null;
  var armored = defenderMove && defenderMove.armor && finalDmg < (defenderMove.armorBreak || 9999);
  if (armored) {
    defender.vx = 0;
    spawnPopup(hx, hy - 40, 'ARMOR!', '#caa24a');
  } else {
    defender.state = 'hit';
    defender.stateTimer = stun;
    defender.stunned = false;
    defender.blocking = false;
  }
  shake = Math.min(16, 4 + finalDmg * 0.5 + (isCounter ? 4 : 0));
  hitstop = finalDmg >= 15 ? 8 : 4;

  // Lifesteal: attacker recovers a slice of the damage they just dealt
  if (moveFlags.lifesteal) {
    var healed = Math.max(1, Math.round(finalDmg * moveFlags.lifesteal));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
    attacker.displayHp = Math.min(attacker.maxHp, attacker.displayHp + healed);
    spawnPopup(attacker.x + FIGHTER_WIDTH / 2, attacker.y, '+' + healed, '#7ddf6f');
    spawnParticles(attacker.x + FIGHTER_WIDTH / 2, attacker.y + FIGHTER_HEIGHT * 0.4, '#7ddf6f', 8, 3);
  }

  // Meter drain: saps the defender's special meter instead of growing it
  if (moveFlags.meterDrain) {
    defender.meter = Math.max(0, defender.meter - moveFlags.meterDrain);
    spawnPopup(hx, hy - 70, 'MÜDE...', '#9fa8c0');
  }

  // Cross-up: swap sides with the defender and flip both fighters around
  if (moveFlags.swapPosition) {
    var swapTmp = attacker.x;
    attacker.x = defender.x;
    defender.x = swapTmp;
    attacker.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, attacker.x));
    defender.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, defender.x));
    attacker.facing *= -1;
    defender.facing *= -1;
    attacker.vx = 0; defender.vx = 0;
    spawnPopup(CANVAS_W / 2, hy - 70, 'SWAP!', '#4fc3f7');
  }

  attacker.comboCount = attacker.comboTimer > 0 ? attacker.comboCount + 1 : 1;
  attacker.comboTimer = 50;
  if (attacker.comboCount >= 2) {
    spawnPopup(hx, hy - 60, attacker.comboCount + ' HITS', '#ffcc00');
    var rank = attacker.comboCount >= 8 ? 'INSANE!' : attacker.comboCount >= 6 ? 'BRUTAL!'
      : attacker.comboCount >= 4 ? 'SICK!' : attacker.comboCount >= 3 ? 'NICE!' : '';
    if (rank) {
      spawnPopup(hx, hy - 88, rank, attacker.comboCount >= 6 ? '#ff3b3b' : '#ff9100');
      shake = Math.min(20, shake + attacker.comboCount);
    }
  }

  attacker.meter = Math.min(METER_MAX, attacker.meter + finalDmg * METER_GAIN_ATTACKER * (moveFlags.meterMult || 1));
  if (!moveFlags.meterDrain) {
    defender.meter = Math.min(METER_MAX, defender.meter + finalDmg * METER_GAIN_DEFENDER);
  }

  // KO slowmo
  if (defender.hp <= 0) slowmo = 45;
}

// --- Cinematic Super Moves (Injustice-style) ---
function startCinematic(attacker, defender, kind, dmg) {
  cinematic = {
    kind: kind,
    attacker: attacker,
    defender: defender,
    dmg: dmg,
    timer: 0,
    total: kind === 'max' ? 310 : kind === 'nova' ? 570 + 1170 + 160 : 300,
    flash: 1,
  };
  attacker.vx = 0; attacker.vy = 0; attacker.grounded = true; attacker.y = GROUND_Y;
  defender.vx = 0; defender.vy = 0; defender.grounded = true; defender.y = GROUND_Y;
  prevGameState = gameState;
  gameState = 'CINEMATIC';
  playSound('special');
}

function finishCinematic() {
  var cin = cinematic;
  var a = cin.attacker, d = cin.defender;
  d.hp = Math.max(0, d.hp - cin.dmg);
  var dir = d.x < a.x ? -1 : 1;
  d.state = 'hit';
  d.stateTimer = 30;
  d.stunned = true;
  d.hitFlash = 8;
  d.grounded = true; d.y = GROUND_Y;
  d.vx = dir * 9; d.vy = -4;
  d.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, a.x + dir * FIGHTER_WIDTH * 1.6));
  d.facing = -dir;
  a.state = 'idle'; a.stateTimer = 0; a.hasHit = true; a.facing = dir;
  spawnPopup(d.x + FIGHTER_WIDTH / 2, d.y + 30, '-' + cin.dmg, '#ff3b3b');
  spawnParticles(d.x + FIGHTER_WIDTH / 2, d.y + FIGHTER_HEIGHT * 0.4, '#c0392b', 24, 7);
  shake = 16;
  cinematic = null;
  gameState = prevGameState === 'CINEMATIC' ? 'FIGHT' : prevGameState;
  if (d.hp <= 0) endRound();
}

function updateCinematic() {
  var cin = cinematic;
  if (!cin) { gameState = 'FIGHT'; return; }
  cin.timer++;
  var T = cin.timer;
  if (cin.flash > 0) cin.flash = Math.max(0, cin.flash - 0.06);

  var mid = cin.attacker.x + (cin.defender.x - cin.attacker.x) / 2 + FIGHTER_WIDTH / 2;

  if (cin.kind === 'nova') {
    if (T === 320) playSound('confirm');                   // door bell entering shop
    if (T === 1070) playSound('whoosh');                   // disinfect spray
    if (T === 1216) { playSound('select'); shake = 5; spawnParticles(mid + 30, 280, '#f5d76e', 8, 3); } // CLICK piercing applied
    if (T === 1230) playSound('confirm');                  // "fertig, sieht gut aus"
    if (T === 1708) { playSound('boom'); playSound('ko'); shake = 30; cin.flash = 1; spawnParticles(mid, 320, '#ff3b3b', 30, 9); } // surprise punch
  } else if (cin.kind === 'max') {
    if (T === 1) shake = 12;
    if (T === 64) { playSound('uppercut'); shake = 10; spawnParticles(mid, 360, '#ffe066', 10, 5); }
    if (T === 128) { playSound('whoosh'); for (var i = 0; i < 14; i++) spawnParticles(mid + (Math.random() - 0.5) * 200, 200 + Math.random() * 120, Math.random() < 0.5 ? '#3fa34d' : '#e8862e', 1, 4); }
    if (T === 214) { playSound('boom'); playSound('ko'); shake = 26; cin.flash = 0.9; for (var j = 0; j < 30; j++) spawnParticles(mid + (Math.random() - 0.5) * 160, FLOOR_Y - Math.random() * 30, '#9a8468', 1, 8); }
  } else {
    if (T === 1) shake = 10;
    [54, 74, 94, 114].forEach(function (f) {
      if (T === f) { playSound('slash'); shake = 9; cin.flash = 0.45; spawnParticles(mid + (Math.random() - 0.5) * 120, 280 + Math.random() * 80, '#ff4d6d', 6, 6); }
    });
    if (T === 210) { playSound('boom'); playSound('ko'); shake = 26; cin.flash = 1; spawnParticles(mid, 320, '#ff4d6d', 30, 8); }
  }

  updateParticles();
  if (T >= cin.total) finishCinematic();
}

function checkMeleeHit(attacker, defender) {
  if (!isAttackState(attacker)) return;
  var move = attacker.charDef.moves[attacker.state];
  if (move.type === 'projectile' || move.type === 'rewind' || move.type === 'hyper') return;
  var maxHits = move.hits || 1;
  if ((attacker.hitCount || 0) >= maxHits) return;

  var activeEnd = !attacker.grounded ? Math.round(move.active[1] * 0.7) : move.active[1];
  var activeStart = !attacker.grounded ? Math.round(move.active[0] * 0.7) : move.active[0];
  if (attacker.stateTimer < activeStart || attacker.stateTimer > activeEnd) return;

  var ac = attacker.x + FIGHTER_WIDTH / 2;
  var dc = defender.x + FIGHTER_WIDTH / 2;
  var dx = dc - ac;
  var dist = Math.abs(dx);
  // Defender must be in front of the attacker's facing direction (small tolerance for body overlap)
  var inFront = attacker.facing > 0 ? dx >= -FIGHTER_WIDTH * 0.25 : dx <= FIGHTER_WIDTH * 0.25;
  // Vertical reach: kicks are low and whiff against an airborne defender (jump over them to dodge);
  // jump-in attacks reach down generously; everything else needs roughly matching height
  var vDist = Math.abs(attacker.y - defender.y);
  var isKickMove = attacker.state === 'kick' || attacker.state === 'fwd_kick';
  var inReach;
  if (attacker.grounded && !defender.grounded) {
    inReach = isKickMove ? false : vDist <= FIGHTER_HEIGHT * 0.25;
  } else if (!attacker.grounded && defender.grounded) {
    inReach = vDist <= FIGHTER_HEIGHT * 0.9;
  } else {
    inReach = vDist <= FIGHTER_HEIGHT * 0.6;
  }
  var hit = inFront && inReach;

  var isCounter = isAttackState(defender) && defender.stateTimer < defender.charDef.moves[defender.state].active[0];
  var airBonus = !attacker.grounded ? 0.8 : 1;
  var isFinalHit = ((attacker.hitCount || 0) + 1) >= maxHits;
  var moveFlags = {
    launcher: !!move.launcher, knockdown: !!move.knockdown, pullIn: !!move.pullIn, groundBounce: !!move.groundBounce,
    fx: move.fx, counterMult: move.counterMult, counterLabel: move.counterLabel, meterMult: move.meterMult,
    swapPosition: !!move.swapPosition && isFinalHit, lifesteal: move.lifesteal, meterDrain: move.meterDrain,
    tipBonus: move.tipBonus,
  };

  // Everything is parriable in this game, including grabs/throws and cinematic supers
  var hx0 = defender.x + FIGHTER_WIDTH / 2;
  var hy0 = defender.y + FIGHTER_HEIGHT * 0.3;
  var wasParried = defender.state === 'parry' && defender.stateTimer <= PARRY_ACTIVE;
  if (wasParried && (move.type === 'grab' || move.type === 'melee')
      && hit && dist <= move.range && !defender.blocking) {
    playSound('parry');
    spawnParticles(hx0, hy0, '#ffffff', 14, 6);
    spawnPopup(hx0, hy0 - 30, 'PARRY!', '#ffffff');
    shake = Math.min(14, shake + 5);
    hitstop = 6;
    defender.meter = Math.min(METER_MAX, defender.meter + METER_GAIN_PARRY);
    attacker.comboCount = 0;
    attacker.comboTimer = 0;
    attacker.parryStunned = true;
    attacker.hitCount = (attacker.hitCount || 0) + 1;
    attacker.lastHitFrame = globalTime;
    attacker.hasHit = true;
    return;
  }

  // Cinematic super move: Max (judo grab) and Luka (sword) trigger a full Injustice-style cutscene
  if (attacker.state === 'special' && (move.type === 'grab' || move.type === 'melee')
      && hit && dist <= move.range && !defender.blocking) {
    attacker.hasHit = true;
    startCinematic(attacker, defender, attacker.charDef.id, Math.round(move.dmg * 1.8));
    return;
  }

  if (move.type === 'grab') {
    if (hit && dist <= move.range && !defender.blocking) {
      defender.hp = Math.max(0, defender.hp - move.dmg);
      var hx = attacker.x + FIGHTER_WIDTH / 2;
      var hy = attacker.y + FIGHTER_HEIGHT * 0.3;
      spawnSparks(hx, hy, attacker.facing, '#ffe066', 14);
      spawnPopup(hx, hy - 20, '-' + move.dmg, '#ff5252');
      playSound('hit');
      shake = Math.min(14, 8 + move.dmg * 0.2);
      hitstop = 8;
      var throwTotal = move.throwTotal || 30;
      defender.state = 'thrown';
      defender.throwTotal = throwTotal;
      defender.stateTimer = throwTotal;
      defender.throwStartX = defender.x;
      defender.throwStartY = defender.y;
      var throwEndX = attacker.x + attacker.facing * FIGHTER_WIDTH * (move.throwDist != null ? move.throwDist : 2.4);
      defender.throwEndX = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, throwEndX));
      defender.grounded = false;
      defender.vx = 0; defender.vy = 0;
      defender.blocking = false;
      attacker.comboCount = attacker.comboTimer > 0 ? attacker.comboCount + 1 : 1;
      attacker.comboTimer = 45;
      attacker.meter = Math.min(METER_MAX, attacker.meter + move.dmg * METER_GAIN_ATTACKER);
      defender.meter = Math.min(METER_MAX, defender.meter + move.dmg * METER_GAIN_DEFENDER);
      if (defender.hp <= 0) slowmo = 45;
      attacker.hitCount = (attacker.hitCount || 0) + 1;
      attacker.lastHitFrame = globalTime;
    }
    attacker.hasHit = true;
    return;
  }

  if (hit && dist <= move.range && globalTime - (attacker.lastHitFrame || -99) >= (move.hitGap || 4)) {
    var airDmg = !attacker.grounded && attacker.state === 'kick' ? Math.round(move.dmg * 0.6) : move.dmg;
    var stunFinal = move.stun || 14;
    // Chaos roll: random bonus effect each time, can't be predicted on press
    if (move.chaosRoll) {
      var roll = Math.floor(Math.random() * 3);
      moveFlags.launcher = roll === 0;
      moveFlags.groundBounce = roll === 1;
      if (roll === 2) stunFinal += 16;
      moveFlags.chaosRoll = roll;
    }
    // Tip precision: only the far end of the thrust's reach counts as the sweet spot
    moveFlags.tipHit = !!move.tipBonus && dist >= move.range * (move.tipThreshold || 0.72);
    applyDamage(defender, airDmg, attacker, (move.knockback || 0) * airBonus, move.type === 'grab', stunFinal, isCounter, false, moveFlags);
    attacker.hitCount = (attacker.hitCount || 0) + 1;
    attacker.lastHitFrame = globalTime;
    attacker.hasHit = true;
  }
}

// --- Rewind ---
function snapshotFighter(f) {
  return { x: f.x, y: f.y, hp: f.hp, facing: f.facing, grounded: f.grounded };
}
function recordHistory() {
  history.push({ f1: snapshotFighter(fighter1), f2: snapshotFighter(fighter2) });
  if (history.length > REWIND_FRAMES + 1) history.shift();
}
function applySnapshotTo(f, snap, full) {
  f.x = snap.x; f.y = snap.y; f.hp = snap.hp; f.displayHp = snap.hp;
  f.facing = snap.facing; f.grounded = snap.grounded; f.vx = 0; f.vy = 0;
  if (full) {
    f.state = f.grounded ? 'idle' : 'jump';
    f.stateTimer = 0; f.hasHit = false; f.airAttacked = false; f.blocking = false;
  }
}
function triggerRewind(caster) {
  if (history.length < 2) return;
  var idx = Math.max(0, history.length - 1 - REWIND_FRAMES);
  var snap = history[idx];
  var other = caster === fighter1 ? fighter2 : fighter1;
  applySnapshotTo(caster, caster === fighter1 ? snap.f1 : snap.f2, false);
  applySnapshotTo(other, other === fighter1 ? snap.f1 : snap.f2, true);
  rewindGhosts = [];
  var span = history.length - idx;
  var step = Math.max(1, Math.floor(span / 6));
  for (var i = idx; i < history.length; i += step) rewindGhosts.push(history[i]);
  rewindEffect = 50;
  shake = 10;
  playSound('rewind');
  spawnParticles(caster.x + FIGHTER_WIDTH / 2, caster.y + FIGHTER_HEIGHT / 2, '#00e6c3', 20, 7);
  spawnParticles(other.x + FIGHTER_WIDTH / 2, other.y + FIGHTER_HEIGHT / 2, '#7d5fff', 20, 7);
  spawnPopup(CANVAS_W / 2, 90, 'ZEIT ZURÜCKGESPULT!', '#00e6c3');
  history = [];
}
function checkRewindTrigger(attacker) {
  var move = attacker.charDef.moves.special;
  if (attacker.state !== 'special' || move.type !== 'rewind' || attacker.hasHit) return;
  if (attacker.stateTimer < move.active[0]) return;
  attacker.hasHit = true;
  triggerRewind(attacker);
}

// Timo's "Wachgerüttelt!" — a brief wake-up jolt, then 10s of being extremely fast but extremely weak
function triggerHyper(f, move) {
  f.hyperTimer = move.duration;
  f.hyperMove = move;
  shake = 12;
  hitstop = 10;
  playSound('boom');
  triggerImpactEffect(f.x + FIGHTER_WIDTH / 2, f.y + FIGHTER_HEIGHT * 0.3, '#ffe066', 'WACHGERÜTTELT!', 30);
  spawnParticles(f.x + FIGHTER_WIDTH / 2, f.y + FIGHTER_HEIGHT * 0.5, '#ffe066', 20, 6);
}
function checkHyperTrigger(attacker) {
  var move = attacker.charDef.moves.special;
  if (attacker.state !== 'special' || move.type !== 'hyper' || attacker.hasHit) return;
  if (attacker.stateTimer < move.active[0]) return;
  attacker.hasHit = true;
  triggerHyper(attacker, move);
}

function checkProjectileSpawn(attacker) {
  var move = attacker.charDef.moves.special;
  if (attacker.state !== 'special' || attacker.hasHit) return;
  if (attacker.stateTimer < move.active[0]) return;
  if (move.type === 'projectile') {
    projectiles.push({
      x: attacker.x + (attacker.facing > 0 ? FIGHTER_WIDTH : 0),
      y: attacker.y + FIGHTER_HEIGHT * 0.35,
      vx: move.speed * attacker.facing,
      dmg: move.dmg, type: move.projectile, owner: attacker, rotation: 0,
    });
    attacker.hasHit = true;
  } else if (move.type === 'shockwave') {
    projectiles.push({
      x: attacker.x + (attacker.facing > 0 ? FIGHTER_WIDTH : 0),
      y: FLOOR_Y, vx: move.speed * attacker.facing,
      dmg: move.dmg, knockback: move.knockback || 9, type: 'shockwave', owner: attacker, rotation: 0,
    });
    spawnParticles(attacker.x + FIGHTER_WIDTH / 2, FLOOR_Y, '#e8c547', 16, 6);
    shake = Math.min(14, shake + 6);
    attacker.hasHit = true;
  }
}

function updateProjectiles() {
  for (var i = projectiles.length - 1; i >= 0; i--) {
    var p = projectiles[i];
    p.x += p.vx;
    p.rotation += 0.15;
    if (p.type === 'shockwave') {
      if (globalTime % 2 === 0) {
        var rainbow = ['#ff2d95', '#e8c547', '#00e6c3', '#3b5998', '#9b59b6'];
        spawnParticles(p.x, FLOOR_Y - 40 - Math.random() * 60, rainbow[Math.floor(Math.random() * rainbow.length)], 2, 2);
      }
    } else if (globalTime % 3 === 0) {
      particles.push({ x: p.x, y: p.y, vx: -p.vx * 0.1, vy: (Math.random() - 0.5) * 1, life: 12, maxLife: 12, color: p.type === 'toast' ? '#e6b35c' : '#7f8c8d', size: 3 });
    }
    var target = p.owner === fighter1 ? fighter2 : fighter1;
    var tcx = target.x + FIGHTER_WIDTH / 2;
    var tcy = target.y + FIGHTER_HEIGHT / 2;
    var hitsTarget = p.type === 'shockwave'
      ? Math.abs(p.x - tcx) < FIGHTER_WIDTH / 2 + 14
      : Math.abs(p.x - tcx) < FIGHTER_WIDTH / 2 + 12 && Math.abs(p.y - tcy) < FIGHTER_HEIGHT / 2;
    // Projectile immunity: ducking under incoming fire during the active frames of a marked move
    var tMove = target.charDef.moves[target.state];
    var isImmune = tMove && tMove.projectileImmune && target.stateTimer >= tMove.active[0] && target.stateTimer <= tMove.active[1];
    if (hitsTarget && isImmune) {
      spawnParticles(p.x, p.y, '#9fd3ff', 4, 2);
      continue;
    }
    if (hitsTarget) {
      var pColor = p.type === 'toast' ? '#e6b35c' : (p.type === 'shockwave' ? '#e8c547' : (p.type === 'flash' ? '#fff7cc' : '#3498db'));
      var pStun = p.type === 'flash' ? 30 : 14;
      applyDamage(target, p.dmg, p.owner, p.type === 'shockwave' ? (p.knockback || 9) : (p.type === 'flash' ? 4 : 8), false, pStun, false, true);
      if (p.type === 'flash') { target.stunned = true; flashBurst = 0.7; spawnPopup(target.x + FIGHTER_WIDTH / 2, target.y, 'GEBLENDET!', '#fff7cc'); }
      spawnParticles(target.x + FIGHTER_WIDTH / 2, target.y + FIGHTER_HEIGHT / 2, pColor, 16, 6);
      projectiles.splice(i, 1);
      continue;
    }
    if (p.x < -40 || p.x > CANVAS_W + 40) projectiles.splice(i, 1);
  }
}

function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (var i = popups.length - 1; i >= 0; i--) {
    popups[i].y -= 0.8; popups[i].life--;
    if (popups[i].life <= 0) popups.splice(i, 1);
  }
}

// --- Title Screen ---
function updateTitle() {
  stateTimer++;
  if (anyKeyPressed() && stateTimer > 30) {
    playSound('confirm');
    gameState = 'SELECT';
    stateTimer = 0;
  }
}

function drawTitle() {
  drawBackground();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Animated title
  var scale = Math.min(1, stateTimer / 30);
  var pulse = 1 + Math.sin(globalTime * 0.05) * 0.03;
  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H * 0.3);
  ctx.scale(scale * pulse, scale * pulse);
  ctx.textAlign = 'center';

  // Title shadow
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 68px monospace';
  ctx.fillText('HOCHDAHL', 3, 3);
  ctx.fillText('FIGHTERS', 3, 78);
  // Title
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('HOCHDAHL', 0, 0);
  ctx.fillText('FIGHTERS', 0, 75);
  ctx.restore();

  // Subtitle
  if (stateTimer > 40) {
    var alpha = 0.5 + Math.sin(globalTime * 0.08) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DRÜCKE EINE TASTE', CANVAS_W / 2, CANVAS_H * 0.65);
    ctx.globalAlpha = 1;
  }

  if (stateTimer > 40) {
    ctx.fillStyle = '#888';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tastatur oder Controller — bis zu 2 Spieler', CANVAS_W / 2, CANVAS_H * 0.71);
  }

  // Version tag
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('V2 — POLISHED EDITION', CANVAS_W / 2, CANVAS_H * 0.92);

  // Draw two silhouettes
  if (stateTimer > 15) {
    var fadeIn = Math.min(1, (stateTimer - 15) / 20);
    ctx.globalAlpha = fadeIn * 0.6;
    var c1 = CHARACTERS[0], c2 = CHARACTERS[CHARACTERS.length - 1];
    ctx.save();
    ctx.translate(CANVAS_W * 0.18, CANVAS_H * 0.48);
    c1.draw(ctx, { state: 'idle', stateTimer: 0, hitFlash: 0, charDef: c1, facing: 1, animTime: globalTime, grounded: true, blocking: false }, FIGHTER_WIDTH * 1.3, FIGHTER_HEIGHT * 1.3);
    ctx.restore();
    ctx.save();
    ctx.translate(CANVAS_W * 0.72, CANVAS_H * 0.48);
    c2.draw(ctx, { state: 'idle', stateTimer: 0, hitFlash: 0, charDef: c2, facing: -1, animTime: globalTime + 50, grounded: true, blocking: false }, FIGHTER_WIDTH * 1.3, FIGHTER_HEIGHT * 1.3);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// --- Select Screen ---
function updateSelect() {
  if (!select.p1Locked) {
    if (justPressed(P1_CONTROLS.left)) { select.p1Index = (select.p1Index + CHARACTERS.length - 1) % CHARACTERS.length; playSound('select'); }
    if (justPressed(P1_CONTROLS.right)) { select.p1Index = (select.p1Index + 1) % CHARACTERS.length; playSound('select'); }
    if (justPressed(P1_CONTROLS.punch)) { select.p1Locked = true; playSound('confirm'); }
  } else if (justPressed(P1_CONTROLS.kick)) { select.p1Locked = false; playSound('select'); }

  if (!select.p2Locked) {
    if (justPressed(P2_CONTROLS.left)) { select.p2Index = (select.p2Index + CHARACTERS.length - 1) % CHARACTERS.length; playSound('select'); }
    if (justPressed(P2_CONTROLS.right)) { select.p2Index = (select.p2Index + 1) % CHARACTERS.length; playSound('select'); }
    if (justPressed(P2_CONTROLS.punch)) { select.p2Locked = true; playSound('confirm'); }
  } else if (justPressed(P2_CONTROLS.kick)) { select.p2Locked = false; playSound('select'); }

  if (select.p1Locked && select.p2Locked) {
    select.countdown++;
    if (select.countdown > 60) startFight();
  } else { select.countdown = 0; }
}

function startFight() {
  fighter1 = createFighter(CHARACTERS[select.p1Index], 200, 1, P1_CONTROLS);
  fighter2 = createFighter(CHARACTERS[select.p2Index], CANVAS_W - 200 - FIGHTER_WIDTH, -1, P2_CONTROLS);
  roundsWon = { p1: 0, p2: 0 };
  roundNumber = 1;
  roundTimer = 99;
  projectiles = []; particles = []; popups = [];
  gameState = 'ROUND_INTRO';
  stateTimer = 0;
}

function resetFightersForRound() {
  [fighter1, fighter2].forEach(function (f, i) {
    f.x = i === 0 ? 200 : CANVAS_W - 200 - FIGHTER_WIDTH;
    f.y = GROUND_Y; f.vx = 0; f.vy = 0;
    f.hp = f.maxHp; f.displayHp = f.maxHp;
    f.state = 'idle'; f.stateTimer = 0;
    f.hasHit = false; f.hitFlash = 0;
    f.cooldowns = { punch: 0, kick: 0, fwd_punch: 0, fwd_kick: 0, special: 0, parry: 0 };
    f.meter = 0; f.parryStunned = false; f.stunned = false; f.blocking = false;
    f.grounded = true; f.comboCount = 0; f.comboTimer = 0; f.airAttacked = false;
    f.hyperTimer = 0; f.hyperMove = null;
  });
  projectiles = []; particles = []; popups = [];
  roundTimer = 99; history = []; rewindEffect = 0; rewindGhosts = []; slowmo = 0;
}

// --- Round Intro ---
function updateRoundIntro() {
  stateTimer++;
  if (stateTimer === 75) playSound('fight');
  if (stateTimer > 105) gameState = 'FIGHT';
}

function drawRoundIntro() {
  drawFightScene();
  ctx.textAlign = 'center';
  if (stateTimer < 70) {
    var scale = Math.min(1, stateTimer / 15);
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 40);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 56px monospace';
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3;
    ctx.strokeText('RUNDE ' + roundNumber, 0, 0);
    ctx.fillText('RUNDE ' + roundNumber, 0, 0);
    ctx.restore();
  } else {
    var pulse = 1 + Math.sin(stateTimer * 0.4) * 0.08;
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 40);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 72px monospace';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.strokeText('FIGHT!', 0, 0);
    ctx.fillText('FIGHT!', 0, 0);
    ctx.restore();
  }
}

// --- Fight ---
function updateFight() {
  recordHistory();
  if (rewindEffect > 0) rewindEffect--;

  if (slowmo > 0) {
    slowmo--;
    if (slowmo % 3 !== 0) {
      updateParticles();
      return;
    }
  }

  if (hitstop > 0) { hitstop--; return; }

  if (impactEffect && impactEffect.life > 0) { impactEffect.life--; if (impactEffect.life <= 0) impactEffect = null; }
  if (slashStreak && slashStreak.life > 0) { slashStreak.life--; if (slashStreak.life <= 0) slashStreak = null; }
  if (flashBurst > 0) flashBurst = Math.max(0, flashBurst - 0.05);

  updateFighter(fighter1);
  updateFighter(fighter2);
  checkMeleeHit(fighter1, fighter2);
  if (gameState !== 'FIGHT') return;
  checkMeleeHit(fighter2, fighter1);
  if (gameState !== 'FIGHT') return;
  checkProjectileSpawn(fighter1);
  checkProjectileSpawn(fighter2);
  checkRewindTrigger(fighter1);
  checkRewindTrigger(fighter2);
  checkHyperTrigger(fighter1);
  checkHyperTrigger(fighter2);
  updateProjectiles();

  roundTimer -= 1 / 60;
  if (roundTimer < 0) roundTimer = 0;
  if (fighter1.hp <= 0 || fighter2.hp <= 0 || roundTimer <= 0) endRound();
}

function endRound() {
  var winner;
  if (fighter1.hp <= 0 && fighter2.hp <= 0) winner = 'draw';
  else if (fighter1.hp <= 0) winner = 'p2';
  else if (fighter2.hp <= 0) winner = 'p1';
  else if (fighter1.hp > fighter2.hp) winner = 'p1';
  else if (fighter2.hp > fighter1.hp) winner = 'p2';
  else winner = 'draw';

  var ko = fighter1.hp <= 0 || fighter2.hp <= 0;
  if (ko) { playSound('ko'); shake = 14; }

  if (winner === 'p1') {
    roundsWon.p1++;
    roundResultText = ko ? 'K.O.!' : fighter1.charDef.name.toUpperCase() + ' GEWINNT DIE RUNDE!';
    fighter1.state = 'win';
    if (ko) fighter2.state = 'ko';
  } else if (winner === 'p2') {
    roundsWon.p2++;
    roundResultText = ko ? 'K.O.!' : fighter2.charDef.name.toUpperCase() + ' GEWINNT DIE RUNDE!';
    fighter2.state = 'win';
    if (ko) fighter1.state = 'ko';
  } else {
    roundResultText = 'UNENTSCHIEDEN!';
  }
  gameState = 'ROUND_END';
  stateTimer = 0;
}

function updateRoundEnd() {
  stateTimer++;
  fighter1.animTime++; fighter2.animTime++;
  [fighter1, fighter2].forEach(function (f) {
    if (f.displayHp > f.hp) f.displayHp = Math.max(f.hp, f.displayHp - 0.7);
  });
  updateParticles();
  if (stateTimer > 150) {
    if (roundsWon.p1 >= 2 || roundsWon.p2 >= 2) {
      var winnerF = roundsWon.p1 > roundsWon.p2 ? fighter1 : fighter2;
      matchResultText = winnerF.charDef.name.toUpperCase() + ' GEWINNT DEN KAMPF!';
      gameState = 'MATCH_END';
      stateTimer = 0;
    } else {
      roundNumber++;
      resetFightersForRound();
      gameState = 'ROUND_INTRO';
      stateTimer = 0;
    }
  }
}

function updateMatchEnd() {
  stateTimer++;
  fighter1.animTime++; fighter2.animTime++;
  updateParticles();
  if (stateTimer % 8 === 0) {
    var winnerF = roundsWon.p1 > roundsWon.p2 ? fighter1 : fighter2;
    var colors = ['#ffcc00', '#ff5252', '#74b9ff', '#2ecc71', '#e67e22'];
    particles.push({
      x: winnerF.x + Math.random() * FIGHTER_WIDTH, y: winnerF.y - 30,
      vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 4 - 1,
      life: 50, maxLife: 50,
      color: colors[Math.floor(Math.random() * colors.length)], size: 4,
    });
  }
  if (justPressed(P1_CONTROLS.punch) || justPressed(P2_CONTROLS.punch)) {
    select.p1Locked = false; select.p2Locked = false; select.countdown = 0;
    playSound('confirm');
    gameState = 'SELECT';
  }
}

// --- Rendering ---
function drawBackground() {
  var grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#1d2951');
  grad.addColorStop(0.6, '#4a3c78');
  grad.addColorStop(1, '#8a6fb1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  bgStars.forEach(function (s) {
    var tw = 0.4 + Math.abs(Math.sin(globalTime * 0.02 + s.tw)) * 0.6;
    ctx.fillStyle = 'rgba(255,255,255,' + tw + ')';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });

  var glow = ctx.createRadialGradient(1060, 120, 40, 1060, 120, 145);
  glow.addColorStop(0, 'rgba(255,221,153,0.35)');
  glow.addColorStop(1, 'rgba(255,221,153,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(900, -40, 320, 320);
  ctx.fillStyle = '#ffdd99';
  ctx.beginPath(); ctx.arc(1060, 120, 65, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(220,190,140,0.5)';
  ctx.beginPath();
  ctx.arc(1040, 100, 12, 0, Math.PI * 2);
  ctx.arc(1080, 140, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e1e3a';
  BUILDINGS.forEach(function (b) { ctx.fillRect(b[0], b[1], b[2], b[3]); });
  bgWindows.forEach(function (w, i) {
    var on = !w[2] || Math.sin(globalTime * 0.03 + i * 7) > -0.6;
    ctx.fillStyle = on ? 'rgba(255,220,130,0.8)' : 'rgba(60,60,90,0.8)';
    ctx.fillRect(w[0], w[1], 8, 11);
  });

  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
  ctx.fillStyle = '#555';
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  for (var x = 30; x < CANVAS_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR_Y + 20); ctx.lineTo(x + 40, FLOOR_Y + 20); ctx.stroke();
  }
}

function drawFighter(f) {
  var airborne = (GROUND_Y - f.y) / 100;
  var shadowScale = Math.max(0.4, 1 - airborne * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(f.x + FIGHTER_WIDTH / 2, FLOOR_Y + 8, 34 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dash afterimages
  if (f.afterimages && f.afterimages.length) {
    f.afterimages.forEach(function (g) {
      ctx.save();
      ctx.globalAlpha = (g.life / 8) * 0.35;
      ctx.translate(g.x + FIGHTER_WIDTH / 2, g.y);
      ctx.scale(g.facing, 1);
      ctx.translate(-FIGHTER_WIDTH / 2, 0);
      f.charDef.draw(ctx, { charDef: f.charDef, state: g.state, stateTimer: 0, hitFlash: 0, facing: g.facing, animTime: g.animTime, grounded: true, blocking: false, stunned: false }, FIGHTER_WIDTH, FIGHTER_HEIGHT);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(f.x + FIGHTER_WIDTH / 2, f.y);
  ctx.scale(f.facing, 1);
  ctx.translate(-FIGHTER_WIDTH / 2, 0);
  f.charDef.draw(ctx, f, FIGHTER_WIDTH, FIGHTER_HEIGHT);
  ctx.restore();

  if (f.hyperTimer > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffe066';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    var secs = Math.ceil(f.hyperTimer / 60);
    ctx.strokeText('WACH: ' + secs + 's', f.x + FIGHTER_WIDTH / 2, f.y - 14);
    ctx.fillText('WACH: ' + secs + 's', f.x + FIGHTER_WIDTH / 2, f.y - 14);
    ctx.restore();
  }
}

function drawParticles() {
  particles.forEach(function (p) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
  popups.forEach(function (pop) {
    ctx.globalAlpha = Math.min(1, pop.life / 20);
    ctx.fillStyle = pop.color;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillText(pop.text, pop.x, pop.y);
  });
  ctx.globalAlpha = 1;
}

function drawHealthBar(x, f, flip) {
  var w = 500, h = 24;
  ctx.fillStyle = '#222';
  ctx.fillRect(x, 20, w, h);

  var trailPct = Math.max(0, f.displayHp / f.maxHp);
  ctx.fillStyle = '#922';
  if (flip) ctx.fillRect(x + w * (1 - trailPct), 20, w * trailPct, h);
  else ctx.fillRect(x, 20, w * trailPct, h);

  var pct = Math.max(0, f.hp / f.maxHp);
  ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.2 ? '#f39c12' : '#e74c3c';
  if (pct <= 0.2 && globalTime % 20 < 10) ctx.fillStyle = '#ff1744';
  if (flip) ctx.fillRect(x + w * (1 - pct), 20, w * pct, h);
  else ctx.fillRect(x, 20, w * pct, h);

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.strokeRect(x, 20, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = flip ? 'right' : 'left';
  ctx.fillText(f.charDef.name, flip ? x + w : x, 16);

  var specMove = f.charDef.moves.special;
  var usesCooldown = !!specMove.cooldown;
  var ready = usesCooldown ? f.cooldowns.special === 0 : f.meter >= METER_MAX;
  var fillPct = usesCooldown ? (1 - f.cooldowns.special / specMove.cooldown) : (f.meter / METER_MAX);
  var barW = 160, barY = 52;
  var bx = flip ? x + w - barW : x;
  ctx.fillStyle = '#222';
  ctx.fillRect(bx, barY, barW, 8);
  ctx.fillStyle = ready ? '#ffcc00' : '#666';
  if (flip) ctx.fillRect(bx + barW * (1 - fillPct), barY, barW * fillPct, 8);
  else ctx.fillRect(bx, barY, barW * fillPct, 8);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.strokeRect(bx, barY, barW, 8);
  ctx.fillStyle = ready ? '#ffcc00' : '#999';
  ctx.font = '11px monospace';
  ctx.fillText(ready ? '★ ' + specMove.name + ' BEREIT' : specMove.name, flip ? x + w : x, barY + 20);
}

function drawHUD() {
  drawHealthBar(20, fighter1, false);
  drawHealthBar(CANVAS_W - 520, fighter2, true);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(CANVAS_W / 2 - 38, 14, 76, 38);
  ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2;
  ctx.strokeRect(CANVAS_W / 2 - 38, 14, 76, 38);
  ctx.fillStyle = roundTimer <= 10 ? '#ff5252' : '#fff';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(Math.ceil(roundTimer), CANVAS_W / 2, 42);

  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText('Runde ' + roundNumber, CANVAS_W / 2, 68);

  for (var i = 0; i < 2; i++) {
    ctx.fillStyle = i < roundsWon.p1 ? '#ffcc00' : '#555';
    ctx.beginPath(); ctx.arc(CANVAS_W / 2 - 60 - i * 20, 80, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = i < roundsWon.p2 ? '#ffcc00' : '#555';
    ctx.beginPath(); ctx.arc(CANVAS_W / 2 + 60 + i * 20, 80, 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRewindOverlay() {
  if (rewindEffect <= 0) return;
  var t = rewindEffect / 50;
  ctx.globalAlpha = 0.22 * t;
  rewindGhosts.forEach(function (snap) {
    [fighter1, fighter2].forEach(function (f, fi) {
      var s = fi === 0 ? snap.f1 : snap.f2;
      ctx.save();
      ctx.translate(s.x + FIGHTER_WIDTH / 2, s.y);
      ctx.scale(s.facing, 1);
      ctx.translate(-FIGHTER_WIDTH / 2, 0);
      f.charDef.draw(ctx, { charDef: f.charDef, state: 'idle', stateTimer: 0, hitFlash: 0, facing: s.facing, animTime: globalTime, grounded: s.grounded, blocking: false }, FIGHTER_WIDTH, FIGHTER_HEIGHT);
      ctx.restore();
    });
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(125, 95, 255, ' + (0.18 * t) + ')';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 230, 195, ' + (0.6 * t) + ')';
  ctx.lineWidth = 3;
  for (var r = 0; r < 3; r++) {
    var radius = (1 - t) * 420 + r * 70;
    ctx.beginPath(); ctx.arc(CANVAS_W / 2, CANVAS_H / 2 - 40, radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// --- Cinematic rendering ---
function cinLerp(a, b, t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return a + (b - a) * t; }

function mkActor(charDef, state, stateTimer, extra) {
  var o = { charDef: charDef, state: state, stateTimer: stateTimer, animTime: globalTime, grounded: true, hitFlash: 0, stunned: false, facing: 1, blocking: false };
  if (extra) for (var k in extra) o[k] = extra[k];
  return o;
}

function drawActor(charDef, centerX, feetY, facing, scale, st, rot) {
  ctx.save();
  ctx.translate(centerX, feetY);
  ctx.scale(facing * scale, scale);
  if (rot) {
    ctx.translate(0, -FIGHTER_HEIGHT * 0.5);
    ctx.rotate(rot);
    ctx.translate(0, FIGHTER_HEIGHT * 0.5);
  }
  ctx.translate(-FIGHTER_WIDTH / 2, -FIGHTER_HEIGHT);
  charDef.draw(ctx, st, FIGHTER_WIDTH, FIGHTER_HEIGHT);
  ctx.restore();
}

function cinSpark(x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = 0.9;
  for (var i = 0; i < 8; i++) {
    var a = (i / 8) * Math.PI * 2 + globalTime * 0.1;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

function cinRings(x, y, p, color) {
  if (p < 0 || p > 1) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.globalAlpha = 1 - p;
  for (var r = 0; r < 3; r++) {
    ctx.beginPath(); ctx.arc(x, y, p * 220 + r * 40, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function cinCrater(x, y, p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p);
  ctx.strokeStyle = '#caa86b'; ctx.lineWidth = 4;
  for (var i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + i * 40, y - 30 - Math.abs(i) * 8 - p * 40);
    ctx.stroke();
  }
  ctx.globalAlpha = Math.max(0, 0.6 - p * 0.6);
  ctx.fillStyle = '#9a8468';
  ctx.beginPath(); ctx.ellipse(x, y, 120 * (0.5 + p), 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSpeedLines(cin) {
  ctx.save();
  var cxp = CANVAS_W / 2, cyp = CANVAS_H / 2 - 20;
  ctx.strokeStyle = cin.kind === 'max' ? 'rgba(120,180,90,0.10)' : 'rgba(200,80,120,0.12)';
  ctx.lineWidth = 3;
  for (var i = 0; i < 40; i++) {
    var a = (i / 40) * Math.PI * 2 + cin.timer * 0.02;
    var r0 = 200 + (i % 3) * 50;
    ctx.beginPath();
    ctx.moveTo(cxp + Math.cos(a) * r0, cyp + Math.sin(a) * r0);
    ctx.lineTo(cxp + Math.cos(a) * 1100, cyp + Math.sin(a) * 1100);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCinSlashes(cin) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  for (var i = 0; i < 4; i++) {
    var phase = (cin.timer * 0.08 + i * 1.7) % 3;
    if (phase > 1.2) continue;
    var alpha = 1 - phase;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4 + (1 - phase) * 8;
    var ox = CANVAS_W / 2 + (i % 2 ? -1 : 1) * (120 + i * 30);
    var oy = 260 + (i * 60);
    var dir = i % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(ox - dir * 220, oy - 160);
    ctx.lineTo(ox + dir * 220, oy + 160);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGiantSlash(x, p) {
  ctx.save();
  ctx.translate(x, CANVAS_H / 2 - 20);
  ctx.rotate(-0.9);
  var len = 1400 * p;
  var grad = ctx.createLinearGradient(0, -len / 2, 0, len / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10 + (1 - p) * 40;
  ctx.beginPath(); ctx.moveTo(0, -len / 2); ctx.lineTo(0, len / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,80,120,0.6)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, -len / 2); ctx.lineTo(0, len / 2); ctx.stroke();
  ctx.restore();
}

function drawMaxSuper(cin) {
  var T = cin.timer;
  var max = cin.attacker.charDef, opp = cin.defender.charDef;
  var CX = CANVAS_W / 2;
  if (T < 60) {
    var s = cinLerp(2.9, 2.4, T / 60);
    drawActor(opp, CX + 110, 500, -1, s, mkActor(opp, 'hit', T));
    drawActor(max, CX - 120, 500, 1, s, mkActor(max, 'special', 10));
    if (T < 14) cinSpark(CX, 360, 90, '#ffe066');
  } else if (T < 126) {
    var push = cinLerp(0, 45, (T - 60) / 66);
    drawActor(opp, CX + 95 - push * 0.3, 525, -1, 3.0, mkActor(opp, 'hit', 14));
    drawActor(max, CX - 110 + push, 525, 1, 3.0, mkActor(max, 'fwd_kick', 16));
    if (T >= 64 && T < 82) cinSpark(CX, 380, 70, '#ffffff');
  } else if (T < 204) {
    var lift = (T - 126) / 60;
    drawActor(max, CX - 20, 545, 1, 2.4, mkActor(max, 'special', 24));
    var rot = cinLerp(0.3, Math.PI * 0.95, lift);
    var dfy = cinLerp(430, 250, lift);
    drawActor(opp, CX - 20, dfy, -1, 2.3, mkActor(opp, 'hit', 20), rot);
  } else if (T < 250) {
    var prog = (T - 204) / 30;
    drawActor(max, CX - 40, 555, 1, 2.6, mkActor(max, 'fwd_punch', 18));
    var dfy2 = cinLerp(250, 565, prog);
    var rot2 = cinLerp(Math.PI * 0.95, Math.PI * 1.5, prog);
    drawActor(opp, CX + 70, dfy2, -1, 2.6, mkActor(opp, prog > 0.9 ? 'ko' : 'hit', 6), rot2);
    if (T >= 214) cinCrater(CX + 50, FLOOR_Y, (T - 214) / 36);
  } else {
    drawActor(max, CX - 150, 560, 1, 1.9, mkActor(max, 'win', T));
    drawActor(opp, CX + 110, 580, -1, 1.9, mkActor(opp, 'ko', 0));
    cinRings(CX + 50, 540, (T - 250) / 60, '#ffcc00');
  }
}

function drawLukaSuper(cin) {
  var T = cin.timer;
  var luka = cin.attacker.charDef, opp = cin.defender.charDef;
  var CX = CANVAS_W / 2;
  if (T < 54) {
    var s = cinLerp(2.7, 2.3, T / 54);
    var dashX = cinLerp(-220, CX - 120, T / 42);
    drawActor(opp, CX + 110, 500, -1, s, mkActor(opp, 'idle', 0));
    ctx.save(); ctx.globalAlpha = 0.45;
    drawActor(luka, dashX, 500, 1, s, mkActor(luka, 'special', 8));
    ctx.restore();
    drawActor(luka, CX - 120, 500, 1, s, mkActor(luka, 'special', 12));
  } else if (T < 130) {
    drawActor(luka, CX - 100, 520, 1, 2.8, mkActor(luka, 'special', 18));
    drawActor(opp, CX + 90, 520, -1, 2.8, mkActor(opp, 'hit', (T % 18) < 9 ? 16 : 8));
    drawCinSlashes(cin);
  } else if (T < 210) {
    var jump = (T - 130) / 60;
    var g = ctx.createRadialGradient(CX, 300, 30, CX, 300, 260);
    g.addColorStop(0, 'rgba(255,240,210,0.5)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g; ctx.fillRect(CX - 260, 40, 520, 520);
    drawActor(opp, CX + 70, 580, -1, 2.4, mkActor(opp, 'hit', 22));
    var ly = cinLerp(545, 340, jump);
    drawActor(luka, CX - 40, ly, 1, 2.5, mkActor(luka, 'special', 14));
  } else if (T < 250) {
    var prog = (T - 210) / 22;
    drawActor(opp, CX + 60, 580, -1, 2.6, mkActor(opp, prog > 0.8 ? 'ko' : 'hit', 6));
    drawActor(luka, CX - 30, 560, 1, 2.6, mkActor(luka, 'kick', 18));
    drawGiantSlash(CX + 30, prog < 1 ? prog : 1);
  } else {
    drawActor(luka, CX - 150, 560, 1, 1.9, mkActor(luka, 'win', T));
    drawActor(opp, CX + 110, 580, -1, 1.9, mkActor(opp, 'ko', 0));
    cinRings(CX + 50, 520, (T - 250) / 60, '#ff4d6d');
  }
}

function cinCaption(text, color) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px monospace';
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  ctx.strokeText(text, CANVAS_W / 2, CANVAS_H - 96);
  ctx.fillStyle = color || '#fff';
  ctx.fillText(text, CANVAS_W / 2, CANVAS_H - 96);
  ctx.restore();
}

function drawPiercingGun(x, y, dir, fire) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#d24b8a';
  ctx.fillRect(-6, -6, 26, 12);      // body
  ctx.fillRect(-2, 4, 8, 14);        // grip
  ctx.fillStyle = '#3a2030';
  ctx.fillRect(20, -3, 8, 6);        // nozzle
  ctx.fillStyle = '#f5d76e';
  ctx.beginPath(); ctx.arc(28, 0, 2.6, 0, Math.PI * 2); ctx.fill(); // gold stud
  if (fire > 0) {
    ctx.strokeStyle = 'rgba(245,215,110,' + fire + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(30 + Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(30 + Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawNovaShopExterior(cin) {
  var FY = 524;
  // night street
  ctx.fillStyle = '#120e1d'; ctx.fillRect(0, FY, CANVAS_W, CANVAS_H - FY);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
  for (var sx = 40; sx < CANVAS_W; sx += 90) { ctx.beginPath(); ctx.moveTo(sx, FY + 30); ctx.lineTo(sx + 46, FY + 30); ctx.stroke(); }
  // shop building (right half)
  ctx.fillStyle = '#241d31'; ctx.fillRect(420, 150, 360, FY - 150);
  ctx.fillStyle = '#1a1525'; ctx.fillRect(420, 150, 360, 18);
  // big window
  ctx.fillStyle = '#352a47'; ctx.fillRect(450, 250, 150, 170);
  ctx.strokeStyle = '#4a3c5e'; ctx.lineWidth = 3; ctx.strokeRect(450, 250, 150, 170);
  // door
  ctx.fillStyle = '#15101f'; ctx.fillRect(640, 320, 96, FY - 320);
  ctx.strokeStyle = '#4a3c5e'; ctx.strokeRect(640, 320, 96, FY - 320);
  ctx.fillStyle = '#caa24a'; ctx.beginPath(); ctx.arc(652, 440, 4, 0, Math.PI * 2); ctx.fill();
  // neon sign (flicker)
  var flick = (cin.timer % 23) < 2 ? 0.4 : 1;
  ctx.save(); ctx.globalAlpha = flick;
  ctx.fillStyle = '#ff5fa2'; ctx.textAlign = 'center'; ctx.font = 'bold 30px monospace';
  ctx.fillText('PIERCING', 600, 210);
  ctx.strokeStyle = 'rgba(255,95,162,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(470, 184, 260, 36);
  ctx.restore();
}

function drawNovaShopInterior() {
  var FY = 520;
  // warm back wall + floor
  ctx.fillStyle = '#2c2233'; ctx.fillRect(0, 90, CANVAS_W, FY - 90);
  ctx.fillStyle = '#3a2c36'; ctx.fillRect(0, FY, CANVAS_W, CANVAS_H - FY);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2;
  for (var fx = 0; fx < CANVAS_W; fx += 70) { ctx.beginPath(); ctx.moveTo(fx, FY); ctx.lineTo(fx + 30, CANVAS_H); ctx.stroke(); }
  // round mirror (left)
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(150, 250, 62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(180,200,230,0.12)'; ctx.beginPath(); ctx.arc(150, 250, 58, 0, Math.PI * 2); ctx.fill();
  // shelf with studs (right)
  ctx.fillStyle = '#4a3340'; ctx.fillRect(980, 230, 220, 14);
  ctx.fillStyle = '#f5d76e';
  for (var i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(1000 + i * 28, 224, 3, 0, Math.PI * 2); ctx.fill(); }
  // counter (left)
  ctx.fillStyle = '#4a3340'; ctx.fillRect(40, 380, 150, FY - 380);
  ctx.fillStyle = '#5a4150'; ctx.fillRect(40, 372, 150, 12);
  // potted plant (right)
  ctx.fillStyle = '#3a5a3a';
  ctx.beginPath(); ctx.ellipse(1130, 470, 28, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a4a30'; ctx.fillRect(1118, 500, 24, 20);
}

function drawNovaStool(x, topY) {
  ctx.fillStyle = '#5a4250';
  ctx.fillRect(x - 26, topY, 52, 12);
  ctx.fillStyle = '#3f2e3a';
  ctx.fillRect(x - 22, topY + 12, 7, 48);
  ctx.fillRect(x + 15, topY + 12, 7, 48);
}

// Phase boundaries (frames) — generously long so every line of dialogue can be read
var NOVA_A_END = 300;   // walk to the studio together
var NOVA_B_END = 370;   // door bell / fade in
var NOVA_C_END = 570;   // sit down on the stool
// relative to NOVA_C_END:
var NOVA_D1 = 170;  // "Halt mal kurz ganz still..."
var NOVA_D2 = 370;  // "Vertrau mir, ich mach das staendig."
var NOVA_D3 = 500;  // "Kurz desinfizieren..." (whoosh)
var NOVA_D4 = 660;  // "Tief durchatmen..." (rings + click near the end)
var NOVA_D5 = 820;  // "Fertig! Steht dir echt mega." (confirm)
var NOVA_E1 = 960;  // "..."
var NOVA_E2 = 1120; // "uebrigens —"
var NOVA_F_END = 1170; // the haymaker
var NOVA_G_LEN = 160;   // closing line

function drawNovaSuper(cin) {
  var T = cin.timer;
  var nova = cin.attacker.charDef, opp = cin.defender.charDef;
  var CX = CANVAS_W / 2;
  var s = 2.4;
  var FY = 520;
  var novaX = CX - 100, oppX = CX + 95;
  var headY = FY - FIGHTER_HEIGHT * s * 0.86;

  if (T < NOVA_A_END) {
    // Phase A: walk together to the piercing studio
    drawNovaShopExterior(cin);
    var walk = T / 260;
    var nx = cinLerp(-120, 470, Math.min(1, walk));
    var ox = cinLerp(-240, 360, Math.min(1, walk));
    drawActor(opp, ox, FY + 4, 1, 2.2, mkActor(opp, 'walk', T * 3));
    drawActor(nova, nx, FY + 4, 1, 2.2, mkActor(nova, 'walk', T * 3 + 20));
    if (T < 150) cinCaption('Nova schleppt dich zum Piercing-Studio...', '#ffd9ec');
    else cinCaption('Komm schon, wird auch gar nicht weh.', '#ffd9ec');
  } else if (T < NOVA_B_END) {
    // Phase B: enter — door bell, fade into interior
    drawNovaShopExterior(cin);
    var fade = (T - NOVA_A_END) / (NOVA_B_END - NOVA_A_END);
    ctx.fillStyle = 'rgba(0,0,0,' + fade + ')';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    cinCaption('*Tuerklingel klingelt*', '#fff');
  } else if (T < NOVA_C_END) {
    // Phase C: interior, opponent walks to the stool and sits down
    drawNovaShopInterior();
    drawNovaStool(oppX + 20, FY - 56);
    var sit = (T - NOVA_B_END) / (NOVA_C_END - NOVA_B_END);
    var ox2 = cinLerp(CANVAS_W + 120, oppX, Math.min(1, sit * 1.3));
    var sittingY = sit > 0.85 ? FY + 36 : FY;   // plop down at the end
    drawActor(nova, novaX, FY, 1, s, mkActor(nova, 'idle', T));
    drawActor(opp, ox2, sittingY, -1, s * (sit > 0.85 ? 0.92 : 1), mkActor(opp, sit > 0.85 ? 'idle' : 'walk', T * 3));
    cinCaption('Setz dich, entspann dich.', '#ffd9ec');
  } else {
    // Interior is the stage for the whole piercing bit + punch
    drawNovaShopInterior();
    drawNovaStool(oppX + 20, FY - 56);
    var sx2 = oppX + 12;          // seated opponent slightly forward, lower
    var seatY = FY + 36;
    var t2 = T - NOVA_C_END;
    if (t2 < NOVA_D5) {
      // Phase D: the piercing procedure (no zoom, steady shot)
      drawActor(opp, sx2, seatY, -1, s * 0.92, mkActor(opp, 'idle', 0));
      drawActor(nova, novaX, FY, 1, s, mkActor(nova, 'special', 30));
      drawPiercingGun(novaX + 74, headY + 70, 1, t2 >= NOVA_D4 - 16 ? Math.max(0, 1 - (t2 - (NOVA_D4 - 16)) / 16) : 0);
      // nervous sweat
      if (t2 < NOVA_D3 && t2 % 26 < 14) {
        ctx.fillStyle = '#9fd3ff';
        ctx.beginPath(); ctx.arc(sx2 + 24, headY + 78 + (t2 % 26), 3, 0, Math.PI * 2); ctx.fill();
      }
      if (t2 >= NOVA_D3 && t2 < NOVA_D4) cinRings(sx2 + 18, headY + 76, ((t2 - NOVA_D3) % 40) / 40, '#f5d76e');
      if (t2 >= NOVA_D4) { ctx.fillStyle = '#f5d76e'; ctx.beginPath(); ctx.arc(sx2 + 20, headY + 76, 3.6, 0, Math.PI * 2); ctx.fill(); }
      if (t2 < NOVA_D1) cinCaption('Halt mal kurz ganz still...', '#ffd9ec');
      else if (t2 < NOVA_D2) cinCaption('Vertrau mir, ich mach das staendig.', '#ffd9ec');
      else if (t2 < NOVA_D3) cinCaption('Kurz desinfizieren...', '#9fd3ff');
      else if (t2 < NOVA_D4) cinCaption('Tief durchatmen...', '#fff');
      else cinCaption('Fertig! Steht dir echt mega.', '#f5d76e');
    } else if (t2 < NOVA_E2) {
      // Phase E: awkward beat — opponent admires the new piercing
      drawActor(opp, sx2, seatY, -1, s * 0.92, mkActor(opp, 'idle', 0));
      drawActor(nova, novaX, FY, 1, s, mkActor(nova, 'win', T));
      ctx.fillStyle = '#f5d76e'; ctx.beginPath(); ctx.arc(sx2 + 20, headY + 76, 3.6, 0, Math.PI * 2); ctx.fill();
      if (t2 < NOVA_E1) cinCaption('...', '#fff');
      else cinCaption('uebrigens —', '#ff9100');
    } else if (t2 < NOVA_F_END) {
      // Phase F: the completely unexpected haymaker
      var pr = (t2 - NOVA_E2) / (NOVA_F_END - NOVA_E2);
      drawActor(opp, sx2 + Math.min(1, pr) * 40, seatY - Math.min(1, pr) * 30, -1, s * 0.92, mkActor(opp, pr > 0.6 ? 'ko' : 'hit', 6));
      drawActor(nova, novaX + 16, FY, 1, s * 1.05, mkActor(nova, 'fwd_punch', 18));
      if (t2 >= NOVA_E2 + 18) cinRings(sx2 + 20, headY + 90, (t2 - (NOVA_E2 + 18)) / 18, '#ff3b3b');
      cinCaption('PSYCH!!', '#ff3b3b');
    } else {
      drawActor(nova, novaX - 10, FY, 1, 2.0, mkActor(nova, 'win', T));
      drawActor(opp, oppX + 70, 580, -1, 2.0, mkActor(opp, 'ko', 0));
      cinRings(oppX + 40, 520, (t2 - NOVA_F_END) / NOVA_G_LEN, '#f5d76e');
      cinCaption('Kein Umtausch. Tschuess!', '#f5d76e');
    }
  }
}

function drawSuperBanner(cin) {
  var T = cin.timer;
  var name = cin.attacker.charDef.moves.special.name.toUpperCase();
  var who = cin.attacker.charDef.name.toUpperCase();
  var slide = Math.min(1, T / 18);
  var out = T > cin.total - 28 ? Math.max(0, (cin.total - T) / 28) : 1;
  var x = CANVAS_W / 2 + (1 - slide) * -500;
  ctx.save();
  ctx.globalAlpha = out;
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px monospace';
  ctx.lineWidth = 6; ctx.strokeStyle = '#000';
  ctx.strokeText(name, x, 54);
  ctx.fillStyle = '#fff';
  ctx.fillText(name, x, 54);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = cin.kind === 'max' ? '#9fe06a' : '#ff6f91';
  ctx.fillText('★ ' + who + ' ★', CANVAS_W / 2 + (1 - slide) * 500, CANVAS_H - 26);
  ctx.restore();
}

function drawCinematic() {
  var cin = cinematic;
  if (!cin) return;
  var T = cin.timer;
  var bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  if (cin.kind === 'max') { bg.addColorStop(0, '#10140a'); bg.addColorStop(1, '#04060a'); }
  else if (cin.kind === 'nova') { bg.addColorStop(0, '#201326'); bg.addColorStop(1, '#0a0610'); }
  else { bg.addColorStop(0, '#160a18'); bg.addColorStop(1, '#05030a'); }
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (cin.kind !== 'nova') drawSpeedLines(cin);
  if (cin.kind === 'max') drawMaxSuper(cin);
  else if (cin.kind === 'nova') drawNovaSuper(cin);
  else drawLukaSuper(cin);
  drawParticles();

  var vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, 200, CANVAS_W / 2, CANVAS_H / 2, 760);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  var barH = 80 * Math.min(1, T / 12);
  if (cin.total - T < 14) barH = 80 * Math.max(0, (cin.total - T) / 14);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, barH);
  ctx.fillRect(0, CANVAS_H - barH, CANVAS_W, barH);

  drawSuperBanner(cin);

  if (cin.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + cin.flash + ')'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }
}

function drawSlashStreak() {
  if (!slashStreak) return;
  var t = slashStreak.life / slashStreak.maxLife;
  ctx.save();
  ctx.translate(slashStreak.x, slashStreak.y);
  ctx.scale(slashStreak.facing, 1);
  ctx.rotate(-0.5);
  ctx.globalAlpha = t;
  var grad = ctx.createLinearGradient(-170, 0, 170, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, slashStreak.color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 6 + (1 - t) * 10;
  ctx.beginPath(); ctx.moveTo(-170, 0); ctx.lineTo(170, 0); ctx.stroke();
  ctx.restore();
}

function drawImpactEffect() {
  if (!impactEffect) return;
  var t = impactEffect.life / impactEffect.maxLife;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.strokeStyle = impactEffect.color;
  ctx.lineWidth = 4;
  for (var r = 0; r < 3; r++) {
    var radius = (1 - t) * 100 + r * 28;
    ctx.beginPath(); ctx.arc(impactEffect.x, impactEffect.y, radius, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  if (impactEffect.label && t > 0.35) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 1.6);
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    var scale = 1 + (1 - t) * 0.5;
    ctx.translate(impactEffect.x, impactEffect.y - 75);
    ctx.scale(scale, scale);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeText(impactEffect.label, 0, 0);
    ctx.fillStyle = impactEffect.color;
    ctx.fillText(impactEffect.label, 0, 0);
    ctx.restore();
  }
}

function drawFightScene() {
  drawBackground();
  drawFighter(fighter1);
  drawFighter(fighter2);
  projectiles.forEach(function (p) { drawProjectile(ctx, p); });
  drawParticles();
  drawRewindOverlay();
  drawSlashStreak();
  drawImpactEffect();
  if (flashBurst > 0) {
    ctx.fillStyle = 'rgba(255,250,210,' + flashBurst + ')';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  drawHUD();
}

function drawOverlay(text, withRematch) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, CANVAS_H / 2 - 60, CANVAS_W, 120);
  var pulse = 1 + Math.sin(stateTimer * 0.1) * 0.03;
  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 5);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2;
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  if (withRematch) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Drücke F (P1) oder K (P2) für ein Rematch', CANVAS_W / 2, CANVAS_H / 2 + 35);
  }
}

function drawSelect() {
  drawBackground();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('HOCHDAHL FIGHTERS', CANVAS_W / 2, 55);

  var gap = 14;
  var cardW = Math.min(200, Math.floor((CANVAS_W - 70 - (CHARACTERS.length - 1) * gap) / CHARACTERS.length));
  var cardH = 290;
  var totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * gap;
  var startX = (CANVAS_W - totalW) / 2;
  var cardY = 90;

  CHARACTERS.forEach(function (c, i) {
    var x = startX + i * (cardW + gap);
    var isHovered = select.p1Index === i || select.p2Index === i;
    var lift = isHovered ? -6 : 0;

    ctx.fillStyle = c.palette.primary;
    ctx.fillRect(x, cardY + lift, cardW, cardH);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeRect(x, cardY + lift, cardW, cardH);

    ctx.save();
    ctx.translate(x + cardW / 2 - FIGHTER_WIDTH / 2, cardY + 20 + lift);
    c.draw(ctx, { state: 'idle', stateTimer: 0, hitFlash: 0, charDef: c, facing: 1, animTime: globalTime + i * 25, grounded: true, blocking: false }, FIGHTER_WIDTH, FIGHTER_HEIGHT);
    ctx.restore();

    var p = c.palette.primary;
    var r = parseInt(p.slice(1, 3), 16), g = parseInt(p.slice(3, 5), 16), b = parseInt(p.slice(5, 7), 16);
    ctx.fillStyle = (r * 0.299 + g * 0.587 + b * 0.114) > 160 ? '#111' : '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(c.name, x + cardW / 2, cardY + cardH - 30 + lift);

    if (select.p1Index === i) {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = select.p1Locked ? 6 : 3;
      ctx.strokeRect(x - 4, cardY - 4 + lift, cardW + 8, cardH + 8);
    }
    if (select.p2Index === i) {
      ctx.strokeStyle = '#00bcd4';
      ctx.lineWidth = select.p2Locked ? 6 : 3;
      ctx.strokeRect(x - 9, cardY - 9 + lift, cardW + 18, cardH + 18);
    }
  });

  if (select.p1Locked && select.p2Locked) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    var dots = '';
    for (var d = 0; d < 1 + Math.floor(select.countdown / 15) % 3; d++) dots += '.';
    ctx.fillText('Kampf beginnt' + dots, CANVAS_W / 2, cardY + cardH + 60);
  }

  // Controls hint
  ctx.fillStyle = '#888';
  ctx.font = '13px monospace';
  ctx.fillText('P1: A/D wählen, F bestätigen, G zurück  |  P2: ←/→ wählen, K bestätigen, L zurück', CANVAS_W / 2, CANVAS_H - 20);
}

// --- Main Loop ---
// Fixed-timestep update so game speed stays the same regardless of display refresh rate
const STEP_MS = 1000 / 60;
let accumulator = 0;
let lastTime = null;

function update() {
  globalTime++;
  pollGamepads();
  if (shake > 0) {
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
  }

  switch (gameState) {
    case 'TITLE':
      updateTitle();
      break;
    case 'SELECT':
      updateSelect();
      break;
    case 'ROUND_INTRO':
      updateRoundIntro();
      break;
    case 'FIGHT':
      updateFight();
      if (gameState === 'FIGHT') updateParticles();
      break;
    case 'CINEMATIC':
      updateCinematic();
      break;
    case 'ROUND_END':
      updateRoundEnd();
      break;
    case 'MATCH_END':
      updateMatchEnd();
      break;
  }

  prevKeys = new Set(keys);
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  switch (gameState) {
    case 'TITLE':
      drawTitle();
      break;
    case 'SELECT':
      drawSelect();
      break;
    case 'ROUND_INTRO':
      drawRoundIntro();
      break;
    case 'FIGHT':
      drawFightScene();
      break;
    case 'CINEMATIC':
      drawCinematic();
      break;
    case 'ROUND_END':
      drawFightScene();
      drawOverlay(roundResultText, false);
      break;
    case 'MATCH_END':
      drawFightScene();
      drawOverlay(matchResultText, true);
      break;
  }

  ctx.restore();
}

function loop(now) {
  if (lastTime === null) lastTime = now;
  var frameTime = now - lastTime;
  lastTime = now;
  if (frameTime > 250) frameTime = 250; // avoid spiral of death after tab was backgrounded

  accumulator += frameTime;
  while (accumulator >= STEP_MS) {
    update();
    accumulator -= STEP_MS;
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.__sfDebug = {
  toFight: function (i1, i2) {
    select.p1Index = i1; select.p2Index = i2;
    startFight();
    fighter1.x = 480; fighter2.x = 640;
    gameState = 'FIGHT';
  },
  novaSuper: function () {
    select.p1Index = CHARACTERS.findIndex(function (c) { return c.id === 'nova'; });
    select.p2Index = 1;
    startFight();
    fighter1.x = 480; fighter2.x = 640;
    gameState = 'FIGHT';
    startCinematic(fighter1, fighter2, 'nova', 43);
  },
  seek: function (t) { if (cinematic) cinematic.timer = t; },
  doMove: function (which, type) {
    var f = which === 1 ? fighter1 : fighter2;
    fighter1.x = 460; fighter2.x = 540; fighter1.facing = 1; fighter2.facing = -1;
    startAttack(f, type);
  },
  runTrace: function (which, type, frames) {
    fighter1.x = 460; fighter2.x = 540; fighter1.facing = 1; fighter2.facing = -1;
    var f = which === 1 ? fighter1 : fighter2;
    startAttack(f, type);
    var trace = [];
    for (var i = 0; i < frames; i++) { update(); trace.push({ t: i, grounded: f.grounded, y: Math.round(f.y), state: f.state }); }
    return trace;
  },
  chaosTest: function (n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      window.__sfDebug.toFight(2, 0);
      var r = window.__sfDebug.run(1, 'fwd_punch', 16);
      out.push({ grounded: fighter2.grounded, groundBounce: fighter2.groundBounce, stateTimer: fighter2.stateTimer });
    }
    return out;
  },
  state: function () { return { f1: { x: fighter1.x, state: fighter1.state, hp: fighter1.hp }, f2: { x: fighter2.x, state: fighter2.state, hp: fighter2.hp } }; },
  meterTest: function (n) { fighter1.meter = 0; for (var i = 0; i < n; i++) update(); return { meter: fighter1.meter }; },
  parryVsGrab: function () {
    fighter1.x = 460; fighter2.x = 540; fighter1.facing = 1; fighter2.facing = -1;
    startAttack(fighter2, 'parry');
    update(); update();
    startAttack(fighter1, 'fwd_punch');
    for (var i = 0; i < 10; i++) update();
    return { f1: fighter1.state, f2: fighter2.state, f2hp: fighter2.hp, f1stunned: fighter1.parryStunned, f1state: fighter1.state };
  },
  counterTest: function () {
    fighter1.x = 460; fighter2.x = 540; fighter1.facing = 1; fighter2.facing = -1;
    startAttack(fighter1, 'fwd_punch');
    for (var i = 0; i < 4; i++) update();
    startAttack(fighter2, 'punch');
    for (var j = 0; j < 10; j++) update();
    return { f2hp: fighter2.hp, f1state: fighter1.state, f2state: fighter2.state };
  },
  run: function (which, type, frames) {
    fighter1.x = 460; fighter2.x = 540; fighter1.facing = 1; fighter2.facing = -1;
    var f = which === 1 ? fighter1 : fighter2;
    startAttack(f, type);
    for (var i = 0; i < frames; i++) update();
    return {
      f1: { x: fighter1.x, facing: fighter1.facing, state: fighter1.state, hp: fighter1.hp },
      f2: { x: fighter2.x, facing: fighter2.facing, state: fighter2.state, hp: fighter2.hp },
    };
  },
  step: function (n) { for (var i = 0; i < n; i++) update(); },
  runAt: function (which, type, gap, frames) {
    fighter1.x = 300; fighter2.x = 300 + gap; fighter1.facing = 1; fighter2.facing = -1;
    fighter1.meter = 100; fighter2.meter = 100;
    var f = which === 1 ? fighter1 : fighter2;
    var before = (which === 1 ? fighter2 : fighter1).hp;
    startAttack(f, type);
    for (var i = 0; i < frames; i++) update();
    var d = (which === 1 ? fighter2 : fighter1);
    return { dmg: before - d.hp, attackerState: f.state, attackerX: Math.round(f.x), defenderState: d.state };
  },
};
})();
