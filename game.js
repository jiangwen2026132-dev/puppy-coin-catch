(function () {
  'use strict';
  const { PuppyGame, WIDTH: W, HEIGHT: H, PLAYER_Y, CATCH_LINE } = window.PuppyEngine;
  const byId = (id) => document.getElementById(id);
  const canvas = byId('game-canvas');
  const ctx = canvas.getContext('2d');
  const game = new PuppyGame();
  const screen = byId('screen');
  const startButton = byId('start-button');
  const pauseButton = byId('pause-button');
  const soundButton = byId('sound-button');
  const companions = {
    westie: { species: 'dog', name: '西高地', image: './assets/illustrated/westie.webp', alt: '抱着藤编篮筐、白毛蓬松的西高地幼犬' },
    teddy: { species: 'dog', name: '泰迪', image: './assets/illustrated/teddy.webp', alt: '抱着藤编篮筐、杏棕色卷毛的泰迪幼犬' },
    collie: { species: 'dog', name: '边牧', image: './assets/illustrated/collie.webp', alt: '抱着藤编篮筐、黑白毛色的边牧幼犬' },
    ginger: { species: 'cat', name: '橘猫', image: './assets/illustrated/ginger.webp', alt: '抱着藤编篮筐、绿眼睛橘色虎斑的小猫' },
    ragdoll: { species: 'cat', name: '布偶', image: './assets/illustrated/ragdoll.webp', alt: '抱着藤编篮筐、蓝眼睛浅色长毛的布偶猫' },
    cowcat: { species: 'cat', name: '奶牛猫', image: './assets/illustrated/cowcat.webp', alt: '抱着藤编篮筐、金色眼睛黑白斑点的奶牛猫' },
  };
  const companionImages = new Map(Object.entries(companions).map(([id, settings]) => {
    const image = new Image();
    image.src = settings.image;
    return [id, image];
  }));
  const parkArt = new Image();
  parkArt.src = './assets/illustrated/park.webp';
  const companionStorageKey = 'puppy-coin-catch.companion.v1';
  const speciesChoicesKey = 'puppy-coin-catch.species-choices.v1';
  const lastCompanionBySpecies = { dog: 'westie', cat: 'ginger' };
  let companion = companions.westie;
  let puppy = companionImages.get('westie');
  let companionStorageAvailable = true;
  const keys = new Set();
  const touchHolds = new Map();
  const leftButton = byId('left-button');
  const rightButton = byId('right-button');
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageKey = 'puppy-coin-catch.best.v1';
  let best = 0;
  let bestAtStart = 0;
  let storageAvailable = true;
  let sound = false;
  let audio;
  let previousTime = 0;
  let sceneryTime = 0;
  let effects = [];
  let shake = 0;
  let dragPointer = null;
  let hudCache = '';
  let lastStatus = 'ready';
  let physicalWidth = 0;
  let physicalHeight = 0;
  let spriteYScale = 1;
  let catchBounce = 0;
  let previousPlayerX = game.playerX;
  let characterLean = 0;

  try {
    const stored = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(stored) && stored >= 0) best = Math.floor(stored);
    localStorage.setItem(storageKey, String(best));
  } catch (_) { storageAvailable = false; }
  byId('best-score').textContent = best;
  if (!storageAvailable) byId('saved-note').textContent = '当前浏览器未允许保存，纪录仅本次有效';

  function announce(message) { byId('announcement').textContent = message; }
  function petLabel() { return companion.species === 'cat' ? '猫咪' : '小狗'; }
  function petVoice() { return companion.species === 'cat' ? '喵' : '汪'; }

  function selectCompanion(id, persist = true) {
    if (!Object.prototype.hasOwnProperty.call(companions, id)) id = 'westie';
    companion = companions[id];
    puppy = companionImages.get(id);
    lastCompanionBySpecies[companion.species] = id;
    clearInput();
    document.querySelectorAll('[data-species]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.species === companion.species));
    });
    document.querySelectorAll('[data-companion-group]').forEach((group) => {
      group.hidden = group.dataset.companionGroup !== companion.species;
    });
    document.querySelectorAll('[data-companion]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.companion === id));
    });
    document.querySelectorAll('[data-companion-portrait]').forEach((image) => {
      image.src = companion.image;
      // Keep the wordmark image decorative, but describe the welcome portrait.
      if (image.alt) image.alt = companion.alt;
    });
    document.querySelector('link[rel="icon"]').href = companion.image;
    document.title = `${petLabel()}接金币 · Paws & Coins`;
    byId('brand-name').textContent = `${petLabel()}接金币`;
    byId('hero-pet').textContent = `${petLabel()}的`;
    byId('rules-title').textContent = `${petLabel()}的冒险指南`;
    byId('companion-park').textContent = `${companion.name}的好运公园`;
    canvas.setAttribute('aria-label', `${companion.name}游戏画面。按左右方向键或 A、D 移动${petLabel()}，空格键暂停。手机可拖动角色或使用下方按钮。`);
    if (game.status === 'ready') byId('card-kicker').textContent = `${companion.name}准备好啦，${petVoice()}！`;
    if (game.status === 'paused') byId('card-kicker').textContent = `${companion.name}在等你回来`;
    if (game.status === 'over') {
      if (game.score <= bestAtStart) byId('card-kicker').textContent = `${petVoice()}！这一局也很棒！`;
      if (game.reason === 'lives') byId('card-title').textContent = `抱抱${petLabel()}，再来一次`;
    }
    if (persist) {
      try {
        localStorage.setItem(companionStorageKey, id);
        localStorage.setItem(speciesChoicesKey, JSON.stringify(lastCompanionBySpecies));
      }
      catch (_) { companionStorageAvailable = false; }
      byId('companion-status').textContent = `已选择${companion.name}，一起接住好运气！`;
    }
    if (!companionStorageAvailable) byId('companion-note').textContent = '本次可以切换，浏览器暂不支持保存。';
  }

  let savedCompanion = 'westie';
  try {
    savedCompanion = localStorage.getItem(companionStorageKey) || 'westie';
    try {
      const choices = JSON.parse(localStorage.getItem(speciesChoicesKey) || '{}');
      for (const species of ['dog', 'cat']) {
        const id = choices?.[species];
        if (Object.prototype.hasOwnProperty.call(companions, id) && companions[id].species === species) lastCompanionBySpecies[species] = id;
      }
    } catch (_) { /* Ignore an outdated or malformed preference; play normally. */ }
  }
  catch (_) { companionStorageAvailable = false; }
  selectCompanion(savedCompanion, false);
  document.querySelectorAll('[data-companion]').forEach((button) => {
    button.addEventListener('click', () => selectCompanion(button.dataset.companion));
  });
  document.querySelectorAll('[data-species]').forEach((button) => {
    button.addEventListener('click', () => selectCompanion(lastCompanionBySpecies[button.dataset.species]));
  });

  function ensureAudio() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!audio && Audio) audio = new Audio();
      if (audio?.state === 'suspended') audio.resume().catch(() => {});
    } catch (_) { /* The game remains playable without audio. */ }
  }

  function tone(frequency, duration = 0.1, delay = 0, type = 'sine', volume = 0.055) {
    if (!sound || !audio || audio.state !== 'running') return;
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = audio.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + duration);
    } catch (_) { /* Optional sound must never interrupt a round. */ }
  }

  function clearInput() {
    keys.clear();
    touchHolds.clear();
    dragPointer = null;
    leftButton.classList.remove('is-held');
    rightButton.classList.remove('is-held');
  }

  function showScreen(kind) {
    screen.hidden = false;
    screen.className = `screen is-${kind}`;
    byId('result-stats').hidden = kind !== 'result';
    const paused = kind === 'paused';
    byId('card-kicker').textContent = paused ? `${companion.name}在等你回来` : `${petVoice()}！这一局也很棒！`;
    byId('card-title').textContent = paused ? '歇一下，再出发' : game.reason === 'time' ? '今天的好运已收好' : `抱抱${petLabel()}，再来一次`;
    byId('card-description').innerHTML = paused ? '深呼吸，摇摇尾巴。<br>准备好了，就继续这场小冒险。' : game.reason === 'time' ? '快乐的 60 秒结束啦，下次也要一起玩！' : '炸弹有点调皮，下次一定躲得更漂亮。';
    byId('start-label').textContent = paused ? '继续冒险' : '再玩一局';
    byId('card-hint').textContent = paused ? '按空格键 / P，也可以继续游戏' : '每一局都是一次新的小冒险 ♡';
    if (!paused) {
      byId('final-score').textContent = game.score;
      byId('final-coins').textContent = game.coins;
      byId('final-combo').textContent = game.maxCombo;
      if (game.score > bestAtStart) {
        byId('card-kicker').textContent = '✦ 新纪录！值得好好摇尾巴！';
        byId('card-kicker').classList.add('new-record');
      }
    }
    startButton.focus({ preventScroll: true });
  }

  function start() {
    ensureAudio();
    clearInput();
    if (game.status === 'paused') {
      game.togglePause();
      announce('游戏继续');
    } else {
      game.reset();
      effects = [];
      shake = 0;
      catchBounce = 0;
      previousPlayerX = game.playerX;
      characterLean = 0;
      bestAtStart = best;
      byId('card-kicker').classList.remove('new-record');
      announce(`开始游戏，60 秒挑战。左右移动${petLabel()}，接金币，躲炸弹。`);
      tone(523, 0.1); tone(659, 0.1, 0.09); tone(784, 0.14, 0.18);
    }
    previousTime = performance.now();
    screen.hidden = true;
    pauseButton.disabled = false;
    pauseButton.setAttribute('aria-label', '暂停游戏');
    pauseButton.firstElementChild.textContent = 'Ⅱ';
    canvas.focus({ preventScroll: true });
    lastStatus = 'playing';
    updateHud();
  }

  function pause() {
    if (game.status !== 'playing') return;
    game.togglePause();
    clearInput();
    showScreen('paused');
    pauseButton.setAttribute('aria-label', '继续游戏');
    pauseButton.firstElementChild.textContent = '▷';
    announce('游戏已暂停，计时停止');
  }

  function saveRecord() {
    if (game.score <= best) return;
    best = game.score;
    byId('best-score').textContent = best;
    byId('record-note').textContent = '又进步了一点点，好棒！';
    if (storageAvailable) {
      try { localStorage.setItem(storageKey, String(best)); }
      catch (_) {
        storageAvailable = false;
        byId('saved-note').textContent = '纪录仅本次有效，浏览器保存不可用';
      }
    }
  }

  function updateHud() {
    const signature = `${game.score}/${Math.ceil(game.remaining)}/${game.lives}/${game.combo}`;
    if (signature === hudCache) return;
    hudCache = signature;
    byId('score').textContent = game.score;
    byId('time').textContent = Math.ceil(game.remaining);
    byId('time').closest('.timer').classList.toggle('urgent', game.remaining <= 10);
    byId('lives').textContent = Array.from({ length: 3 }, (_, i) => i < game.lives ? '♥' : '♡').join(' ');
    byId('combo').textContent = game.combo >= 5 ? `✦ ${game.combo} 连击 · 双倍得分` : game.combo >= 2 ? `${game.combo} 连击！` : '';
  }

  function processEvents() {
    for (const event of game.events) {
      if (event.type === 'catch') {
        catchBounce = 0.28;
        effects.push({ x: event.x, y: event.y - 12, age: 0, text: `+${event.points}`, color: '#b18b39' });
        if (!motionReduced) for (let i = 0; i < 6; i++) effects.push({ x: event.x, y: event.y, age: 0, vx: (Math.random() - 0.5) * 150, vy: -35 - Math.random() * 80, color: '#dfb759' });
        tone(event.kind === 'bone' ? 1046 : 784, 0.1);
        tone(event.kind === 'bone' ? 1318 : 1046, 0.08, 0.07);
      } else if (event.type === 'hit') {
        shake = motionReduced ? 0 : 0.22;
        effects.push({ x: game.playerX, y: PLAYER_Y - 65, age: 0, text: '−1 ♥', color: '#be776b' });
        tone(130, 0.22, 0, 'triangle', 0.08);
        announce(`碰到炸弹，还剩 ${game.lives} 颗爱心`);
      }
    }
    if (game.status === 'over' && lastStatus !== 'over') {
      saveRecord();
      clearInput();
      pauseButton.disabled = true;
      showScreen('result');
      announce(`游戏结束，得分 ${game.score}，接住 ${game.coins} 枚金币，最高连击 ${game.maxCombo}`);
      tone(659, 0.15); tone(523, 0.25, 0.16);
    }
    lastStatus = game.status;
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  function cloud(x, y, size) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    ctx.scale(1, spriteYScale);
    ctx.fillStyle = '#fffcf0'; ctx.beginPath();
    ctx.moveTo(-43, 15); ctx.bezierCurveTo(-70, 10, -65, -13, -42, -14);
    ctx.bezierCurveTo(-42, -42, 4, -45, 13, -21); ctx.bezierCurveTo(35, -30, 55, -8, 42, 8);
    ctx.bezierCurveTo(30, 22, -24, 17, -43, 15); ctx.fill(); ctx.restore();
  }

  function tree(x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    ctx.strokeStyle = '#b6b392'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -75); ctx.stroke();
    ellipse(-18, -67, 26, 36, color); ellipse(12, -82, 31, 41, color); ellipse(31, -55, 24, 31, color);
    ctx.restore();
  }

  function flower(x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ellipse(Math.cos(a) * 4, Math.sin(a) * 4, 3, 3, color); }
    ellipse(0, 0, 2, 2, '#dbba72'); ctx.restore();
  }

  function scenery() {
    if (parkArt.complete && parkArt.naturalWidth) {
      ctx.drawImage(parkArt, 0, 0, W, H);
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f1eed9'); sky.addColorStop(0.7, '#f8f1db'); sky.addColorStop(1, '#eef0d8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ellipse(653, 96, 36, 36, '#eee2ae'); ellipse(653, 96, 28, 28, '#f5e9bd');
    const drift = motionReduced ? 0 : Math.sin(sceneryTime * 0.1) * 12;
    cloud(140 + drift, 105, 0.9); cloud(493 - drift, 63, 0.65); cloud(724 + drift * 0.5, 203, 0.65);
    ctx.fillStyle = '#e2e6ce'; ctx.beginPath(); ctx.moveTo(0, 368); ctx.bezierCurveTo(115, 278, 269, 359, 396, 346); ctx.bezierCurveTo(569, 291, 666, 304, 800, 343); ctx.lineTo(800, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#d5dfbf'; ctx.beginPath(); ctx.moveTo(0, 393); ctx.bezierCurveTo(150, 355, 239, 422, 411, 389); ctx.bezierCurveTo(602, 341, 701, 381, 800, 367); ctx.lineTo(800, H); ctx.lineTo(0, H); ctx.fill();
    tree(50, 411, 0.93, '#c5d0ac'); tree(749, 407, 0.72, '#c2cfa8');
    ctx.fillStyle = '#e2dfc0'; ctx.beginPath(); ctx.moveTo(0, 461); ctx.quadraticCurveTo(410, 416, 800, 463); ctx.lineTo(800, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = '#eee4c9'; ctx.beginPath(); ctx.moveTo(0, 493); ctx.quadraticCurveTo(400, 431, 800, 491); ctx.lineTo(800, H); ctx.lineTo(0, H); ctx.fill();
    [[85,462,1,'#faf3dc'],[159,427,.8,'#fcf1d5'],[676,443,.9,'#fcf3dc'],[722,483,1.1,'#f4edd6'],[282,492,.7,'#fbf5e6'],[551,478,.8,'#fbf5e6']].forEach((args) => flower(...args));
    ctx.strokeStyle = '#b8c59b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const [x, y] of [[30,455],[110,487],[210,450],[624,458],[772,447]]) { ctx.beginPath(); ctx.moveTo(x-5,y); ctx.lineTo(x-8,y-7); ctx.moveTo(x,y); ctx.lineTo(x+1,y-10); ctx.moveTo(x+5,y); ctx.lineTo(x+9,y-6); ctx.stroke(); }
    if (game.status === 'ready') {
      drawCoin(110, 221, 0.15); drawCoin(698, 279, 1); drawCoin(630, 172, 2);
      ctx.globalAlpha = 0.5; drawBone(204, 296, -0.6); ctx.globalAlpha = 1;
    }
  }

  function drawCoin(x, y, phase) {
    ctx.save(); ctx.translate(x, y);
    ctx.scale(1, spriteYScale);
    const scaleX = motionReduced ? 1 : 0.72 + Math.abs(Math.cos(sceneryTime * 3 + phase)) * 0.28;
    ctx.scale(scaleX, 1); ellipse(2, 2, 15, 17, '#bf963e'); ellipse(0, 0, 15, 17, '#e8bd5d');
    ctx.strokeStyle = '#f6da8c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ad8132'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 1); ctx.restore();
  }

  function drawBone(x, y, angle) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, spriteYScale); ctx.rotate(angle);
    ctx.fillStyle = '#fff8e6'; ctx.strokeStyle = '#c4b696'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12,-5); ctx.bezierCurveTo(-23,-18,-32,-2,-21,1); ctx.bezierCurveTo(-30,12,-14,18,-11,6); ctx.lineTo(11,6); ctx.bezierCurveTo(14,18,30,12,21,1); ctx.bezierCurveTo(32,-2,23,-18,12,-5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  function drawBomb(x, y, phase) {
    ctx.save(); ctx.translate(x,y); ctx.scale(1, spriteYScale); ctx.rotate(Math.sin(sceneryTime * 3 + phase) * 0.15);
    ctx.strokeStyle = '#88765b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(5,-17); ctx.quadraticCurveTo(3,-30,14,-28); ctx.stroke();
    ctx.fillStyle = '#827b69'; ctx.fillRect(-4,-20,11,7); ellipse(0,1,17,18,'#716d60'); ellipse(-5,-5,4,5,'#928e7f');
    ctx.strokeStyle = '#dbb762'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(15,-34); ctx.lineTo(15,-29); ctx.moveTo(21,-29); ctx.lineTo(18,-26); ctx.moveTo(23,-22); ctx.lineTo(18,-23); ctx.stroke(); ctx.restore();
  }

  function drawCompanion(dt) {
    if (!puppy.complete || !puppy.naturalWidth) return;
    const height = 184;
    const width = height * puppy.naturalWidth / puppy.naturalHeight;
    // Align the illustrated basket opening with the actual collision line,
    // including on tall mobile canvases where sprite proportions stay square.
    const basketAnchor = 0.66;
    const feetAnchor = 0.96;
    const baseY = CATCH_LINE + (feetAnchor - basketAnchor) * height * spriteYScale;
    const delta = game.playerX - previousPlayerX;
    previousPlayerX = game.playerX;
    const moving = Math.abs(delta) > 0.15;
    const leanTarget = motionReduced ? 0 : Math.max(-0.035, Math.min(0.035, delta * 0.008));
    characterLean += (leanTarget - characterLean) * Math.min(1, dt * 12);
    const bob = motionReduced ? 0 : Math.sin(sceneryTime * (moving ? 12 : 3)) * (moving ? 1.4 : 0.65);
    const hop = motionReduced || catchBounce <= 0 ? 0 : Math.sin((1 - catchBounce / 0.28) * Math.PI) * 5;
    ellipse(game.playerX, baseY + 3, 45, 6, '#4e59392b');
    ctx.save();
    ctx.translate(game.playerX, baseY + (bob - hop) * spriteYScale);
    ctx.scale(1, spriteYScale);
    ctx.rotate(characterLean);
    if (game.invincible > 0 && Math.floor(game.invincible * 10) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.drawImage(puppy, -width / 2, -feetAnchor * height, width, height);
    ctx.restore();
  }

  function draw(dt) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * ratio));
    const targetH = Math.max(1, Math.round(rect.height * ratio));
    if (physicalWidth !== targetW || physicalHeight !== targetH) {
      canvas.width = physicalWidth = targetW;
      canvas.height = physicalHeight = targetH;
    }
    ctx.setTransform(physicalWidth / W, 0, 0, physicalHeight / H, 0, 0);
    spriteYScale = (physicalWidth / W) / (physicalHeight / H);
    ctx.save();
    if (shake > 0) ctx.translate(Math.sin(sceneryTime * 100) * 4 * shake / 0.22, 0);
    scenery();
    drawCompanion(dt);
    for (const item of game.items) {
      if (item.type === 'coin') drawCoin(item.x,item.y,item.phase);
      else if (item.type === 'bone') drawBone(item.x,item.y,Math.sin(sceneryTime * 2 + item.phase) * 0.4);
      else drawBomb(item.x,item.y,item.phase);
    }
    for (const effect of effects) {
      if (game.status === 'playing') {
        effect.age += dt;
        if (effect.text) effect.y -= dt * 43;
        else { effect.x += effect.vx * dt; effect.y += effect.vy * dt; effect.vy += dt * 160; }
      }
      ctx.globalAlpha = Math.max(0, 1 - effect.age / 0.85);
      if (effect.text) { ctx.fillStyle = effect.color; ctx.font = 'bold 19px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(effect.text, effect.x, effect.y); }
      else ellipse(effect.x, effect.y, 3, 3, effect.color);
    }
    effects = effects.filter((effect) => effect.age < 0.85);
    ctx.globalAlpha = 1; ctx.restore();
  }

  function frame(timestamp) {
    const dt = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
    previousTime = timestamp;
    if (game.status === 'playing' || game.status === 'ready') sceneryTime += dt;
    if (game.status === 'playing') {
      const directions = [...touchHolds.values()];
      const direction = Number(keys.has('arrowright') || keys.has('d') || directions.includes(1)) - Number(keys.has('arrowleft') || keys.has('a') || directions.includes(-1));
      game.move(direction, dt);
      game.update(dt);
      shake = Math.max(0, shake - dt);
      catchBounce = Math.max(0, catchBounce - dt);
      processEvents();
      updateHud();
    }
    draw(dt);
    requestAnimationFrame(frame);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    game.setPlayer((event.clientX - rect.left) / rect.width * W);
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (game.status !== 'playing' || event.button !== 0) return;
    event.preventDefault(); dragPointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId); pointerPosition(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (game.status !== 'playing') return;
    if (event.pointerType === 'mouse' || event.pointerId === dragPointer) pointerPosition(event);
  });
  const releaseDrag = (event) => { if (event.pointerId === dragPointer) dragPointer = null; };
  canvas.addEventListener('pointerup', releaseDrag);
  canvas.addEventListener('pointercancel', releaseDrag);
  canvas.addEventListener('lostpointercapture', releaseDrag);

  for (const [button, direction] of [[leftButton, -1], [rightButton, 1]]) {
    button.addEventListener('pointerdown', (event) => {
      if (game.status !== 'playing') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      touchHolds.set(event.pointerId, direction); button.classList.add('is-held');
    });
    const release = (event) => { touchHolds.delete(event.pointerId); button.classList.remove('is-held'); };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const interactive = event.target.closest?.('button, a, input, textarea, select');
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if ((key === 'p' || key === 'escape' || (key === ' ' && !interactive)) && (game.status === 'playing' || game.status === 'paused')) {
      event.preventDefault();
      if (!event.repeat) game.status === 'playing' ? pause() : start();
    } else if (['arrowleft', 'arrowright', 'a', 'd'].includes(key) && game.status === 'playing') {
      event.preventDefault(); keys.add(key);
    }
  });
  document.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => { if (game.status === 'playing') pause(); clearInput(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.status === 'playing') pause(); });
  startButton.addEventListener('click', start);
  pauseButton.addEventListener('click', () => game.status === 'paused' ? start() : pause());
  soundButton.addEventListener('click', () => {
    sound = !sound; if (sound) ensureAudio();
    soundButton.setAttribute('aria-pressed', String(sound));
    soundButton.setAttribute('aria-label', sound ? '关闭音效' : '开启音效');
    soundButton.title = sound ? '关闭音效' : '开启音效';
    if (sound) tone(784, 0.12);
  });
  updateHud();
  requestAnimationFrame(frame);
})();
