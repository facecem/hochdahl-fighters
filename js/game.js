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
  f.blocking = false;
  if (!f.grounded) f.vx *= 0.5;
  else f.vx = 0;
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
  if (f.comboTimer > 0) {
    f.comboTimer--;
    if (f.comboTimer === 0) f.comboCount = 0;
  }

  var opp = f === fighter1 ? fighter2 : fighter1;
  if (!inState(f, ATTACK_STATES.concat(['hit', 'ko', 'win', 'thrown']))) {
    f.facing = opp.x > f.x ? 1 : -1;
  }

  var canAct = inState(f, ['idle', 'walk', 'jump']);

  if (canAct) {
    var targetVx = 0;
    if (keys.has(c.left)) targetVx = -f.charDef.stats.speed;
    else if (keys.has(c.right)) targetVx = f.charDef.stats.speed;
    if (f.grounded) {
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
      spawnParticles(f.x + FIGHTER_WIDTH / 2, FLOOR_Y, '#888', 5, 2);
      if (f.state === 'jump') f.state = 'idle';
    }
  }

  f.x += f.vx;
  f.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, f.x));

  var overlap = FIGHTER_WIDTH - Math.abs(fighter1.x - fighter2.x);
  if (overlap > 0 && f.grounded) {
    var pushDir = f.x < opp.x ? -1 : 1;
    f.x += pushDir * overlap * 0.5;
    f.x = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, f.x));
  }

  // Attack state timer
  if (isAttackState(f)) {
    f.stateTimer++;
    var move = f.charDef.moves[f.state];
    var totalFrames = !f.grounded ? Math.round(move.total * 0.7) : move.total;
    if (f.stateTimer >= totalFrames) {
      if (f.state !== 'special' || move.cooldown) {
        f.cooldowns[f.state] = f.grounded ? (move.cooldown || 0) : Math.round((move.cooldown || 0) * 0.5);
      }
      var wasKickWhiff = (f.state === 'kick' || f.state === 'fwd_kick') && f.grounded && !f.hasHit;
      var wasParryStunned = f.parryStunned;
      f.parryStunned = false;
      f.hasHit = false;
      if (wasParryStunned) {
        f.state = 'hit';
        f.stateTimer = PARRY_STUN;
        f.stunned = true;
      } else if (wasKickWhiff) {
        f.state = 'hit';
        f.stateTimer = WHIFF_STUN;
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
    finalDmg = Math.round(dmg * 1.5);
    finalKnock *= 1.3;
    stun += 6;
  }
  defender.hp = Math.max(0, defender.hp - finalDmg);
  defender.hitFlash = 8;
  var dir = defender.x < attacker.x ? -1 : 1;
  defender.vx = dir * finalKnock;
  if (!defender.grounded) defender.vy = -3;

  // Launcher
  if (moveFlags.launcher && defender.grounded) {
    defender.vy = -8;
    defender.grounded = false;
  }

  playSound('hit');
  spawnSparks(hx, hy, dir, '#ffe066', 12);
  spawnParticles(hx, hy, '#ff8844', 6, 4);
  spawnPopup(hx, hy - 20, '-' + finalDmg, finalDmg >= 15 ? '#ff5252' : '#ffd166');
  if (isCounter) spawnPopup(hx, hy - 40, 'COUNTER!', '#ff8800');
  defender.state = 'hit';
  defender.stateTimer = stun;
  defender.stunned = false;
  defender.blocking = false;
  shake = Math.min(16, 4 + finalDmg * 0.5 + (isCounter ? 4 : 0));
  hitstop = finalDmg >= 15 ? 8 : 4;

  attacker.comboCount = attacker.comboTimer > 0 ? attacker.comboCount + 1 : 1;
  attacker.comboTimer = 45;
  if (attacker.comboCount >= 2) {
    spawnPopup(hx, hy - 60, attacker.comboCount + ' HITS!', '#ffcc00');
  }

  attacker.meter = Math.min(METER_MAX, attacker.meter + finalDmg * METER_GAIN_ATTACKER);
  defender.meter = Math.min(METER_MAX, defender.meter + finalDmg * METER_GAIN_DEFENDER);

  // KO slowmo
  if (defender.hp <= 0) slowmo = 45;
}

function checkMeleeHit(attacker, defender) {
  if (!isAttackState(attacker)) return;
  var move = attacker.charDef.moves[attacker.state];
  if (move.type === 'projectile' || move.type === 'rewind') return;
  if (attacker.hasHit) return;

  var activeEnd = !attacker.grounded ? Math.round(move.active[1] * 0.7) : move.active[1];
  var activeStart = !attacker.grounded ? Math.round(move.active[0] * 0.7) : move.active[0];
  if (attacker.stateTimer < activeStart || attacker.stateTimer > activeEnd) return;

  var ac = attacker.x + FIGHTER_WIDTH / 2;
  var dc = defender.x + FIGHTER_WIDTH / 2;
  var dist = Math.abs(dc - ac);

  var isCounter = isAttackState(defender) && defender.stateTimer < defender.charDef.moves[defender.state].active[0];
  var airBonus = !attacker.grounded ? 0.8 : 1;
  var moveFlags = { launcher: !!move.launcher, knockdown: !!move.knockdown };

  if (move.type === 'grab') {
    if (dist <= move.range && !defender.blocking) {
      defender.hp = Math.max(0, defender.hp - move.dmg);
      var hx = attacker.x + FIGHTER_WIDTH / 2;
      var hy = attacker.y + FIGHTER_HEIGHT * 0.3;
      spawnSparks(hx, hy, attacker.facing, '#ffe066', 14);
      spawnPopup(hx, hy - 20, '-' + move.dmg, '#ff5252');
      playSound('hit');
      shake = Math.min(14, 8 + move.dmg * 0.2);
      hitstop = 8;
      defender.state = 'thrown';
      defender.throwTotal = 30;
      defender.stateTimer = 30;
      defender.throwStartX = defender.x;
      defender.throwStartY = defender.y;
      var throwEndX = attacker.x + attacker.facing * FIGHTER_WIDTH * 2.4;
      defender.throwEndX = Math.max(0, Math.min(CANVAS_W - FIGHTER_WIDTH, throwEndX));
      defender.grounded = false;
      defender.vx = 0; defender.vy = 0;
      defender.blocking = false;
      attacker.comboCount = attacker.comboTimer > 0 ? attacker.comboCount + 1 : 1;
      attacker.comboTimer = 45;
      attacker.meter = Math.min(METER_MAX, attacker.meter + move.dmg * METER_GAIN_ATTACKER);
      defender.meter = Math.min(METER_MAX, defender.meter + move.dmg * METER_GAIN_DEFENDER);
      if (defender.hp <= 0) slowmo = 45;
    }
    attacker.hasHit = true;
    return;
  }

  if (dist <= move.range) {
    var airDmg = !attacker.grounded && attacker.state === 'kick' ? Math.round(move.dmg * 0.6) : move.dmg;
    applyDamage(defender, airDmg, attacker, (move.knockback || 0) * airBonus, move.type === 'grab', move.stun || 14, isCounter, false, moveFlags);
  }
  attacker.hasHit = true;
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
    if (hitsTarget) {
      var pColor = p.type === 'toast' ? '#e6b35c' : (p.type === 'shockwave' ? '#e8c547' : '#3498db');
      applyDamage(target, p.dmg, p.owner, p.type === 'shockwave' ? (p.knockback || 9) : 8, false, 14, false, true);
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

  updateFighter(fighter1);
  updateFighter(fighter2);
  checkMeleeHit(fighter1, fighter2);
  checkMeleeHit(fighter2, fighter1);
  checkProjectileSpawn(fighter1);
  checkProjectileSpawn(fighter2);
  checkRewindTrigger(fighter1);
  checkRewindTrigger(fighter2);
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

  ctx.save();
  ctx.translate(f.x + FIGHTER_WIDTH / 2, f.y);
  ctx.scale(f.facing, 1);
  ctx.translate(-FIGHTER_WIDTH / 2, 0);
  f.charDef.draw(ctx, f, FIGHTER_WIDTH, FIGHTER_HEIGHT);
  ctx.restore();
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

function drawFightScene() {
  drawBackground();
  drawFighter(fighter1);
  drawFighter(fighter2);
  projectiles.forEach(function (p) { drawProjectile(ctx, p); });
  drawParticles();
  drawRewindOverlay();
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

  var cardW = 200, cardH = 290, gap = 20;
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
function loop() {
  globalTime++;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.85;
    if (shake < 0.5) shake = 0;
  }

  switch (gameState) {
    case 'TITLE':
      updateTitle();
      drawTitle();
      break;
    case 'SELECT':
      updateSelect();
      drawSelect();
      break;
    case 'ROUND_INTRO':
      updateRoundIntro();
      drawRoundIntro();
      break;
    case 'FIGHT':
      updateFight();
      updateParticles();
      drawFightScene();
      break;
    case 'ROUND_END':
      updateRoundEnd();
      drawFightScene();
      drawOverlay(roundResultText, false);
      break;
    case 'MATCH_END':
      updateMatchEnd();
      drawFightScene();
      drawOverlay(matchResultText, true);
      break;
  }

  ctx.restore();
  prevKeys = new Set(keys);
  requestAnimationFrame(loop);
}

loop();
})();
