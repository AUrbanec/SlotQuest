document.addEventListener('DOMContentLoaded', function() {
    // Sound effects
    const sounds = {
        buttonClick: new Audio('sounds/button-click.mp3'),
        slotSelect: new Audio('sounds/slot-select.mp3'),
        win: new Audio('sounds/win.mp3'),
        loss: new Audio('sounds/loss.mp3'),
        gameStart: new Audio('sounds/game-start.mp3'),
        gameComplete: new Audio('sounds/game-complete.mp3')
    };

    // Initialize sounds with null controls to prevent errors if files don't load
    Object.keys(sounds).forEach(key => {
        sounds[key].volume = 0.3;
        
        // Create a dummy play method that doesn't throw errors if audio isn't loaded
        const originalPlay = sounds[key].play;
        sounds[key].play = function() {
            try {
                originalPlay.call(this);
            } catch(e) {
                console.warn(`Sound couldn't play: ${key}`, e);
            }
        };
    });

    // Game state
    const gameState = {
        totalAmount: 1000,
        minBuy: 20,
        maxBuy: 100,
        numGames: 5,
        selectedProviders: [],
        currentRoom: 1,
        currentGold: 1000,
        initialGold: 1000,
        slots: [],
        currentSlot: null,
        gameResults: [],
        bestSlot: { name: 'None', profit: 0 },
        worstSlot: { name: 'None', loss: 0 },
        animations: {
            coinParticles: []
        }
    };

    // DOM Elements
    const titleScreen = document.getElementById('title-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultsScreen = document.getElementById('results-screen');
    const startGameBtn = document.getElementById('start-game-btn');
    const totalAmountInput = document.getElementById('total-amount');
    const minBuyInput = document.getElementById('min-buy');
    const maxBuyInput = document.getElementById('max-buy');
    const numGamesInput = document.getElementById('num-games');
    const providerCheckboxes = document.getElementById('provider-checkboxes');
    const currentRoomElement = document.getElementById('current-room');
    const totalRoomsElement = document.getElementById('total-rooms');
    const currentGoldElement = document.getElementById('current-gold');
    const slotNameElement = document.getElementById('slot-name');
    const slotImageElement = document.getElementById('slot-image');
    const slotProviderElement = document.getElementById('slot-provider');
    const buyAmountInput = document.getElementById('buy-amount');
    const playSlotBtn = document.getElementById('play-slot-btn');
    const rerollBtn = document.getElementById('reroll-btn');
    const resultGroup = document.querySelector('.result-group');
    const resultAmountInput = document.getElementById('result-amount');
    const submitResultBtn = document.getElementById('submit-result-btn');
    const healthFill = document.getElementById('health-fill');
    const healthAmount = document.getElementById('health-amount');
    const finalBalanceElement = document.getElementById('final-balance');
    const totalProfitLossElement = document.getElementById('total-profit-loss');
    const battlesList = document.getElementById('battles-list');
    const bestSlotElement = document.getElementById('best-slot');
    const bestProfitElement = document.getElementById('best-profit');
    const worstSlotElement = document.getElementById('worst-slot');
    const worstLossElement = document.getElementById('worst-loss');
    const restartBtn = document.getElementById('restart-btn');

    // Load slots data
    let allSlots = [];
    let providers = new Set();

    // Fetch the slot data
    fetch('stake.json')
        .then(response => response.json())
        .then(data => {
            allSlots = data[0].slot_games;
            
            // Extract all unique providers
            allSlots.forEach(slot => {
                providers.add(slot.provider);
            });
            
            // Populate provider checkboxes
            populateProviderCheckboxes();
        })
        .catch(error => {
            console.error('Error loading slots data:', error);
            alert('Failed to load slots data. Please refresh the page.');
        });

    // Populate provider checkboxes
    function populateProviderCheckboxes() {
        providerCheckboxes.innerHTML = '';
        
        // Sort providers alphabetically
        const sortedProviders = Array.from(providers).sort();
        
        sortedProviders.forEach(provider => {
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `provider-${provider.replace(/\s+/g, '-').toLowerCase()}`;
            checkbox.value = provider;
            checkbox.checked = true; // All checked by default
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = provider;
            
            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            providerCheckboxes.appendChild(checkboxItem);
        });
    }

    // Start Game
    startGameBtn.addEventListener('click', function() {
        // Play button click sound
        sounds.buttonClick.play();
        
        // Get values from inputs
        gameState.initialGold = parseFloat(totalAmountInput.value) || 1000;
        gameState.minBuy = parseFloat(minBuyInput.value) || 20;
        gameState.maxBuy = parseFloat(maxBuyInput.value) || 100;
        gameState.numGames = parseInt(numGamesInput.value) || 5;
        gameState.currentGold = gameState.initialGold;
        gameState.currentRoom = 1;
        gameState.gameResults = [];
        gameState.bestSlot = { name: 'None', profit: 0 };
        gameState.worstSlot = { name: 'None', loss: 0 };
        
        // Get selected providers
        gameState.selectedProviders = [];
        document.querySelectorAll('#provider-checkboxes input:checked').forEach(checkbox => {
            gameState.selectedProviders.push(checkbox.value);
        });
        
        // Validate inputs
        if (gameState.selectedProviders.length === 0) {
            alert('Please select at least one game provider');
            return;
        }
        
        if (gameState.minBuy > gameState.maxBuy) {
            alert('Minimum buy amount cannot be greater than maximum buy amount');
            return;
        }
        
        if (gameState.minBuy <= 0 || gameState.maxBuy <= 0) {
            alert('Buy amounts must be greater than zero');
            return;
        }
        
        // Filter slots by selected providers
        gameState.slots = allSlots.filter(slot => 
            gameState.selectedProviders.includes(slot.provider)
        );
        
        if (gameState.slots.length === 0) {
            alert('No slots found for the selected providers');
            return;
        }
        
        // Fade out title screen with animation
        titleScreen.style.animation = 'fadeOut 0.5s forwards';
        
        // Play game start sound
        sounds.gameStart.play();
        
        setTimeout(() => {
            // Update UI
            currentRoomElement.textContent = gameState.currentRoom;
            totalRoomsElement.textContent = gameState.numGames;
            currentGoldElement.textContent = gameState.currentGold.toFixed(2);
            healthAmount.textContent = gameState.currentGold.toFixed(2);
            
            // Set buy amount input range
            buyAmountInput.min = gameState.minBuy;
            buyAmountInput.max = gameState.maxBuy;
            buyAmountInput.value = gameState.minBuy;
            
            // Reset result group
            resultGroup.style.display = 'none';
            
            // Select a random slot
            selectRandomSlot();
            
            // Show game screen
            titleScreen.classList.remove('active');
            titleScreen.style.animation = '';
            gameScreen.classList.add('active');
            
            // Add entrance animation for game screen
            gameScreen.style.animation = 'fadeIn 0.5s ease-in-out';
            
            // Update health bar
            updateHealthBar();
            
            // Add dramatic room entrance effect
            const roomNumberEffect = document.createElement('div');
            roomNumberEffect.className = 'room-number-effect';
            roomNumberEffect.innerHTML = `<span>Room ${gameState.currentRoom}</span>`;
            gameScreen.appendChild(roomNumberEffect);
            
            setTimeout(() => {
                roomNumberEffect.remove();
            }, 2000);
        }, 500);
    });
    
    // Add CSS for room number effect
    const style = document.createElement('style');
    style.textContent = `
        .room-number-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10;
            animation: roomEffect 2s forwards;
        }
        
        .room-number-effect span {
            font-size: 4rem;
            color: #ff9f1c;
            font-weight: bold;
            text-shadow: 0 0 20px rgba(255, 159, 28, 0.8);
            animation: roomTextEffect 1.5s forwards;
        }
        
        @keyframes roomEffect {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        @keyframes roomTextEffect {
            0% { transform: scale(0.5); opacity: 0; }
            20% { transform: scale(1.2); opacity: 1; }
            70% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Select a random slot
    function selectRandomSlot() {
        const randomIndex = Math.floor(Math.random() * gameState.slots.length);
        gameState.currentSlot = gameState.slots[randomIndex];
        
        // Play slot select sound
        sounds.slotSelect.play();
        
        // Add card flip animation
        slotImageElement.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            // Update UI
            slotNameElement.textContent = gameState.currentSlot.game_name;
            slotImageElement.src = gameState.currentSlot.game_image_url;
            slotProviderElement.textContent = gameState.currentSlot.provider;
            
            // Complete flip animation
            slotImageElement.style.transform = 'rotateY(0deg)';
            
            // Add shaking effect to the slot image (like it's ready to battle)
            slotImageElement.classList.add('shake-animation');
            setTimeout(() => {
                slotImageElement.classList.remove('shake-animation');
            }, 1000);
        }, 250);  // Half of the flip animation time
        
        // Add CSS for the slot animations
        if (!document.querySelector('.slot-animations')) {
            const slotAnimStyle = document.createElement('style');
            slotAnimStyle.className = 'slot-animations';
            slotAnimStyle.textContent = `
                #slot-image {
                    transition: transform 0.5s ease-in-out;
                    transform-style: preserve-3d;
                }
                
                .shake-animation {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `;
            document.head.appendChild(slotAnimStyle);
        }
    }

    // Play Slot
    playSlotBtn.addEventListener('click', function() {
        sounds.buttonClick.play();
        
        const buyAmount = parseFloat(buyAmountInput.value);
        
        // Validate buy amount
        if (isNaN(buyAmount) || buyAmount < gameState.minBuy || buyAmount > gameState.maxBuy) {
            alert(`Please enter a buy amount between $${gameState.minBuy} and $${gameState.maxBuy}`);
            return;
        }
        
        if (buyAmount > gameState.currentGold) {
            alert("You don't have enough gold for this buy amount!");
            return;
        }
        
        // Add coin spend animation
        createCoinAnimation(buyAmount);
        
        // Deduct buy amount from gold
        gameState.currentGold -= buyAmount;
        currentGoldElement.textContent = gameState.currentGold.toFixed(2);
        healthAmount.textContent = gameState.currentGold.toFixed(2);
        
        // Show result input with animation
        resultGroup.style.opacity = '0';
        resultGroup.style.display = 'block';
        setTimeout(() => {
            resultGroup.style.opacity = '1';
            resultGroup.style.transition = 'opacity 0.5s ease-in-out';
        }, 50);
        
        // Disable play and reroll buttons
        playSlotBtn.disabled = true;
        rerollBtn.disabled = true;
        
        // Update health bar
        updateHealthBar();
        
        // Make the slot image appear "active"
        slotImageElement.classList.add('active-slot');
    });
    
    // Create coin animation when spending
    function createCoinAnimation(amount) {
        // Create 5-10 coins depending on amount
        const numCoins = Math.min(Math.max(Math.floor(amount / 20), 3), 10);
        const coinContainer = document.createElement('div');
        coinContainer.className = 'coin-animation-container';
        document.body.appendChild(coinContainer);
        
        for (let i = 0; i < numCoins; i++) {
            const coin = document.createElement('div');
            coin.className = 'animated-coin';
            
            // Random position and timing
            const delay = Math.random() * 0.5;
            const duration = 0.5 + Math.random() * 0.5;
            const startX = buyAmountInput.getBoundingClientRect().left + 
                           (buyAmountInput.offsetWidth / 2) + 
                           (Math.random() * 40 - 20);
            const startY = buyAmountInput.getBoundingClientRect().top;
            const endX = slotImageElement.getBoundingClientRect().left + 
                         (slotImageElement.offsetWidth / 2) + 
                         (Math.random() * 60 - 30);
            const endY = slotImageElement.getBoundingClientRect().top + 
                         (slotImageElement.offsetHeight / 2) + 
                         (Math.random() * 60 - 30);
            
            coin.style.cssText = `
                left: ${startX}px;
                top: ${startY}px;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;
            
            coin.style.setProperty('--end-x', `${endX}px`);
            coin.style.setProperty('--end-y', `${endY}px`);
            
            coinContainer.appendChild(coin);
            
            // Remove after animation completes
            setTimeout(() => {
                coin.remove();
                if (coinContainer.children.length === 0) {
                    coinContainer.remove();
                }
            }, (delay + duration) * 1000 + 100);
        }
        
        // Add CSS for coin animations
        if (!document.querySelector('.coin-animations')) {
            const coinAnimStyle = document.createElement('style');
            coinAnimStyle.className = 'coin-animations';
            coinAnimStyle.textContent = `
                .coin-animation-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                }
                
                .animated-coin {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background-image: url('images/gold-coin.png');
                    background-size: contain;
                    z-index: 1000;
                    animation: coinFly 1s forwards;
                }
                
                @keyframes coinFly {
                    0% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(0.2) rotate(360deg);
                        opacity: 0;
                        left: var(--end-x);
                        top: var(--end-y);
                    }
                }
                
                .active-slot {
                    animation: activeGlow 1.5s infinite alternate;
                }
                
                @keyframes activeGlow {
                    from { box-shadow: 0 0 10px rgba(255, 159, 28, 0.5); }
                    to { box-shadow: 0 0 20px rgba(255, 159, 28, 0.8), 0 0 30px rgba(255, 159, 28, 0.6); }
                }
            `;
            document.head.appendChild(coinAnimStyle);
        }
    }

    // Reroll Slot
    rerollBtn.addEventListener('click', function() {
        sounds.buttonClick.play();
        
        // Add reroll animation
        slotImageElement.classList.add('reroll-animation');
        
        // Add CSS for reroll animation if not already added
        if (!document.querySelector('.reroll-animations')) {
            const rerollAnimStyle = document.createElement('style');
            rerollAnimStyle.className = 'reroll-animations';
            rerollAnimStyle.textContent = `
                .reroll-animation {
                    animation: rerollSpin 0.7s ease-in-out;
                }
                
                @keyframes rerollSpin {
                    0% { transform: scale(1) rotate(0deg); filter: blur(0); }
                    50% { transform: scale(0.8) rotate(180deg); filter: blur(5px); }
                    100% { transform: scale(1) rotate(360deg); filter: blur(0); }
                }
            `;
            document.head.appendChild(rerollAnimStyle);
        }
        
        setTimeout(() => {
            slotImageElement.classList.remove('reroll-animation');
            selectRandomSlot();
        }, 700);
    });

    // Submit Result
    submitResultBtn.addEventListener('click', function() {
        sounds.buttonClick.play();
        
        const buyAmount = parseFloat(buyAmountInput.value);
        const resultAmount = parseFloat(resultAmountInput.value);
        
        if (isNaN(resultAmount) || resultAmount < 0) {
            alert('Please enter a valid result amount');
            return;
        }
        
        // Calculate profit/loss
        const profitLoss = resultAmount - buyAmount;
        
        // Remove active glow from slot
        slotImageElement.classList.remove('active-slot');
        
        // Create result animation
        if (profitLoss >= 0) {
            sounds.win.play();
            createWinAnimation(resultAmount, profitLoss);
        } else {
            sounds.loss.play();
            createLossAnimation(resultAmount, profitLoss);
        }
        
        // Add result to gold
        gameState.currentGold += resultAmount;
        currentGoldElement.textContent = gameState.currentGold.toFixed(2);
        healthAmount.textContent = gameState.currentGold.toFixed(2);
        
        // Record result
        const result = {
            roomNumber: gameState.currentRoom,
            slotName: gameState.currentSlot.game_name,
            provider: gameState.currentSlot.provider,
            buyAmount: buyAmount,
            resultAmount: resultAmount,
            profitLoss: profitLoss
        };
        
        gameState.gameResults.push(result);
        
        // Update best/worst slots
        if (profitLoss > gameState.bestSlot.profit) {
            gameState.bestSlot = {
                name: gameState.currentSlot.game_name,
                profit: profitLoss
            };
        }
        
        if (profitLoss < gameState.worstSlot.loss) {
            gameState.worstSlot = {
                name: gameState.currentSlot.game_name,
                loss: profitLoss
            };
        }
        
        // Reset result input with fade out animation
        resultGroup.style.transition = 'opacity 0.5s ease-in-out';
        resultGroup.style.opacity = '0';
        
        setTimeout(() => {
            resultGroup.style.display = 'none';
            resultAmountInput.value = 0;
            resultGroup.style.opacity = '1';
        }, 500);
        
        // Enable buttons
        playSlotBtn.disabled = false;
        rerollBtn.disabled = false;
        
        // Update health bar with animation
        if (profitLoss >= 0) {
            healthFill.classList.remove('loss');
            healthFill.classList.add('profit');
        } else {
            healthFill.classList.remove('profit');
            healthFill.classList.add('loss');
        }
        
        updateHealthBar();
        
        // Check if all rooms completed
        if (gameState.currentRoom >= gameState.numGames) {
            setTimeout(showResultsScreen, 2000); // Increased delay to allow for animations
        } else {
            // Create a next room transition effect
            setTimeout(() => {
                // Move to next room with dramatic transition
                const roomTransition = document.createElement('div');
                roomTransition.className = 'room-transition';
                gameScreen.appendChild(roomTransition);
                
                setTimeout(() => {
                    // Update room number
                    gameState.currentRoom++;
                    currentRoomElement.textContent = gameState.currentRoom;
                    
                    // Show next room number
                    const nextRoomEffect = document.createElement('div');
                    nextRoomEffect.className = 'room-number-effect';
                    nextRoomEffect.innerHTML = `<span>Room ${gameState.currentRoom}</span>`;
                    gameScreen.appendChild(nextRoomEffect);
                    
                    // Select a new random slot
                    selectRandomSlot();
                    
                    setTimeout(() => {
                        roomTransition.remove();
                        nextRoomEffect.remove();
                    }, 2000);
                }, 500);
            }, 1500);
        }
    });
    
    // Win animation function
    function createWinAnimation(amount, profit) {
        // Create a victory flash effect
        const flash = document.createElement('div');
        flash.className = 'victory-flash';
        document.body.appendChild(flash);
        
        // Create floating text showing the win amount
        const floatingProfit = document.createElement('div');
        floatingProfit.className = 'floating-profit';
        floatingProfit.textContent = `+$${profit.toFixed(2)}`;
        document.body.appendChild(floatingProfit);
        
        // Position the floating text near the slot
        const slotRect = slotImageElement.getBoundingClientRect();
        floatingProfit.style.left = `${slotRect.left + slotRect.width / 2}px`;
        floatingProfit.style.top = `${slotRect.top - 20}px`;
        
        // Create gold coins animation for wins
        if (profit > 0) {
            const numCoins = Math.min(Math.max(Math.floor(profit / 10), 5), 30);
            
            for (let i = 0; i < numCoins; i++) {
                setTimeout(() => {
                    const coin = document.createElement('div');
                    coin.className = 'win-coin';
                    
                    // Random position around the slot
                    const startX = slotRect.left + slotRect.width / 2 + (Math.random() * 40 - 20);
                    const startY = slotRect.top + slotRect.height / 2 + (Math.random() * 40 - 20);
                    
                    // Random end position (always moving upward)
                    const angle = Math.random() * Math.PI; // Semi-circle upward
                    const distance = 50 + Math.random() * 100;
                    const endX = startX + Math.cos(angle) * distance;
                    const endY = startY - Math.abs(Math.sin(angle) * distance);
                    
                    coin.style.cssText = `
                        left: ${startX}px;
                        top: ${startY}px;
                        --end-x: ${endX}px;
                        --end-y: ${endY}px;
                        animation-duration: ${0.5 + Math.random() * 0.5}s;
                    `;
                    
                    document.body.appendChild(coin);
                    
                    // Remove after animation
                    setTimeout(() => {
                        coin.remove();
                    }, 1000);
                }, i * 50); // Stagger the coins
            }
        }
        
        // Add CSS for win animations
        if (!document.querySelector('.win-animations')) {
            const winAnimStyle = document.createElement('style');
            winAnimStyle.className = 'win-animations';
            winAnimStyle.textContent = `
                .victory-flash {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 215, 0, 0.3);
                    z-index: 9000;
                    pointer-events: none;
                    animation: flash 0.5s ease-out forwards;
                }
                
                @keyframes flash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                .floating-profit {
                    position: fixed;
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2ecc71;
                    text-shadow: 0 0 5px #000;
                    pointer-events: none;
                    z-index: 9001;
                    transform: translateX(-50%);
                    animation: float-up 2s ease-out forwards;
                }
                
                @keyframes float-up {
                    0% { opacity: 0; transform: translateX(-50%) translateY(0); }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
                }
                
                .win-coin {
                    position: fixed;
                    width: 25px;
                    height: 25px;
                    background-image: url('images/gold-coin.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    pointer-events: none;
                    z-index: 9001;
                    animation: coin-scatter 1s ease-out forwards;
                }
                
                @keyframes coin-scatter {
                    0% { 
                        transform: scale(0.2) rotate(0deg); 
                        opacity: 0;
                    }
                    10% {
                        transform: scale(1) rotate(45deg);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(0.5) rotate(360deg); 
                        opacity: 0;
                        left: var(--end-x);
                        top: var(--end-y);
                    }
                }
                
                .room-transition {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #000;
                    z-index: 9500;
                    animation: fade-in-out 3s forwards;
                }
                
                @keyframes fade-in-out {
                    0% { opacity: 0; }
                    40% { opacity: 0.8; }
                    60% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(winAnimStyle);
        }
        
        // Remove animations after they complete
        setTimeout(() => {
            flash.remove();
            floatingProfit.remove();
        }, 2000);
    }
    
    // Loss animation function
    function createLossAnimation(amount, loss) {
        // Create a defeat flash effect (red tint)
        const flash = document.createElement('div');
        flash.className = 'defeat-flash';
        document.body.appendChild(flash);
        
        // Create floating text showing the loss amount
        const floatingLoss = document.createElement('div');
        floatingLoss.className = 'floating-loss';
        floatingLoss.textContent = `-$${Math.abs(loss).toFixed(2)}`;
        document.body.appendChild(floatingLoss);
        
        // Position the floating text near the slot
        const slotRect = slotImageElement.getBoundingClientRect();
        floatingLoss.style.left = `${slotRect.left + slotRect.width / 2}px`;
        floatingLoss.style.top = `${slotRect.top - 20}px`;
        
        // Add CSS for loss animations
        if (!document.querySelector('.loss-animations')) {
            const lossAnimStyle = document.createElement('style');
            lossAnimStyle.className = 'loss-animations';
            lossAnimStyle.textContent = `
                .defeat-flash {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(231, 76, 60, 0.3);
                    z-index: 9000;
                    pointer-events: none;
                    animation: flash 0.5s ease-out forwards;
                }
                
                .floating-loss {
                    position: fixed;
                    font-size: 2rem;
                    font-weight: bold;
                    color: #e74c3c;
                    text-shadow: 0 0 5px #000;
                    pointer-events: none;
                    z-index: 9001;
                    transform: translateX(-50%);
                    animation: float-down 2s ease-out forwards;
                }
                
                @keyframes float-down {
                    0% { opacity: 0; transform: translateX(-50%) translateY(0); }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; transform: translateX(-50%) translateY(50px); }
                }
            `;
            document.head.appendChild(lossAnimStyle);
        }
        
        // Make the slot image shake to signify loss
        slotImageElement.classList.add('defeat-shake');
        
        if (!document.querySelector('.defeat-shake-animation')) {
            const defeatShakeStyle = document.createElement('style');
            defeatShakeStyle.className = 'defeat-shake-animation';
            defeatShakeStyle.textContent = `
                .defeat-shake {
                    animation: defeat-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                
                @keyframes defeat-shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-10px); }
                    40%, 80% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(defeatShakeStyle);
        }
        
        // Remove animations after they complete
        setTimeout(() => {
            flash.remove();
            floatingLoss.remove();
            slotImageElement.classList.remove('defeat-shake');
        }, 2000);
    }

    // Update Health Bar
    function updateHealthBar() {
        const percentHealth = (gameState.currentGold / gameState.initialGold) * 100;
        healthFill.style.width = `${Math.min(Math.max(percentHealth, 0), 100)}%`;
        
        // Change color based on profit/loss
        if (gameState.currentGold < gameState.initialGold) {
            healthFill.classList.remove('profit');
            healthFill.classList.add('loss');
        } else if (gameState.currentGold > gameState.initialGold) {
            healthFill.classList.remove('loss');
            healthFill.classList.add('profit');
        } else {
            healthFill.classList.remove('loss', 'profit');
        }
    }

    // Show Results Screen
    function showResultsScreen() {
        // Play game complete sound
        sounds.gameComplete.play();
        
        // Fade out game screen with animation
        gameScreen.style.animation = 'fadeOut 1s forwards';
        
        setTimeout(() => {
            // Update results screen
            finalBalanceElement.textContent = gameState.currentGold.toFixed(2);
            
            const totalProfitLoss = gameState.currentGold - gameState.initialGold;
            totalProfitLossElement.textContent = totalProfitLoss.toFixed(2);
            
            if (totalProfitLoss >= 0) {
                totalProfitLossElement.classList.add('win');
                totalProfitLossElement.classList.remove('loss');
            } else {
                totalProfitLossElement.classList.add('loss');
                totalProfitLossElement.classList.remove('win');
            }
            
            // Populate battles list with staggered animation
            battlesList.innerHTML = '';
            
            gameState.gameResults.forEach((result, index) => {
                const listItem = document.createElement('li');
                listItem.style.opacity = '0';
                listItem.style.transform = 'translateY(20px)';
                listItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                
                const slotInfo = document.createElement('div');
                slotInfo.textContent = `${result.slotName} (${result.provider})`;
                slotInfo.style.fontWeight = 'bold';
                
                const buyInfo = document.createElement('div');
                buyInfo.textContent = `Buy: $${result.buyAmount.toFixed(2)}`;
                
                const resultInfo = document.createElement('div');
                resultInfo.textContent = `Result: $${result.resultAmount.toFixed(2)}`;
                
                const profitLossInfo = document.createElement('div');
                const profitLossText = result.profitLoss >= 0 
                    ? `Profit: $${result.profitLoss.toFixed(2)}`
                    : `Loss: $${Math.abs(result.profitLoss).toFixed(2)}`;
                
                profitLossInfo.textContent = profitLossText;
                profitLossInfo.className = result.profitLoss >= 0 ? 'win' : 'loss';
                
                listItem.appendChild(slotInfo);
                listItem.appendChild(buyInfo);
                listItem.appendChild(resultInfo);
                listItem.appendChild(profitLossInfo);
                
                battlesList.appendChild(listItem);
                
                // Animate each item with a staggered delay
                setTimeout(() => {
                    listItem.style.opacity = '1';
                    listItem.style.transform = 'translateY(0)';
                }, 100 + (index * 150));
            });
            
            // Update best/worst slots with animations
            if (gameState.bestSlot.name !== 'None') {
                bestSlotElement.textContent = gameState.bestSlot.name;
                bestProfitElement.textContent = gameState.bestSlot.profit.toFixed(2);
                
                // Add trophy icon and glow effect to best slot
                const bestResult = document.querySelector('.top-result:first-child');
                bestResult.classList.add('best-result');
                
                // Add CSS for best result
                if (!document.querySelector('.best-result-style')) {
                    const bestResultStyle = document.createElement('style');
                    bestResultStyle.className = 'best-result-style';
                    bestResultStyle.textContent = `
                        .best-result {
                            position: relative;
                            animation: bestPulse 2s infinite alternate;
                        }
                        
                        .best-result::before {
                            content: '🏆';
                            position: absolute;
                            left: -30px;
                            top: 50%;
                            transform: translateY(-50%);
                            font-size: 1.5rem;
                            animation: trophyBounce 1s infinite alternate;
                        }
                        
                        @keyframes bestPulse {
                            from { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                            to { box-shadow: 0 0 15px rgba(255, 215, 0, 0.8); }
                        }
                        
                        @keyframes trophyBounce {
                            from { transform: translateY(-50%) scale(1); }
                            to { transform: translateY(-50%) scale(1.2); }
                        }
                    `;
                    document.head.appendChild(bestResultStyle);
                }
            }
            
            if (gameState.worstSlot.name !== 'None') {
                worstSlotElement.textContent = gameState.worstSlot.name;
                worstLossElement.textContent = Math.abs(gameState.worstSlot.loss).toFixed(2);
                
                // Add skull icon to worst slot
                const worstResult = document.querySelector('.top-result:last-child');
                worstResult.classList.add('worst-result');
                
                // Add CSS for worst result
                if (!document.querySelector('.worst-result-style')) {
                    const worstResultStyle = document.createElement('style');
                    worstResultStyle.className = 'worst-result-style';
                    worstResultStyle.textContent = `
                        .worst-result {
                            position: relative;
                        }
                        
                        .worst-result::before {
                            content: '☠️';
                            position: absolute;
                            left: -30px;
                            top: 50%;
                            transform: translateY(-50%);
                            font-size: 1.5rem;
                        }
                    `;
                    document.head.appendChild(worstResultStyle);
                }
            }
            
            // Create confetti for profit, or stormy clouds for loss
            if (totalProfitLoss >= 0) {
                createResultsConfetti();
            } else {
                createStormyBackground();
            }
            
            // Show results screen with entrance animation
            gameScreen.classList.remove('active');
            gameScreen.style.animation = '';
            resultsScreen.classList.add('active');
            resultsScreen.style.animation = 'fadeInScale 1s ease-out';
            
            // Add animation for results screen entrance
            if (!document.querySelector('.results-entrance-style')) {
                const resultsEntranceStyle = document.createElement('style');
                resultsEntranceStyle.className = 'results-entrance-style';
                resultsEntranceStyle.textContent = `
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `;
                document.head.appendChild(resultsEntranceStyle);
            }
        }, 1000); // Wait for the fade out
    }
    
    // Function to create confetti for positive results
    function createResultsConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        resultsScreen.appendChild(confettiContainer);
        
        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const size = Math.random() * 10 + 5; // 5-15px
            const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 3 + 2; // 2-5s
            const animationDelay = Math.random() * 5; // 0-5s
            
            confetti.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                left: ${left}%;
                animation-duration: ${animationDuration}s;
                animation-delay: ${animationDelay}s;
            `;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Add CSS for confetti
        if (!document.querySelector('.confetti-style')) {
            const confettiStyle = document.createElement('style');
            confettiStyle.className = 'confetti-style';
            confettiStyle.textContent = `
                .confetti-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: -1;
                }
                
                .confetti {
                    position: absolute;
                    top: -20px;
                    width: 10px;
                    height: 10px;
                    background-color: #f00;
                    border-radius: 2px;
                    animation: confettiFall linear forwards;
                }
                
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(confettiStyle);
        }
    }
    
    // Function to create stormy background for negative results
    function createStormyBackground() {
        const stormContainer = document.createElement('div');
        stormContainer.className = 'storm-container';
        resultsScreen.appendChild(stormContainer);
        
        // Create cloud particles
        for (let i = 0; i < 20; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'storm-cloud';
            
            // Random properties
            const size = Math.random() * 50 + 30; // 30-80px
            const top = Math.random() * 50; // 0-50%
            const left = Math.random() * 100; // 0-100%
            const opacity = Math.random() * 0.5 + 0.2; // 0.2-0.7
            const animationDuration = Math.random() * 10 + 20; // 20-30s
            
            cloud.style.cssText = `
                width: ${size}px;
                height: ${size * 0.6}px;
                top: ${top}%;
                left: ${left}%;
                opacity: ${opacity};
                animation-duration: ${animationDuration}s;
            `;
            
            stormContainer.appendChild(cloud);
        }
        
        // Add lightning flash occasionally
        const flashInterval = setInterval(() => {
            const lightning = document.createElement('div');
            lightning.className = 'lightning-flash';
            stormContainer.appendChild(lightning);
            
            setTimeout(() => {
                lightning.remove();
            }, 200);
        }, 3000);
        
        // Clear interval when leaving the screen
        document.getElementById('restart-btn').addEventListener('click', () => {
            clearInterval(flashInterval);
        }, { once: true });
        
        // Add CSS for storm effects
        if (!document.querySelector('.storm-style')) {
            const stormStyle = document.createElement('style');
            stormStyle.className = 'storm-style';
            stormStyle.textContent = `
                .storm-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                    z-index: -1;
                    background-color: rgba(0, 0, 30, 0.2);
                }
                
                .storm-cloud {
                    position: absolute;
                    background-color: #333;
                    border-radius: 50%;
                    filter: blur(10px);
                    animation: cloudDrift linear infinite;
                }
                
                .lightning-flash {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.3);
                    z-index: 1;
                    animation: lightningFlash 0.2s ease-out;
                }
                
                @keyframes cloudDrift {
                    from { transform: translateX(100%); }
                    to { transform: translateX(-100%); }
                }
                
                @keyframes lightningFlash {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(stormStyle);
        }
    }

    // Restart Game
    restartBtn.addEventListener('click', function() {
        // Play button click sound
        sounds.buttonClick.play();
        
        // Add exit animation to results screen
        resultsScreen.style.animation = 'fadeOut 0.5s forwards';
        
        // Wait for animation to complete
        setTimeout(() => {
            // Remove any background effects
            document.querySelectorAll('.confetti-container, .storm-container').forEach(el => el.remove());
            
            resultsScreen.classList.remove('active');
            resultsScreen.style.animation = '';
            titleScreen.classList.add('active');
            
            // Add entrance animation to title screen
            titleScreen.style.animation = 'fadeIn 0.5s ease-in-out';
            
            // Reset form values to last used values
            totalAmountInput.value = gameState.initialGold;
            minBuyInput.value = gameState.minBuy;
            maxBuyInput.value = gameState.maxBuy;
            numGamesInput.value = gameState.numGames;
            
            // Add a special effect for returning to the title screen
            const titleEffect = document.createElement('div');
            titleEffect.className = 'title-effect';
            titleScreen.appendChild(titleEffect);
            
            // Add CSS for title screen re-entry effect
            if (!document.querySelector('.title-effect-style')) {
                const titleEffectStyle = document.createElement('style');
                titleEffectStyle.className = 'title-effect-style';
                titleEffectStyle.textContent = `
                    .title-effect {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle, rgba(255,159,28,0.2) 0%, rgba(255,159,28,0) 70%);
                        pointer-events: none;
                        animation: titlePulse 2s ease-out forwards;
                    }
                    
                    @keyframes titlePulse {
                        0% { transform: scale(0.5); opacity: 1; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                `;
                document.head.appendChild(titleEffectStyle);
            }
            
            // Remove the effect after animation completes
            setTimeout(() => {
                titleEffect.remove();
            }, 2000);
        }, 500);
    });
});