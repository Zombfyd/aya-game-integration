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
 initGame() {
    console.log('Initializing game components...');
    
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

    // Initialize arrays
    this.teardrops = [];
    this.goldtears = [];
    this.redtears = [];
    this.blacktears = [];
    this.splashes = [];

    // Clear any existing timers
    Object.values(this.spawnTimers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });

    console.log('Game components initialized');
  }
  // Start a new game
  startGame(mode = 'free') {
  console.log('Starting game in mode:', mode);
  
  // Clear any existing game state
  this.clearGame();
  
  // Use initGame for initialization
  this.initGame();
  
  // Set game mode (only needed in startGame)
  this.gameMode = mode;

  // Draw initial game state
  this.drawGame();

  // Start spawning tears with a delay
  setTimeout(() => {
    if (this.gameActive) {
      this.spawnTeardrop();
      this.spawnGoldtear();
      this.spawnRedtear();
      this.spawnBlacktear();
    }
  }, 1000);

  // Start the game loop
  if (!this.gameLoopId) {
    this.gameLoop();
  }
  
  console.log('Game started successfully');
  return true;
}
    // Start spawning tears after a short delay
clearGame() {
  // Cancel existing game loop
  if (this.gameLoopId) {
    cancelAnimationFrame(this.gameLoopId);
    this.gameLoopId = null;
  }
  
  // Clear spawn timers
  Object.values(this.spawnTimers).forEach(timer => {
    if (timer) clearTimeout(timer);
  });

  // Reset spawn timers
  this.spawnTimers = {
    teardrop: null,
    goldtear: null,
    redtear: null,
    blacktear: null
  };

  // Clear game objects
  this.teardrops = [];
  this.goldtears = [];
  this.redtears = [];
  this.blacktears = [];
  this.splashes = [];
  this.gameActive = false;
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

    this.splashes = this.splashes.filter(splash => {
    splash.update();
    return splash.opacity > 0;
  });
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
  drawTear(tear, image) {
  if (!this.ctx || !image) return;
  
  this.ctx.drawImage(
    image,
    tear.x,
    tear.y,
    tear.width,
    tear.height
  );
}
  // Draw game state
  drawGame() {
    if (!this.ctx) return;

    // Draw bucket
    if (this.bucket && this.images.bucket) {
      this.ctx.drawImage(
        this.images.bucket,
        this.bucket.x,
        this.bucket.y,
        this.bucket.width,
        this.bucket.height
      );
    }

    // Draw tears
    this.teardrops.forEach(tear => this.drawTear(tear, this.images.teardrop));
    this.goldtears.forEach(tear => this.drawTear(tear, this.images.goldtear));
    this.redtears.forEach(tear => this.drawTear(tear, this.images.redtear));
    this.blacktears.forEach(tear => this.drawTear(tear, this.images.blacktear));

    // Draw UI
    this.drawUI();
  }

  // Additional game methods (handlePointerMove, spawnTeardrop, etc.) remain the same...
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
  if (!this.gameActive || !this.ctx) return;
  
  try {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update game state
    this.updateGame();

    // Draw everything
    this.drawGame();

    // Continue loop
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  } catch (error) {
    console.error('Error in game loop:', error);
    this.gameActive = false;
    this.handleGameOver();
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
      scorePopup.style.visibility = "visible";
    }
  }
}

class Entity {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  update() {
    this.y += this.speed;
  }
}

class Teardrop extends Entity {
  constructor(canvasWidth, speedMultiplier) {
    super(Math.random() * canvasWidth, 0, 50, 50, Math.random() * 2 + 2 * speedMultiplier);
  }

  draw(ctx, image) {
    ctx.drawImage(image, this.x, this.y, this.width, this.height);
  }
}

class Goldtear extends Teardrop {}
class Redtear extends Teardrop {}
class Blacktear extends Teardrop {}

class Splash {
  constructor(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('Invalid coordinates for splash effect');
    }
    this.x = x;
    this.y = y;
    this.opacity = 1;
    this.fillColor = "rgba(255, 0, 0";
    this.radius = 20;
  }

  update() {
    this.opacity = Math.max(0, this.opacity - 0.03);
  }

  draw(ctx) {
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.fillStyle = `${this.fillColor}, ${this.opacity})`;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

class GoldSplash extends Splash {
  constructor(x, y) {
    super(x, y);
    this.fillColor = "rgba(255, 204, 51";
  }
}

class RedSplash extends Splash {
  constructor(x, y) {
    super(x, y);
    this.fillColor = "rgba(255, 0, 0";
  }
}

class GreenSplash extends Splash {
  constructor(x, y) {
    super(x, y);
    this.fillColor = "rgba(0, 255, 0";
  }
}

// Create and export game manager instance
export const gameManager = new GameManager();


