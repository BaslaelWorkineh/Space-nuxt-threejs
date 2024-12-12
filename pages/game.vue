<template>
    <div class="game-container">
      <!-- Game UI -->
      <div class="game-ui" v-if="!gameStarted">
        <div class="menu-card">
          <h1>Space Shooter</h1>
          <button @click="startGame" class="start-btn">Start Game</button>
          <div class="instructions">
            <h2>How to Play</h2>
            <ul>
              <li>Use Arrow Keys or WASD to move</li>
              <li>Space to shoot</li>
              <li>Dodge enemy ships and projectiles</li>
              <li>Collect power-ups for special abilities</li>
            </ul>
          </div>
        </div>
      </div>
  
      <!-- Game HUD -->
      <div class="game-hud" v-if="gameStarted">
        <div class="stats">
          <div class="score">Score: {{ score }}</div>
          <div class="health">
            <div class="health-bar" :style="{ width: `${health}%` }"></div>
          </div>
          <div class="weapon">
            Weapon: {{ currentWeapon }}
          </div>
        </div>
      </div>
  
      <!-- Game Canvas -->
      <canvas
        ref="gameCanvas"
        :width="canvasWidth"
        :height="canvasHeight"
        v-show="gameStarted"
      ></canvas>
  
      <!-- Game Over Screen -->
      <div class="game-over" v-if="gameOver">
        <div class="menu-card">
          <h2>Game Over</h2>
          <p>Final Score: {{ score }}</p>
          <button @click="restartGame" class="restart-btn">Play Again</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  
  // Game state
  const gameCanvas = ref(null);
  const gameStarted = ref(false);
  const gameOver = ref(false);
  const score = ref(0);
  const health = ref(100);
  const currentWeapon = ref('Laser');
  const canvasWidth = 800;
  const canvasHeight = 600;
  
  // Game objects
  let ctx;
  let player;
  let enemies = [];
  let bullets = [];
  let powerUps = [];
  let gameLoop;
  
  // Player class
  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 50;
      this.height = 50;
      this.speed = 5;
      this.color = '#00ff00';
    }
  
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width/2, this.y + this.height);
      ctx.lineTo(this.x + this.width/2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }
  
    move(direction) {
      switch(direction) {
        case 'left':
          this.x = Math.max(this.width/2, this.x - this.speed);
          break;
        case 'right':
          this.x = Math.min(canvasWidth - this.width/2, this.x + this.speed);
          break;
        case 'up':
          this.y = Math.max(0, this.y - this.speed);
          break;
        case 'down':
          this.y = Math.min(canvasHeight - this.height, this.y + this.speed);
          break;
      }
    }
  
    shoot() {
      bullets.push(new Bullet(this.x, this.y));
    }
  }
  
  // Bullet class
  class Bullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.speed = 7;
      this.width = 4;
      this.height = 10;
      this.color = '#ff0';
    }
  
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
    }
  
    update() {
      this.y -= this.speed;
    }
  }
  
  // Enemy class
  class Enemy {
    constructor() {
      this.width = 40;
      this.height = 40;
      this.x = Math.random() * (canvasWidth - this.width) + this.width/2;
      this.y = -this.height;
      this.speed = 2;
      this.color = '#ff0000';
    }
  
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x - this.width/2, this.y);
      ctx.lineTo(this.x + this.width/2, this.y);
      ctx.closePath();
      ctx.fill();
    }
  
    update() {
      this.y += this.speed;
      return this.y > canvasHeight;
    }
  }
  
  // Game functions
  const startGame = () => {
    gameStarted.value = true;
    gameOver.value = false;
    score.value = 0;
    health.value = 100;
    
    ctx = gameCanvas.value.getContext('2d');
    player = new Player(canvasWidth/2, canvasHeight - 100);
    
    gameLoop = setInterval(update, 1000/60);
    document.addEventListener('keydown', handleKeyPress);
  };
  
  const restartGame = () => {
    enemies = [];
    bullets = [];
    powerUps = [];
    startGame();
  };
  
  const update = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw and update player
    player.draw();
    
    // Update and draw bullets
    bullets = bullets.filter(bullet => {
      bullet.update();
      bullet.draw();
      return bullet.y > 0;
    });
    
    // Spawn enemies
    if (Math.random() < 0.02) {
      enemies.push(new Enemy());
    }
    
    // Update and draw enemies
    enemies = enemies.filter(enemy => {
      const survived = !enemy.update();
      enemy.draw();
      
      // Check collision with player
      if (checkCollision(enemy, player)) {
        health.value -= 10;
        if (health.value <= 0) {
          endGame();
        }
        return false;
      }
      
      // Check collision with bullets
      bullets.forEach((bullet, bulletIndex) => {
        if (checkCollision(bullet, enemy)) {
          score.value += 10;
          bullets.splice(bulletIndex, 1);
          return false;
        }
      });
      
      return survived;
    });
  };
  
  const checkCollision = (obj1, obj2) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };
  
  const handleKeyPress = (e) => {
    if (!gameStarted.value || gameOver.value) return;
    
    switch(e.key) {
      case 'ArrowLeft':
      case 'a':
        player.move('left');
        break;
      case 'ArrowRight':
      case 'd':
        player.move('right');
        break;
      case 'ArrowUp':
      case 'w':
        player.move('up');
        break;
      case 'ArrowDown':
      case 's':
        player.move('down');
        break;
      case ' ':
        player.shoot();
        break;
    }
  };
  
  const endGame = () => {
    gameOver.value = true;
    gameStarted.value = false;
    clearInterval(gameLoop);
    document.removeEventListener('keydown', handleKeyPress);
  };
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(gameLoop);
    document.removeEventListener('keydown', handleKeyPress);
  });
  </script>
  
  <style scoped>
  .game-container {
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
    position: relative;
  }
  
  canvas {
    border: 2px solid #333;
    background: #111;
  }
  
  .game-ui {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
  }
  
  .menu-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    color: #fff;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .menu-card h1 {
    font-size: 3rem;
    margin-bottom: 2rem;
    color: #0ff;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
  
  .start-btn, .restart-btn {
    background: #0ff;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 1rem 0;
  }
  
  .start-btn:hover, .restart-btn:hover {
    background: #00cccc;
    transform: scale(1.05);
  }
  
  .instructions {
    margin-top: 2rem;
    text-align: left;
  }
  
  .instructions ul {
    list-style: none;
    padding: 0;
  }
  
  .instructions li {
    margin: 0.5rem 0;
    color: #ccc;
  }
  
  .game-hud {
    position: absolute;
    top: 1rem;
    left: 1rem;
    color: #fff;
  }
  
  .stats {
    display: flex;
    gap: 2rem;
    align-items: center;
  }
  
  .score {
    font-size: 1.5rem;
    color: #0ff;
  }
  
  .health {
    width: 200px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }
  
  .health-bar {
    height: 100%;
    background: #0f0;
    transition: width 0.3s ease;
  }
  
  .weapon {
    font-size: 1.2rem;
    color: #ff0;
  }
  
  .game-over {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
  }
  </style>