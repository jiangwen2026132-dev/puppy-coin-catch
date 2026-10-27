/* Game rules are independent of the browser so collisions and scoring can be verified. */
(function (root) {
  'use strict';
  const WIDTH = 800;
  const HEIGHT = 520;
  const DURATION = 60;
  const PLAYER_Y = 450;
  const PLAYER_HALF_WIDTH = 33;
  const CATCH_LINE = PLAYER_Y - 31;

  class PuppyGame {
    constructor(random = Math.random) {
      this.random = random;
      this.reset();
      this.status = 'ready';
    }

    reset() {
      this.status = 'playing';
      this.remaining = DURATION;
      this.elapsed = 0;
      this.score = 0;
      this.coins = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.lives = 3;
      this.playerX = WIDTH / 2;
      this.items = [];
      this.events = [];
      this.spawnIn = 0.45;
      this.invincible = 0;
      this.nextId = 0;
      this.reason = '';
    }

    setPlayer(x) {
      // The full illustrated character includes a tail; keep its silhouette on screen.
      if (Number.isFinite(x)) this.playerX = Math.max(80, Math.min(WIDTH - 80, x));
    }

    move(direction, dt) {
      if (this.status === 'playing') this.setPlayer(this.playerX + direction * 550 * dt);
    }

    togglePause() {
      if (this.status === 'playing') this.status = 'paused';
      else if (this.status === 'paused') this.status = 'playing';
    }

    spawn() {
      const roll = this.random();
      // Give the player a gentle first three seconds.
      const type = this.elapsed < 3 ? 'coin' : roll < 0.19 ? 'bomb' : roll > 0.91 ? 'bone' : 'coin';
      const progress = this.elapsed / DURATION;
      this.items.push({
        id: this.nextId++, type, x: 40 + this.random() * (WIDTH - 80), y: -26,
        speed: 140 + progress * 95 + this.random() * 35,
        radius: type === 'bone' ? 20 : 16,
        phase: this.random() * Math.PI * 2,
      });
    }

    finish(reason) {
      this.status = 'over';
      this.reason = reason;
      this.events.push({ type: 'end', reason });
    }

    update(dt) {
      this.events = [];
      if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      // Substeps keep collisions reliable even if a frame is slow.
      let left = Math.min(dt, 0.25, this.remaining);
      while (left > 0.000001 && this.status === 'playing') {
        const step = Math.min(left, 1 / 60);
        this.tick(step);
        left -= step;
      }
    }

    tick(dt) {
      this.elapsed += dt;
      this.remaining = Math.max(0, DURATION - this.elapsed);
      this.invincible = Math.max(0, this.invincible - dt);
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.spawn();
        this.spawnIn += Math.max(0.34, 0.75 - this.elapsed * 0.006);
      }
      const survivors = [];
      for (const item of this.items) {
        if (this.status !== 'playing') { survivors.push(item); continue; }
        const oldY = item.y;
        item.y += item.speed * dt;
        const crosses = oldY - item.radius < CATCH_LINE + 20 && item.y + item.radius >= CATCH_LINE;
        const overlaps = Math.abs(item.x - this.playerX) < PLAYER_HALF_WIDTH + item.radius * 0.7;
        if (crosses && overlaps) {
          if (item.type === 'bomb') {
            if (this.invincible <= 0) {
              this.lives -= 1;
              this.combo = 0;
              this.invincible = 1.2;
              this.events.push({ type: 'hit', x: item.x, y: item.y });
              if (this.lives === 0) this.finish('lives');
            }
          } else {
            this.combo += 1;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            const points = (item.type === 'bone' ? 30 : 10) * (this.combo >= 5 ? 2 : 1);
            this.score += points;
            if (item.type === 'coin') this.coins += 1;
            this.events.push({ type: 'catch', kind: item.type, points, x: item.x, y: item.y });
          }
          continue;
        }
        if (item.y - item.radius > HEIGHT) {
          if (item.type !== 'bomb') this.combo = 0;
          continue;
        }
        survivors.push(item);
      }
      this.items = survivors;
      if (this.remaining <= 0.000001 && this.status === 'playing') {
        this.remaining = 0;
        this.finish('time');
      }
    }
  }

  const api = { PuppyGame, WIDTH, HEIGHT, DURATION, PLAYER_Y, CATCH_LINE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PuppyEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
