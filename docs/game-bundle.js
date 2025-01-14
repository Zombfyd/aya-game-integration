window.addEventListener('DOMContentLoaded', function() {
    console.log('Game bundle loaded successfully');
    
    // Game initialization
    initializeGame();
});

// Function to initialize the game
function initializeGame() {
    const canvas = document.getElementById('tearCatchGameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        return;
    }

    // Configure canvas size
    canvas.width = window.innerWidth;
    canvas.height = 700;

    startGameLoop(ctx, canvas);
}
