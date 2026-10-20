const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const messageOverlay = document.getElementById('message');
const startButton = document.getElementById('start-button');

const world = { width: canvas.width, height: canvas.height };
const keys = {};
let state = 'menu';
let lastTime = 0;
let gameLoopId = 0;

const player = {
  x: 90,
  y: 90,
  radius: 18,
  speed: 220,
  money: 0,
};

const cops = [
  { x: 720, y: 120, radius: 18, speed: 90, vx: 1, vy: 0.8 },
  { x: 520, y: 420, radius: 18, speed: 100, vx: -1, vy: -0.7 },
  { x: 780, y: 300, radius: 18, speed: 95, vx: -0.9, vy: 0.8 },
  { x: 330, y: 220, radius: 18, speed: 110, vx: 1, vy: -0.6 },
];

const moneyDrops = [
  { x: 170, y: 120, value: 25, radius: 12, active: true },
  { x: 290, y: 440, value: 35, radius: 12, active: true },
  { x: 620, y: 180, value: 40, radius: 12, active: true },
  { x: 830, y: 450, value: 50, radius: 12, active: true },
  { x: 460, y: 260, value: 60, radius: 12, active: true },
  { x: 760, y: 430, value: 30, radius: 12, active: true },
];

let timer = 90;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setMessage(title, text, buttonText = 'Aloita peli') {
  messageOverlay.innerHTML = `
    <div>
      <h1>${title}</h1>
      <p>${text}</p>
      <button id="start-button">${buttonText}</button>
    </div>
  `;

  const btn = document.getElementById('start-button');
  btn.addEventListener('click', startGame);
  messageOverlay.classList.add('visible');
}

function resetGame() {
  player.x = 90;
  player.y = 90;
  player.money = 0;
  timer = 90;

  cops.forEach((cop, index) => {
    const positions = [
      { x: 720, y: 120, vx: 1, vy: 0.8 },
      { x: 520, y: 420, vx: -1, vy: -0.7 },
      { x: 780, y: 300, vx: -0.9, vy: 0.8 },
      { x: 330, y: 220, vx: 1, vy: -0.6 },
    ];
    cop.x = positions[index].x;
    cop.y = positions[index].y;
    cop.vx = positions[index].vx;
    cop.vy = positions[index].vy;
  });

  moneyDrops.forEach((drop, index) => {
    const positions = [
      { x: 170, y: 120 },
      { x: 290, y: 440 },
      { x: 620, y: 180 },
      { x: 830, y: 450 },
      { x: 460, y: 260 },
      { x: 760, y: 430 },
    ];
    drop.x = positions[index].x;
    drop.y = positions[index].y;
    drop.active = true;
  });
}

function startGame() {
  resetGame();
  state = 'playing';
  messageOverlay.classList.remove('visible');
  lastTime = 0;
  cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(loop);
}

function endGame(won) {
  state = 'menu';
  cancelAnimationFrame(gameLoopId);

  if (won) {
    setMessage('Voitit!', `Keräsit ${player.money} € ja selvisit poliiseilta.`, 'Pelaa uudelleen');
  } else {
    setMessage('Peli ohi!', `Poliisi sai sinut kiinni. Keräsit ${player.money} €.`, 'Yritä uudelleen');
  }
}

function checkMoneyPickup() {
  for (const drop of moneyDrops) {
    if (!drop.active) continue;
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const dist = Math.hypot(dx, dy);

    if (dist < player.radius + drop.radius + 2) {
      player.money += drop.value;
      drop.active = false;
    }
  }
}

function checkPoliceCollision() {
  for (const cop of cops) {
    const dx = player.x - cop.x;
    const dy = player.y - cop.y;
    const dist = Math.hypot(dx, dy);

    if (dist < player.radius + cop.radius + 4) {
      endGame(false);
      return;
    }
  }
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.w || keys.ArrowUp) dy -= 1;
  if (keys.s || keys.ArrowDown) dy += 1;
  if (keys.a || keys.ArrowLeft) dx -= 1;
  if (keys.d || keys.ArrowRight) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    player.x += dx * player.speed * dt;
    player.y += dy * player.speed * dt;
  }

  player.x = clamp(player.x, 28, world.width - 28);
  player.y = clamp(player.y, 28, world.height - 28);
}

function updateCops(dt) {
  cops.forEach((cop) => {
    cop.x += cop.vx * cop.speed * dt;
    cop.y += cop.vy * cop.speed * dt;

    if (cop.x < 20 || cop.x > world.width - 20) cop.vx *= -1;
    if (cop.y < 20 || cop.y > world.height - 20) cop.vy *= -1;
  });
}

function updateTimer(dt) {
  timer -= dt;
  if (timer <= 0) {
    if (player.money >= 150) {
      endGame(true);
    } else {
      endGame(false);
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#163b2c';
  ctx.fillRect(0, 0, world.width, world.height);

  // roads
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 165, world.width, 130);
  ctx.fillRect(220, 0, 120, world.height);
  ctx.fillRect(660, 0, 120, world.height);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(0, 230); ctx.lineTo(960, 230);
  ctx.moveTo(280, 0); ctx.lineTo(280, 540);
  ctx.moveTo(720, 0); ctx.lineTo(720, 540);
  ctx.stroke();
  ctx.setLineDash([]);

  // safe zones
  ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
  ctx.fillRect(40, 40, 140, 120);
  ctx.fillRect(400, 210, 140, 120);
  ctx.fillRect(680, 330, 180, 120);
}

function drawMoneyDrops() {
  moneyDrops.forEach((drop) => {
    if (!drop.active) return;

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('€', drop.x - 4, drop.y + 4);
  });
}

function drawCops() {
  cops.forEach((cop) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cop.x, cop.y, cop.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.fillRect(cop.x - 5, cop.y - 18, 10, 8);
  });
}

function drawPlayer() {
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(player.x - 8, player.y - 26, 16, 10);
}

function drawHud() {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(12, 12, 220, 80);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Rahat: ${player.money} €`, 22, 42);
  ctx.fillText(`Aika: ${Math.ceil(timer)}s`, 22, 70);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Tavoite: 150 €', 560, 35);
}

function render() {
  drawBackground();
  drawMoneyDrops();
  drawCops();
  drawPlayer();
  drawHud();
}

function loop(timestamp) {
  if (state !== 'playing') return;

  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.05);
  lastTime = timestamp;

  updatePlayer(dt);
  updateCops(dt);
  checkMoneyPickup();
  checkPoliceCollision();
  updateTimer(dt);
  render();

  gameLoopId = requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

setMessage('GTA Suomi Nurmes', 'Kerää rahat, vältä poliiseja ja selviydy 90 sekunnissa. Liiku WASD tai nuolinäppäimillä.', 'Aloita peli');
render();
