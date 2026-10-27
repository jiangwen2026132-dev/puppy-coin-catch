const test = require('node:test');
const assert = require('node:assert/strict');
const { PuppyGame, CATCH_LINE, HEIGHT } = require('../engine.js');

function fresh() {
  const game = new PuppyGame(() => 0.5);
  game.reset();
  game.spawnIn = 1000;
  return game;
}

function catchItem(game, type = 'coin', x = game.playerX) {
  game.items.push({ type, x, y: CATCH_LINE - 17, speed: 180, radius: 16 });
  game.update(1 / 60);
}

test('coins, bones and the fifth catch use the advertised scoring', () => {
  const game = fresh();
  catchItem(game);
  assert.equal(game.score, 10);
  catchItem(game, 'bone');
  assert.equal(game.score, 40);
  catchItem(game); catchItem(game); catchItem(game);
  assert.equal(game.score, 80);
  assert.equal(game.coins, 4);
  assert.equal(game.combo, 5);
  assert.equal(game.maxCombo, 5);
  assert.equal(game.events[0].points, 20);
});

test('missing a reward resets the combo without removing a heart', () => {
  const game = fresh();
  catchItem(game); catchItem(game);
  game.items.push({ type: 'coin', x: 50, y: HEIGHT + 20, speed: 180, radius: 16 });
  game.update(1 / 60);
  assert.equal(game.combo, 0);
  assert.equal(game.maxCombo, 2);
  assert.equal(game.lives, 3);
});

test('a distant reward does not count as caught', () => {
  const game = fresh();
  catchItem(game, 'coin', 50);
  assert.equal(game.score, 0);
  assert.equal(game.items.length, 1);
});

test('bombs cost one heart, break combo, and grant a short protection window', () => {
  const game = fresh();
  catchItem(game); catchItem(game);
  catchItem(game, 'bomb');
  assert.equal(game.lives, 2);
  assert.equal(game.combo, 0);
  assert.equal(game.score, 20);
  catchItem(game, 'bomb');
  assert.equal(game.lives, 2);
  assert.equal(game.items.length, 0);
  for (let i = 0; i < 6; i++) game.update(0.25);
  catchItem(game, 'bomb');
  assert.equal(game.lives, 1);
});

test('three separate hits end a round and a restart resets its state', () => {
  const game = fresh();
  for (let hit = 0; hit < 3; hit++) {
    game.invincible = 0;
    catchItem(game, 'bomb');
  }
  assert.equal(game.status, 'over');
  assert.equal(game.reason, 'lives');
  assert.equal(game.lives, 0);
  game.reset();
  assert.equal(game.status, 'playing');
  assert.equal(game.lives, 3);
  assert.equal(game.remaining, 60);
  assert.equal(game.items.length, 0);
  assert.equal(game.score, 0);
});

test('pause freezes time and falling items, then resume continues', () => {
  const game = fresh();
  game.items.push({ type: 'coin', x: 50, y: 100, speed: 180, radius: 16 });
  game.togglePause();
  game.update(0.2);
  assert.equal(game.remaining, 60);
  assert.equal(game.items[0].y, 100);
  game.togglePause();
  game.update(0.2);
  assert.ok(game.remaining < 60);
  assert.ok(game.items[0].y > 100);
});

test('time limit finishes exactly once with no postgame scoring', () => {
  const game = fresh();
  for (let i = 0; i < 241; i++) game.update(0.25);
  assert.equal(game.status, 'over');
  assert.equal(game.reason, 'time');
  assert.equal(game.remaining, 0);
  catchItem(game);
  assert.equal(game.score, 0);
  assert.equal(game.events.length, 0);
});

test('the dog stays on the field and ignores nonfinite movement', () => {
  const game = fresh();
  game.setPlayer(-100); assert.equal(game.playerX, 80);
  game.setPlayer(10000); assert.equal(game.playerX, 720);
  game.setPlayer(NaN); assert.equal(game.playerX, 720);
  game.move(-1, 0.25); assert.equal(game.playerX, 582.5);
});

test('coins at either spawn edge remain reachable with the wider character padding', () => {
  const game = fresh();
  game.setPlayer(-1000);
  catchItem(game, 'coin', 40);
  assert.equal(game.score, 10);
  game.setPlayer(1000);
  catchItem(game, 'coin', 760);
  assert.equal(game.score, 20);
});

test('slow frames still catch an item crossing the dog', () => {
  const game = fresh();
  game.items.push({ type: 'coin', x: game.playerX, y: CATCH_LINE - 100, speed: 1600, radius: 16 });
  game.update(0.15);
  assert.equal(game.score, 10);
  assert.equal(game.items.length, 0);
});

test('rounds start gently, then offer all three item types', () => {
  let roll = 0;
  const game = new PuppyGame(() => roll);
  game.reset(); game.spawn();
  assert.equal(game.items[0].type, 'coin');
  game.elapsed = 10;
  game.spawn(); assert.equal(game.items[1].type, 'bomb');
  roll = 0.95; game.spawn(); assert.equal(game.items[2].type, 'bone');
  roll = 0.5; game.spawn(); assert.equal(game.items[3].type, 'coin');
});
