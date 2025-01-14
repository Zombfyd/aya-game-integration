// GameManager.js
class GameManager {
  constructor() {
    // Initialize game state variables
    this.canvas = null;
    this.ctx = null;
    this.gameLoopId = null;
    this.gameActive = false;
    this.score = 0;
    this.lives = 10;
    this.teardrops = [];
    this.goldtears = [];
    this.redtears = [];
    this.blacktears = [];
    this.splashes = [];
    this.bucket = null;
    this.speedMultiplier = 1;
    this.lastCheckpoint = 0;
    this.spawnTimers = {
      teardrop: null,
      goldtear: null,
      redtear: null,
      blacktear: null
    };

    // Load and manage game images
    this.images = {
      bucket: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/674fb166a33aa5af2e8be714_1faa3.svg"),
      teardrop: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/676b2256d6f25cb51c68229b_BlueTear.2.png"),
      goldtear: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/676b32a8d6f25cb51c70748a_GoldTear.2.png"),
      redtear: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/676b2256456275e1857d4646_RedTear.2.png"),
      blacktear: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/676b225c9f972035e5189e4b_GreenTear.2.png"),
      background: this.loadImage("https://cdn.prod.website-files.com/6744eaad4ef3982473db4359/675f182861501c77469cf67a_AYABG72.gif")
    };

    // Bind methods to maintain correct 'this' context
    this.gameLoop = this.gameLoop.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  // Helper method to load images
  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  // Initialize the game environment
  async initialize() {
    this.canvas = document.getElementById('tearCatchGameCanvas');
    if (!this.canvas) {
      console.error('Canvas element not found');
      return false;
    }

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Set up event listeners
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('resize', this.handleResize);

    // Wait for all images to load
    try {
      await Promise.all(
        Object.values(this.images).map(img => 
          new Promise((resolve, reject) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = reject;
            }
          })
        )
      );
      return true;
    } catch (error) {
      console.error('Failed to load game images:', error);
      return false;
    }
  }

  // Handle canvas resizing
  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = this.canvas.parentNode.offsetWidth;
      this.canvas.height = this.canvas.parentNode.offsetHeight;
      
      // Adjust bucket position after resize
      if (this.bucket) {
        this.bucket.y = this.canvas.height - 80;
        this.bucket.x = Math.min(this.bucket.x, this.canvas.width - this.bucket.width);
      }
    }
  }

  // Start a new game
  startGame(mode = 'free', sessionToken = null) {
    // Clear any existing game state
    this.clearGame();
    
    // Initialize new game
    this.gameMode = mode;
    this.sessionToken = sessionToken;
    this.initGame();
  }

  // Clear existing game state
  clearGame() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
    
    // Clear spawn timers
    Object.values(this.spawnTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });

    // Reset game state
    this.teardrops = [];
    this.goldtears = [];
    this.redtears = [];
    this.blacktears = [];
    this.splashes = [];
  }

  // Initialize game state
  initGame() {
    // Reset game variables
    this.score = 0;
    this.lives = 10;
    this.speedMultiplier = 1;
    this.lastCheckpoint = 0;
    this.gameActive = true;

    // Initialize bucket position
    this.bucket = {
      x: this.canvas.width / 2 - 50,
      y: this.canvas.height - 80,
      width: 70,
      height: 70,
      speed: 0
    };

    // Start spawning tears after a short delay
    setTimeout(() => {
      this.spawnTeardrop();
      this.spawnGoldtear();
      this.spawnRedtear();
      this.spawnBlacktear();
    }, 2000);

    // Start the game loop
    this.gameLoop();
  }

  // Handle pointer/mouse movement
  handlePointerMove(e) {
    if (!this.gameActive || !this.bucket) return;

    const rect = this.canvas.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    
    // Update bucket position
    this.bucket.x = Math.min(
      Math.max(pointerX - this.bucket.width / 2, 0),
      this.canvas.width - this.bucket.width
    );
  }

  // Handle window resize
  handleResize() {
    this.resizeCanvas();
  }

  // Spawn different types of tears
  spawnTeardrop() {
    if (!this.gameActive) return;
    
    this.teardrops.push(new Teardrop(this.canvas.width, this.speedMultiplier));
    this.spawnTimers.teardrop = setTimeout(() => this.spawnTeardrop(), Math.random() * 750 + 300);
  }

  spawnGoldtear() {
    if (!this.gameActive) return;
    
    this.goldtears.push(new Goldtear(this.canvas.width, this.speedMultiplier));
    this.spawnTimers.goldtear = setTimeout(() => this.spawnGoldtear(), Math.random() * 3000 + 1500);
  }

  spawnRedtear() {
    if (!this.gameActive) return;
    
    this.redtears.push(new Redtear(this.canvas.width, this.speedMultiplier));
    this.spawnTimers.redtear = setTimeout(() => this.spawnRedtear(), Math.random() * 12000 + 3000);
  }

  spawnBlacktear() {
    if (!this.gameActive) return;
    
    this.blacktears.push(new Blacktear(this.canvas.width, this.speedMultiplier));
    this.spawnTimers.blacktear = setTimeout(() => this.spawnBlacktear(), Math.random() * 6000 + 3000);
  }

  // Update game state
  updateGame() {
    this.updateEntities(this.teardrops, false, false, false);
    this.updateEntities(this.goldtears, true, false, false);
    this.updateEntities(this.redtears, false, true, false);
    this.updateEntities(this.blacktears, false, false, true);

    // Update speed multiplier based on score
    if (this.score >= this.lastCheckpoint + 100) {
      this.speedMultiplier *= 1.1;
      this.lastCheckpoint += 100;
    }

    // Check for game over
    if (this.lives <= 0 && this.gameActive) {
      this.gameActive = false;
      this.handleGameOver();
    }
  }

  // Update entities (tears and splashes)
  updateEntities(entities, isGold, isRed, isBlack) {
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      entity.update();

      if (this.checkCollision(entity, this.bucket)) {
        entities.splice(i, 1);
        this.handleCollision(entity, isGold, isRed, isBlack);
      } else if (entity.y > this.canvas.height) {
        entities.splice(i, 1);
        if (!isRed) this.lives--;
      }
    }
  }

  // Check collision between entities
  checkCollision(entity, bucket) {
    return (
      entity.x < bucket.x + bucket.width &&
      entity.x + entity.width > bucket.x &&
      entity.y < bucket.y + bucket.height &&
      entity.y + entity.height > bucket.y
    );
  }

  // Handle collision effects
  handleCollision(entity, isGold, isRed, isBlack) {
    if (isGold) {
      this.score += 15;
      this.splashes.push(new GoldSplash(entity.x + entity.width / 2, this.bucket.y));
    } else if (isRed) {
      this.lives--;
      this.splashes.push(new RedSplash(entity.x + entity.width / 2, this.bucket.y));
    } else if (isBlack) {
      this.lives++;
      this.splashes.push(new GreenSplash(entity.x + entity.width / 2, this.bucket.y));
    } else {
      this.score += 1;
      this.splashes.push(new Splash(entity.x + entity.width / 2, this.bucket.y));
    }
  }

  // Draw game state
  drawGame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background (if needed)
    // this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);

    // Draw bucket
    this.ctx.drawImage(this.images.bucket, this.bucket.x, this.bucket.y, this.bucket.width, this.bucket.height);

    // Draw all tears
    this.teardrops.forEach(tear => tear.draw(this.ctx, this.images.teardrop));
    this.goldtears.forEach(tear => tear.draw(this.ctx, this.images.goldtear));
    this.redtears.forEach(tear => tear.draw(this.ctx, this.images.redtear));
    this.blacktears.forEach(tear => tear.draw(this.ctx, this.images.blacktear));

    // Draw splashes
    this.splashes.forEach((splash, index) => {
      splash.update();
      splash.draw(this.ctx);
      if (splash.opacity <= 0) this.splashes.splice(index, 1);
    });

    // Draw UI
    this.drawUI();
  }

  // Draw UI elements
  drawUI() {
    this.ctx.font = "25px Inconsolata";
    this.ctx.fillStyle = "#2054c9";
    
    // Draw score
    this.ctx.fillText(`Score: ${this.score}`, 20, 30);
    
    // Draw lives
    this.ctx.font = "18px Inconsolata";
    this.ctx.fillText(`${this.lives}`, this.bucket.x + (this.bucket.width / 2) - 10, this.bucket.y + 40);
    
    // Draw speed
    this.ctx.font = "25px Inconsolata";
    this.ctx.fillText(`Speed ${Math.round(this.speedMultiplier * 10) - 10}`, this.canvas.width - 120, 30);
    
    // Draw legend
    this.drawLegend();
  }

  // Draw game legend
  drawLegend() {
    this.ctx.font = "18px Inconsolata";
    
    this.ctx.fillStyle = "#2054c9";
    this.ctx.fillText('Blue Tear = 1 point', 20, 50);
    
    this.ctx.fillStyle = "#FFD04D";
    this.ctx.fillText('Gold Tear = 15 points', 20, 70);
    
    this.ctx.fillStyle = "#FF4D6D";
    this.ctx.fillText('Red Tear = -1 life', 20, 90);
    
    this.ctx.fillStyle = "#39B037";
    this.ctx.fillText('Green Tear = +1 life', 20, 110);
  }

  // Main game loop
  gameLoop() {
    if (this.gameActive) {
      this.updateGame();
      this.drawGame();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  }

  // Handle game over
  async handleGameOver() {
    if (window.currentWalletAddress) {
      await this.submitScore();
    }
    // Show game over UI
    const scorePopup = document.getElementById('scorePopup');
    const finalScore = document.getElementById('finalScore');
    if (scorePopup && finalScore) {
      finalScore.textContent = this.score;
      scorePopup.style.display = 'block';
    }
  }

  // Submit score to leaderboard
  async submitScore() {
    if (!window.currentWalletAddress) {
      console.error('No wallet connected');
      return;
    }

    try {
      const endpoint = this.sessionToken 
        ? 'https://ayagame.onrender.com/api/scores/submit/paid'
        : 'https://ayagame.onrender.com/api/scores/submit/free';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerWallet: window.currentWalletAddress,
          score: this.score,
          gameType: 'main',
          sessionToken: this.sessionToken
        })
      });

      if (!response.ok) throw new Error('Failed to submit score');

      // Update leaderboards
      await this.updateLeaderboards();
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }
 async updateLeaderboards() {
    await Promise.all([
      this.fetchLeaderboard('main'),
      this.fetchLeaderboard('secondary')
    ]);
  }

  // Fetch leaderboard data
  async fetchLeaderboard(type) {
    try {
      const response = await fetch(`https://ayagame.onrender.com/api/scores/leaderboard/${type}/free`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} leaderboard`);
      }

      const data = await response.json();
      this.updateLeaderboardUI(type, data);
    } catch (error) {
      console.error(`Error fetching ${type} leaderboard:`, error);
    }
  }

  // Update leaderboard UI
  updateLeaderboardUI(type, data) {
    const tableBody = document.querySelector(`#${type}Leaderboard tbody`);
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    data.forEach(score => {
      const row = document.createElement('tr');
      const walletCell = document.createElement('td');
      const scoreCell = document.createElement('td');
      
      const formattedWallet = `${score.playerWallet.slice(0, 6)}...${score.playerWallet.slice(-6)}`;
      walletCell.textContent = formattedWallet;
      scoreCell.textContent = score.score;

      row.appendChild(walletCell);
      row.appendChild(scoreCell);
      tableBody.appendChild(row);
    });
  }
}

// Entity Classes
class Teardrop {
  constructor(canvasWidth, speedMultiplier) {
    this.x = Math.random() * (canvasWidth - 50);
    this.y = -50;
    this.speed = Math.random() * 4 * speedMultiplier + Math.random() * 100 * speedMultiplier / 20;
    this.width = 30;
    this.height = 50;
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx, image) {
    ctx.drawImage(image, this.x, this.y, this.width, this.height);
  }
}

class Goldtear extends Teardrop {
  constructor(canvasWidth, speedMultiplier) {
    super(canvasWidth, speedMultiplier);
    this.speed = Math.random() * 6 * speedMultiplier + Math.random() * 100 * speedMultiplier / 20;
  }
}

class Redtear extends Teardrop {
  constructor(canvasWidth, speedMultiplier) {
    super(canvasWidth, speedMultiplier);
    this.speed = Math.random() * 3 * speedMultiplier + Math.random() * 100 * speedMultiplier / 20;
  }
}

class Blacktear extends Teardrop {
  constructor(canvasWidth, speedMultiplier) {
    super(canvasWidth, speedMultiplier);
    this.speed = Math.random() * 4 * speedMultiplier + Math.random() * 100 * speedMultiplier / 20;
  }
}

// Splash effect classes
class Splash {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.opacity = 1;
  }

  update() {
    this.size += 5;
    this.opacity -= 0.05;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(32, 84, 201, ${this.opacity})`;
    ctx.fill();
  }
}

class GoldSplash extends Splash {
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 140, 0, ${this.opacity})`;
    ctx.fill();
  }
}

class RedSplash extends Splash {
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 28, 43, ${this.opacity})`;
    ctx.fill();
  }
}

class GreenSplash extends Splash {
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(124, 252, 0, ${this.opacity})`;
    ctx.fill();
  }
}

// Create and export game manager instance
export const gameManager = new GameManager();


