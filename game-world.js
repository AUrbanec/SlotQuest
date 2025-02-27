/**
 * SlotQuest Game World Generator
 * Procedurally generates 16-bit platformer game levels
 */

// Game world parameters
const gameWorld = {
    // Current world state
    currentLevel: 1,
    worldElements: [],
    clouds: [],
    platforms: [],
    decorations: [],
    coins: [],
    
    // Constants for level generation
    CLOUD_COUNT: 5,
    PLATFORM_COUNT_MIN: 3,
    PLATFORM_COUNT_MAX: 8,
    TREE_COUNT: 4,
    BUSH_COUNT: 6,
    COIN_COUNT: 8,
    
    // World dimensions (will match container)
    width: 0,
    height: 0,
    
    /**
     * Initialize the game world
     */
    initialize(level = 1) {
        this.currentLevel = level;
        this.worldElements = [];
        this.platforms = [];
        this.decorations = [];
        this.coins = [];
        
        // Get world container dimensions
        const worldContainer = document.getElementById('game-world');
        this.width = worldContainer.offsetWidth;
        this.height = worldContainer.offsetHeight;
        
        // Clear any existing elements
        while (worldContainer.children.length > 1) { // Keep player character
            worldContainer.removeChild(worldContainer.lastChild);
        }
        
        // Add ground
        this.addGround();
        
        // Generate level elements based on current level
        this.generateClouds();
        this.generatePlatforms();
        this.generateDecorations();
        this.generateCoins();
        
        // Add all elements to the world
        this.worldElements.forEach(element => {
            worldContainer.appendChild(element);
        });
        
        // Start animations
        this.animateClouds();
    },
    
    /**
     * Add the ground platform
     */
    addGround() {
        const ground = document.createElement('div');
        ground.className = 'ground';
        this.worldElements.push(ground);
    },
    
    /**
     * Generate clouds for the sky background
     */
    generateClouds() {
        const cloudCount = this.CLOUD_COUNT + Math.floor(this.currentLevel / 2);
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            // Style the cloud
            const width = 30 + Math.random() * 70;
            const height = 15 + Math.random() * 15;
            
            // Position randomly
            const top = 10 + Math.random() * 100;
            const left = Math.random() * this.width;
            
            cloud.style.width = `${width}px`;
            cloud.style.height = `${height}px`;
            cloud.style.top = `${top}px`;
            cloud.style.left = `${left}px`;
            cloud.style.position = 'absolute';
            cloud.style.backgroundColor = '#ffffff';
            cloud.style.borderRadius = '50%';
            cloud.style.opacity = '0.7';
            cloud.style.zIndex = '-1';
            cloud.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.1)';
            cloud.style.transform = 'scale(1)';
            
            // Create the illusion of a puffy cloud with pseudo elements
            cloud.style.setProperty('--cloud-before-width', `${width * 0.7}px`);
            cloud.style.setProperty('--cloud-before-height', `${height * 1.2}px`);
            cloud.style.setProperty('--cloud-before-top', `-${height * 0.3}px`);
            cloud.style.setProperty('--cloud-before-left', `${width * 0.2}px`);
            
            this.worldElements.push(cloud);
            this.clouds.push({ element: cloud, speed: 0.1 + Math.random() * 0.2 });
        }
        
        // Add cloud styles
        if (!document.getElementById('cloud-styles')) {
            const cloudStyles = document.createElement('style');
            cloudStyles.id = 'cloud-styles';
            cloudStyles.textContent = `
                .cloud::before {
                    content: '';
                    position: absolute;
                    width: var(--cloud-before-width);
                    height: var(--cloud-before-height);
                    top: var(--cloud-before-top);
                    left: var(--cloud-before-left);
                    background-color: #ffffff;
                    border-radius: 50%;
                    z-index: -1;
                }
            `;
            document.head.appendChild(cloudStyles);
        }
    },
    
    /**
     * Generate platforms for the level
     */
    generatePlatforms() {
        // Number of platforms increases with level
        const platformCount = this.PLATFORM_COUNT_MIN + 
            Math.min(Math.floor(this.currentLevel / 2), 
                    this.PLATFORM_COUNT_MAX - this.PLATFORM_COUNT_MIN);
        
        // Create platforms with different sizes based on level
        for (let i = 0; i < platformCount; i++) {
            const platform = document.createElement('div');
            platform.className = 'platform';
            
            // Size based on level - higher levels have smaller platforms
            const width = 60 + Math.random() * (150 - Math.min(this.currentLevel * 5, 100));
            const height = 15 + Math.random() * 10;
            
            // Position with more vertical variation in higher levels
            const level = i / platformCount;
            const verticalZone = this.height * 0.7; // Use 70% of screen height for platforms
            const top = 40 + (verticalZone * level) + Math.random() * 40;
            
            // Horizontal position - avoid overlapping platforms
            let left = Math.random() * (this.width - width);
            if (i > 0) {
                // Try to space platforms more evenly
                const prevPlatform = this.platforms[i-1];
                const prevLeft = parseFloat(prevPlatform.style.left);
                const prevWidth = parseFloat(prevPlatform.style.width);
                const minGap = 30;
                
                if (Math.abs(left - prevLeft) < minGap) {
                    // Adjust position to maintain minimum gap
                    left = (left < prevLeft) ? 
                        Math.max(0, prevLeft - prevWidth - minGap) : 
                        Math.min(this.width - width, prevLeft + prevWidth + minGap);
                }
            }
            
            platform.style.width = `${width}px`;
            platform.style.height = `${height}px`;
            platform.style.top = `${top}px`;
            platform.style.left = `${left}px`;
            
            this.worldElements.push(platform);
            this.platforms.push(platform);
        }
    },
    
    /**
     * Generate decorative elements like trees and bushes
     */
    generateDecorations() {
        // Trees
        for (let i = 0; i < this.TREE_COUNT; i++) {
            const tree = document.createElement('div');
            tree.className = 'tree';
            
            // Position along ground
            const left = 20 + Math.random() * (this.width - 40);
            tree.style.left = `${left}px`;
            
            this.worldElements.push(tree);
            this.decorations.push(tree);
        }
        
        // Bushes
        for (let i = 0; i < this.BUSH_COUNT; i++) {
            const bush = document.createElement('div');
            bush.className = 'bush';
            
            // Position along ground or on platforms
            const onPlatform = Math.random() > 0.5 && this.platforms.length > 0;
            
            if (onPlatform) {
                // Place on a random platform
                const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
                const platformLeft = parseFloat(platform.style.left);
                const platformWidth = parseFloat(platform.style.width);
                const platformTop = parseFloat(platform.style.top);
                
                const left = platformLeft + Math.random() * (platformWidth - 32);
                bush.style.left = `${left}px`;
                bush.style.bottom = `${this.height - platformTop}px`;
            } else {
                // Place on ground
                const left = Math.random() * (this.width - 32);
                bush.style.left = `${left}px`;
                bush.style.bottom = '40px';
            }
            
            this.worldElements.push(bush);
            this.decorations.push(bush);
        }
    },
    
    /**
     * Generate collectible coins
     */
    generateCoins() {
        // Coins - more coins in higher levels
        const coinCount = this.COIN_COUNT + Math.floor(this.currentLevel / 2);
        
        for (let i = 0; i < coinCount; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            
            // Position - prefer platforms but some on ground level
            const onPlatform = Math.random() > 0.3 && this.platforms.length > 0;
            
            if (onPlatform) {
                // Place on a random platform
                const platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
                const platformLeft = parseFloat(platform.style.left);
                const platformWidth = parseFloat(platform.style.width);
                const platformTop = parseFloat(platform.style.top);
                
                const left = platformLeft + 10 + Math.random() * (platformWidth - 20);
                const top = platformTop - 25 - Math.random() * 20;
                
                coin.style.left = `${left}px`;
                coin.style.top = `${top}px`;
            } else {
                // Place floating in air or near ground
                const left = 50 + Math.random() * (this.width - 100);
                const top = 80 + Math.random() * (this.height - 150);
                
                coin.style.left = `${left}px`;
                coin.style.top = `${top}px`;
            }
            
            this.worldElements.push(coin);
            this.coins.push(coin);
        }
    },
    
    /**
     * Animate cloud movement
     */
    animateClouds() {
        // Request animation frame for smooth animation
        let lastTime = 0;
        
        const animate = (time) => {
            if (!lastTime) lastTime = time;
            const deltaTime = time - lastTime;
            lastTime = time;
            
            // Move each cloud
            this.clouds.forEach(cloud => {
                const left = parseFloat(cloud.element.style.left);
                const width = parseFloat(cloud.element.style.width);
                
                // Move cloud to the right
                let newLeft = left + cloud.speed * deltaTime / 16;
                
                // Wrap around when off screen
                if (newLeft > this.width) {
                    newLeft = -width;
                }
                
                cloud.element.style.left = `${newLeft}px`;
            });
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        // Start animation
        requestAnimationFrame(animate);
    }
};

// Add document ready handler to initialize the game world
document.addEventListener('DOMContentLoaded', function() {
    // Game world will be initialized when starting the game
    // We'll connect this to the game flow in script.js
});