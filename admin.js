document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const providerList = document.getElementById('provider-list');
    const newProviderInput = document.getElementById('new-provider-name');
    const addProviderBtn = document.getElementById('add-provider-btn');
    const slotGrid = document.getElementById('slot-grid');
    const slotSearch = document.getElementById('slot-search');
    const providerFilter = document.getElementById('provider-filter');
    const createSlotBtn = document.getElementById('create-slot-btn');
    const slotForm = document.getElementById('slot-form');
    const slotFormTitle = document.getElementById('slot-form-title');
    const slotNameInput = document.getElementById('slot-name-input');
    const slotProviderInput = document.getElementById('slot-provider-input');
    const slotImageUrlInput = document.getElementById('slot-image-url-input');
    const featureSpinsInput = document.getElementById('feature-spins-input');
    const featureSpinsMultiplierInput = document.getElementById('feature-spins-multiplier-input');
    const featureSpinsOptions = document.getElementById('feature-spins-options');
    const newFeatureSpinName = document.getElementById('new-feature-spin-name');
    const newFeatureSpinMultiplier = document.getElementById('new-feature-spin-multiplier');
    const newFeatureSpinDescription = document.getElementById('new-feature-spin-description');
    const addFeatureSpinBtn = document.getElementById('add-feature-spin-btn');
    const featureSpinPills = document.getElementById('feature-spin-pills');
    const betSourceInfo = document.getElementById('bet-source-info');
    const newBetLevelInput = document.getElementById('new-bet-level');
    const addBetLevelBtn = document.getElementById('add-bet-level-btn');
    const betLevelPills = document.getElementById('bet-level-pills');
    const newBonusName = document.getElementById('new-bonus-name');
    const newBonusMultiplier = document.getElementById('new-bonus-multiplier');
    const newBonusDescription = document.getElementById('new-bonus-description');
    const addBonusBtn = document.getElementById('add-bonus-btn');
    const bonusPills = document.getElementById('bonus-pills');
    const saveSlotBtn = document.getElementById('save-slot-btn');
    const cancelSlotBtn = document.getElementById('cancel-slot-btn');
    const statusMessage = document.getElementById('status-message');

    // App State
    let appData = {
        slots: [],
        providers: [],
        providerDefaultBetLevels: {},
        providerDefaultFeatureSpins: {},
        providerDefaultFeatureSpinsMultiplier: {},
        selectedProviderId: null,
        selectedSlotId: null,
        isCreatingNewSlot: false
    };

    // Initialize the app
    init();

    function init() {
        // Set up event listeners
        setupEventListeners();

        // Load data from stake.json
        loadSlotsData();
    }

    function setupEventListeners() {
        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // Provider management
        addProviderBtn.addEventListener('click', addNewProvider);
        
        // Slot management
        slotSearch.addEventListener('input', filterSlots);
        providerFilter.addEventListener('change', filterSlots);
        createSlotBtn.addEventListener('click', createNewSlot);
        addBetLevelBtn.addEventListener('click', addBetLevel);
        addBonusBtn.addEventListener('click', addBonus);
        addFeatureSpinBtn.addEventListener('click', addFeatureSpin);
        saveSlotBtn.addEventListener('click', saveSlot);
        cancelSlotBtn.addEventListener('click', cancelSlotEdit);
        slotProviderInput.addEventListener('change', function() {
            updateBetLevelSourceInfo();
            updateFeatureSpinsFromProvider(slotProviderInput.value);
            updateFeatureSpinsVisibility();
        });
        featureSpinsInput.addEventListener('change', updateFeatureSpinsVisibility);
    }

    function switchTab(tabId) {
        // Update button active state
        tabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Show the selected tab content
        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    function loadSlotsData() {
        fetch('stake.json')
            .then(response => response.json())
            .then(data => {
                // Store slots from the JSON
                appData.slots = data[0].slot_games.map((slot, index) => {
                    // Add id and default properties if they don't exist
                    return {
                        id: index,
                        ...slot,
                        bet_levels: slot.bet_levels || [],
                        feature_spins: slot.feature_spins !== undefined ? slot.feature_spins : false,
                        feature_spins_multiplier: slot.feature_spins_multiplier || 1,
                        additional_feature_spins: slot.additional_feature_spins || [],
                        bonuses: slot.bonuses || []
                    };
                });

                // Extract unique providers
                const uniqueProviders = new Set();
                appData.slots.forEach(slot => {
                    uniqueProviders.add(slot.provider);
                });

                // Create provider objects
                appData.providers = Array.from(uniqueProviders).map((providerName, index) => {
                    return {
                        id: index,
                        name: providerName,
                        bet_levels: [],  // Default empty bet levels
                        feature_spins: false
                    };
                });

                // Initialize provider default bet levels with some reasonable defaults
                appData.providers.forEach(provider => {
                    // Set up some default bet levels based on provider
                    if (provider.name === 'Pragmatic Play') {
                        appData.providerDefaultBetLevels[provider.name] = [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 4.00, 6.00, 8.00, 10.00, 20.00];
                        appData.providerDefaultFeatureSpins[provider.name] = true;
                        appData.providerDefaultFeatureSpinsMultiplier[provider.name] = 100;
                    } else if (provider.name === 'Hacksaw Gaming') {
                        appData.providerDefaultBetLevels[provider.name] = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
                        appData.providerDefaultFeatureSpins[provider.name] = true;
                        appData.providerDefaultFeatureSpinsMultiplier[provider.name] = 80;
                    } else if (provider.name === 'Nolimit City') {
                        appData.providerDefaultBetLevels[provider.name] = [0.20, 0.40, 0.60, 1.00, 1.50, 2.00, 3.00, 5.00, 10.00, 20.00];
                        appData.providerDefaultFeatureSpins[provider.name] = true;
                        appData.providerDefaultFeatureSpinsMultiplier[provider.name] = 120;
                    } else {
                        // Generic defaults for other providers
                        appData.providerDefaultBetLevels[provider.name] = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00];
                        appData.providerDefaultFeatureSpins[provider.name] = false;
                        appData.providerDefaultFeatureSpinsMultiplier[provider.name] = 1;
                    }
                });

                // Render UI components
                renderProviderList();
                renderSlotGrid();
                populateProviderSelects();
            })
            .catch(error => {
                console.error('Error loading slots data:', error);
                showStatusMessage('Failed to load slots data. Please refresh the page.', true);
            });
    }

    function renderProviderList() {
        providerList.innerHTML = '';

        appData.providers.forEach(provider => {
            const providerCard = document.createElement('div');
            providerCard.className = 'provider-card';
            providerCard.dataset.providerId = provider.id;
            
            if (appData.selectedProviderId === provider.id) {
                providerCard.classList.add('active');
            }

            const providerHeader = document.createElement('div');
            providerHeader.className = 'provider-header';
            providerHeader.innerHTML = `
                <div class="provider-name">${provider.name}</div>
                <div>Provider Settings</div>
            `;

            const providerDetails = document.createElement('div');
            providerDetails.className = 'provider-details';

            // Feature Spins setting
            const featureSpinsSettings = document.createElement('div');
            featureSpinsSettings.className = 'feature-spins-settings';
            
            // Get the default multiplier or set to 1 if not defined
            const defaultMultiplier = appData.providerDefaultFeatureSpinsMultiplier[provider.name] || 1;
            
            featureSpinsSettings.innerHTML = `
                <div class="form-row">
                    <div class="form-group checkbox-group">
                        <label for="provider-feature-spins-${provider.id}">Default Feature Spins:</label>
                        <select id="provider-feature-spins-${provider.id}" class="provider-feature-spins">
                            <option value="true" ${appData.providerDefaultFeatureSpins[provider.name] ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!appData.providerDefaultFeatureSpins[provider.name] ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                    <div class="form-group" id="provider-feature-spins-multiplier-container-${provider.id}" 
                         style="${appData.providerDefaultFeatureSpins[provider.name] ? '' : 'display: none;'}">
                        <label for="provider-feature-spins-multiplier-${provider.id}">Default Multiplier:</label>
                        <input type="number" id="provider-feature-spins-multiplier-${provider.id}" 
                               class="provider-feature-spins-multiplier" min="1" step="1" value="${defaultMultiplier}">
                    </div>
                </div>
            `;

            // Bet levels form
            const betLevelsForm = document.createElement('div');
            betLevelsForm.className = 'bet-levels-form';
            betLevelsForm.innerHTML = `
                <h4>Default Bet Levels</h4>
                <div class="form-row">
                    <div class="form-group">
                        <input type="number" class="bet-level-input" placeholder="Bet Amount" min="0.1" step="0.1">
                    </div>
                    <button class="action-btn add-btn add-provider-bet-btn" data-provider-id="${provider.id}">Add</button>
                </div>
            `;

            // Bet levels display
            const betLevelsDisplay = document.createElement('div');
            betLevelsDisplay.className = 'provider-bet-levels';
            
            const defaultBetLevels = appData.providerDefaultBetLevels[provider.name] || [];
            defaultBetLevels.forEach(level => {
                const betTag = document.createElement('div');
                betTag.className = 'bet-level-tag';
                betTag.textContent = `$${level.toFixed(2)}`;
                betTag.dataset.value = level;
                
                // Add delete capability
                betTag.innerHTML += `<button class="remove-bet-btn" data-provider="${provider.name}" data-value="${level}">×</button>`;
                
                betLevelsDisplay.appendChild(betTag);
            });

            providerDetails.appendChild(featureSpinsSettings);
            providerDetails.appendChild(betLevelsForm);
            providerDetails.appendChild(betLevelsDisplay);

            providerCard.appendChild(providerHeader);
            providerCard.appendChild(providerDetails);

            providerList.appendChild(providerCard);

            // Add event listeners
            providerCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-bet-btn') && 
                    !e.target.classList.contains('add-provider-bet-btn') &&
                    !e.target.classList.contains('bet-level-input') &&
                    !e.target.classList.contains('provider-feature-spins')) {
                    toggleProviderCard(provider.id);
                }
            });

            // Feature spins change event
            const featureSpinsSelect = providerCard.querySelector(`#provider-feature-spins-${provider.id}`);
            const featureSpinsMultiplierContainer = providerCard.querySelector(`#provider-feature-spins-multiplier-container-${provider.id}`);
            const featureSpinsMultiplierInput = providerCard.querySelector(`#provider-feature-spins-multiplier-${provider.id}`);
            
            featureSpinsSelect.addEventListener('change', (e) => {
                const hasFeatureSpins = e.target.value === 'true';
                appData.providerDefaultFeatureSpins[provider.name] = hasFeatureSpins;
                
                // Show/hide the multiplier input based on feature spins selection
                featureSpinsMultiplierContainer.style.display = hasFeatureSpins ? 'block' : 'none';
                
                showStatusMessage(`Updated ${provider.name} default feature spins: ${hasFeatureSpins ? 'Yes' : 'No'}`);
            });
            
            // Feature spins multiplier change event
            featureSpinsMultiplierInput.addEventListener('change', (e) => {
                const multiplier = parseInt(e.target.value) || 1;
                if (multiplier < 1) {
                    e.target.value = 1;
                    appData.providerDefaultFeatureSpinsMultiplier[provider.name] = 1;
                    showStatusMessage(`Multiplier must be at least 1`, true);
                } else {
                    appData.providerDefaultFeatureSpinsMultiplier[provider.name] = multiplier;
                    showStatusMessage(`Updated ${provider.name} default feature spins multiplier: ${multiplier}x`);
                }
            });

            // Add bet level button
            const addBetBtn = providerCard.querySelector('.add-provider-bet-btn');
            addBetBtn.addEventListener('click', () => {
                const betInput = providerCard.querySelector('.bet-level-input');
                const betValue = parseFloat(betInput.value);
                
                if (!isNaN(betValue) && betValue > 0) {
                    addProviderBetLevel(provider.name, betValue);
                    betInput.value = '';
                    renderProviderList(); // Re-render to update the UI
                } else {
                    showStatusMessage('Please enter a valid bet amount', true);
                }
            });

            // Remove bet level buttons
            const removeBtns = providerCard.querySelectorAll('.remove-bet-btn');
            removeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const providerName = btn.dataset.provider;
                    const betValue = parseFloat(btn.dataset.value);
                    removeProviderBetLevel(providerName, betValue);
                    renderProviderList(); // Re-render to update the UI
                });
            });
        });
    }

    function toggleProviderCard(providerId) {
        if (appData.selectedProviderId === providerId) {
            appData.selectedProviderId = null;
        } else {
            appData.selectedProviderId = providerId;
        }
        
        renderProviderList();
    }

    function addProviderBetLevel(providerName, betValue) {
        // Check if level already exists
        const currentLevels = appData.providerDefaultBetLevels[providerName] || [];
        if (currentLevels.includes(betValue)) {
            showStatusMessage('This bet level already exists', true);
            return;
        }
        
        // Add the new level and sort
        currentLevels.push(betValue);
        currentLevels.sort((a, b) => a - b);
        
        appData.providerDefaultBetLevels[providerName] = currentLevels;
        
        showStatusMessage(`Added $${betValue.toFixed(2)} to ${providerName} bet levels`);
    }

    function removeProviderBetLevel(providerName, betValue) {
        const currentLevels = appData.providerDefaultBetLevels[providerName] || [];
        const index = currentLevels.indexOf(betValue);
        
        if (index !== -1) {
            currentLevels.splice(index, 1);
            appData.providerDefaultBetLevels[providerName] = currentLevels;
            showStatusMessage(`Removed $${betValue.toFixed(2)} from ${providerName} bet levels`);
        }
    }

    function addNewProvider() {
        const providerName = newProviderInput.value.trim();
        
        if (!providerName) {
            showStatusMessage('Provider name cannot be empty', true);
            return;
        }
        
        // Check if provider already exists
        const existingProvider = appData.providers.find(p => p.name.toLowerCase() === providerName.toLowerCase());
        if (existingProvider) {
            showStatusMessage('This provider already exists', true);
            return;
        }
        
        // Create new provider
        const newProviderId = appData.providers.length;
        appData.providers.push({
            id: newProviderId,
            name: providerName,
            bet_levels: [],
            feature_spins: false
        });
        
        // Initialize with default bet levels and feature spin settings
        appData.providerDefaultBetLevels[providerName] = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00];
        appData.providerDefaultFeatureSpins[providerName] = false;
        appData.providerDefaultFeatureSpinsMultiplier[providerName] = 1;
        
        // Clear input and re-render
        newProviderInput.value = '';
        renderProviderList();
        populateProviderSelects();
        
        showStatusMessage(`Added new provider: ${providerName}`);
        
        // Select the new provider card
        appData.selectedProviderId = newProviderId;
        renderProviderList();
    }

    function renderSlotGrid() {
        slotGrid.innerHTML = '';
        
        const filteredSlots = getFilteredSlots();
        
        if (filteredSlots.length === 0) {
            slotGrid.innerHTML = '<div class="no-slots-message">No slots found. Try adjusting your filters or add a new slot.</div>';
            return;
        }
        
        filteredSlots.forEach(slot => {
            const slotCard = document.createElement('div');
            slotCard.className = 'slot-card';
            slotCard.dataset.slotId = slot.id;
            
            if (appData.selectedSlotId === slot.id) {
                slotCard.classList.add('active');
            }
            
            // Create fallback image URL
            const imageUrl = slot.game_image_url || 'images/gold-coin.png';
            
            let additionalInfo = '';
            
            // Show feature spin badge if the slot has feature spins
            if (slot.feature_spins) {
                const multiplier = slot.feature_spins_multiplier || 1;
                additionalInfo += `<div class="feature-spin-tag">Feature Spins: ${multiplier}x</div>`;
            }
            
            // Show bonus count if the slot has bonuses
            if (slot.bonuses && slot.bonuses.length > 0) {
                additionalInfo += `<div class="bonus-count">${slot.bonuses.length} Bonus${slot.bonuses.length > 1 ? 'es' : ''}</div>`;
            }
            
            slotCard.innerHTML = `
                <img src="${imageUrl}" alt="${slot.game_name}" class="slot-image">
                <div class="slot-name">${slot.game_name}</div>
                <div class="slot-provider">${slot.provider}</div>
                <div class="slot-tags">
                    ${additionalInfo}
                </div>
            `;
            
            slotCard.addEventListener('click', () => {
                selectSlot(slot.id);
            });
            
            slotGrid.appendChild(slotCard);
        });
    }

    function getFilteredSlots() {
        const searchTerm = slotSearch.value.toLowerCase();
        const selectedProvider = providerFilter.value;
        
        return appData.slots.filter(slot => {
            // Filter by search term
            const matchesSearch = slot.game_name.toLowerCase().includes(searchTerm) || 
                                slot.provider.toLowerCase().includes(searchTerm);
            
            // Filter by provider
            const matchesProvider = !selectedProvider || slot.provider === selectedProvider;
            
            return matchesSearch && matchesProvider;
        });
    }

    function filterSlots() {
        renderSlotGrid();
    }

    function populateProviderSelects() {
        // Clear previous options except the default "All Providers" option
        while (providerFilter.options.length > 1) {
            providerFilter.remove(1);
        }
        
        // Clear all options from the slot provider input
        slotProviderInput.innerHTML = '';
        
        // Add providers to both selects
        appData.providers.forEach(provider => {
            // Add to filter dropdown
            const filterOption = document.createElement('option');
            filterOption.value = provider.name;
            filterOption.textContent = provider.name;
            providerFilter.appendChild(filterOption);
            
            // Add to slot edit form dropdown
            const formOption = document.createElement('option');
            formOption.value = provider.name;
            formOption.textContent = provider.name;
            slotProviderInput.appendChild(formOption);
        });
    }

    function selectSlot(slotId) {
        appData.selectedSlotId = slotId;
        appData.isCreatingNewSlot = false;
        
        // Update UI
        renderSlotGrid();
        
        // Get the selected slot
        const slot = appData.slots.find(s => s.id === slotId);
        if (!slot) return;
        
        // Populate the form fields
        slotFormTitle.textContent = 'Edit Slot';
        slotNameInput.value = slot.game_name;
        slotProviderInput.value = slot.provider;
        slotImageUrlInput.value = slot.game_image_url || '';
        featureSpinsInput.value = slot.feature_spins ? 'true' : 'false';
        featureSpinsMultiplierInput.value = slot.feature_spins_multiplier || 1;
        
        // Update feature spins multiplier visibility
        updateFeatureSpinsVisibility();
        
        // Populate bet levels
        updateBetLevelPills(slot);
        
        // Populate feature spins
        updateFeatureSpinPills(slot);
        
        // Populate bonuses
        updateBonusPills(slot);
        
        // Show the form
        slotForm.style.display = 'block';
        
        // Scroll to the form
        slotForm.scrollIntoView({ behavior: 'smooth' });
    }

    function createNewSlot() {
        appData.isCreatingNewSlot = true;
        appData.selectedSlotId = null;
        
        // Update UI
        renderSlotGrid();
        
        // Reset form fields
        slotFormTitle.textContent = 'Create New Slot';
        slotNameInput.value = '';
        slotProviderInput.value = appData.providers.length > 0 ? appData.providers[0].name : '';
        slotImageUrlInput.value = '';
        featureSpinsInput.value = 'false';
        featureSpinsMultiplierInput.value = 1;
        
        // Get default values from provider
        if (slotProviderInput.value) {
            updateFeatureSpinsFromProvider(slotProviderInput.value);
        }
        
        // Update feature spins multiplier visibility
        updateFeatureSpinsVisibility();
        
        // Reset bet levels
        updateBetLevelPills();
        
        // Reset feature spins
        updateFeatureSpinPills();
        
        // Reset bonuses
        updateBonusPills();
        
        // Show the form
        slotForm.style.display = 'block';
        
        // Scroll to the form
        slotForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    function addFeatureSpin() {
        const name = newFeatureSpinName.value.trim();
        const multiplier = parseInt(newFeatureSpinMultiplier.value);
        const description = newFeatureSpinDescription.value.trim();
        
        if (!name) {
            showStatusMessage('Feature spin name cannot be empty', true);
            return;
        }
        
        if (isNaN(multiplier) || multiplier < 1) {
            showStatusMessage('Please enter a valid multiplier', true);
            return;
        }
        
        // Get current feature spins
        let currentFeatureSpins = [];
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentFeatureSpins = slot.additional_feature_spins || [];
            }
        }
        
        // Check if feature spin with same name already exists
        if (currentFeatureSpins.some(spin => spin.name === name)) {
            showStatusMessage('A feature spin with this name already exists', true);
            return;
        }
        
        // Add the new feature spin
        currentFeatureSpins.push({
            name: name,
            multiplier: multiplier,
            description: description
        });
        
        // Update the slot object if editing
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                slot.additional_feature_spins = currentFeatureSpins;
            }
        }
        
        // Clear inputs
        newFeatureSpinName.value = '';
        newFeatureSpinMultiplier.value = '';
        newFeatureSpinDescription.value = '';
        
        // Update UI
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            updateFeatureSpinPills(slot);
        } else {
            // Creating a new slot, manually set the feature spins
            updateFeatureSpinPills({ additional_feature_spins: currentFeatureSpins });
        }
        
        showStatusMessage(`Added feature spin: ${name} (${multiplier}x)`);
    }
    
    function removeFeatureSpin(name) {
        // Get current feature spins
        let currentFeatureSpins = [];
        let slot = null;
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentFeatureSpins = slot.additional_feature_spins || [];
            }
        }
        
        // Find and remove the feature spin
        const index = currentFeatureSpins.findIndex(spin => spin.name === name);
        if (index !== -1) {
            currentFeatureSpins.splice(index, 1);
            
            // Update the slot object if editing
            if (slot) {
                slot.additional_feature_spins = currentFeatureSpins;
            }
            
            // Update UI
            if (!appData.isCreatingNewSlot && slot) {
                updateFeatureSpinPills(slot);
            } else {
                updateFeatureSpinPills({ additional_feature_spins: currentFeatureSpins });
            }
            
            showStatusMessage(`Removed feature spin: ${name}`);
        }
    }

    function updateFeatureSpinsVisibility() {
        // Show/hide feature spins multiplier and options based on whether feature spins is enabled
        const hasFeatureSpins = featureSpinsInput.value === 'true';
        featureSpinsMultiplierInput.parentElement.style.display = hasFeatureSpins ? 'block' : 'none';
        featureSpinsOptions.style.display = hasFeatureSpins ? 'block' : 'none';
    }
    
    function updateFeatureSpinsFromProvider(providerName) {
        // If we're creating a new slot or explicitly checking provider defaults,
        // set the feature spins and multiplier based on provider defaults
        if (appData.isCreatingNewSlot) {
            if (appData.providerDefaultFeatureSpins[providerName] !== undefined) {
                featureSpinsInput.value = appData.providerDefaultFeatureSpins[providerName] ? 'true' : 'false';
            }
            
            if (appData.providerDefaultFeatureSpinsMultiplier[providerName] !== undefined) {
                featureSpinsMultiplierInput.value = appData.providerDefaultFeatureSpinsMultiplier[providerName];
            } else {
                featureSpinsMultiplierInput.value = 1;
            }
        }
    }

    function updateBetLevelPills(slot = null) {
        betLevelPills.innerHTML = '';
        
        let levels = [];
        let usingProviderDefaults = true;
        
        // If we have a slot with custom bet levels
        if (slot && slot.bet_levels && slot.bet_levels.length > 0) {
            levels = slot.bet_levels;
            usingProviderDefaults = false;
        } else {
            // Use provider defaults
            const providerName = slotProviderInput.value;
            if (providerName && appData.providerDefaultBetLevels[providerName]) {
                levels = appData.providerDefaultBetLevels[providerName];
            }
        }
        
        // Update the info text
        betSourceInfo.textContent = usingProviderDefaults ? 
            'Using default bet levels from provider.' : 
            'Using custom bet levels for this slot.';
        
        // Create pills for each bet level
        levels.forEach(level => {
            const pill = document.createElement('div');
            pill.className = 'bet-pill';
            pill.innerHTML = `
                $${parseFloat(level).toFixed(2)}
                <button class="remove-pill" data-value="${level}">×</button>
            `;
            
            // Add event listener to remove button
            pill.querySelector('.remove-pill').addEventListener('click', (e) => {
                e.stopPropagation();
                removeBetLevel(parseFloat(e.target.dataset.value));
            });
            
            betLevelPills.appendChild(pill);
        });
    }

    function updateFeatureSpinPills(slot = null) {
        featureSpinPills.innerHTML = '';
        
        let featureSpins = [];
        
        // If we have a slot with additional feature spins
        if (slot && slot.additional_feature_spins && slot.additional_feature_spins.length > 0) {
            featureSpins = slot.additional_feature_spins;
        }
        
        // Create pills for each feature spin
        featureSpins.forEach(spin => {
            const pill = document.createElement('div');
            pill.className = 'feature-spin-pill';
            
            const header = document.createElement('div');
            header.className = 'feature-spin-pill-header';
            
            const name = document.createElement('div');
            name.className = 'feature-spin-pill-name';
            name.textContent = spin.name;
            
            const multiplier = document.createElement('div');
            multiplier.className = 'feature-spin-pill-multiplier';
            multiplier.textContent = `${spin.multiplier}x`;
            
            const description = document.createElement('div');
            description.className = 'feature-spin-pill-description';
            description.textContent = spin.description || '';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-pill';
            removeBtn.textContent = '×';
            removeBtn.dataset.name = spin.name;
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFeatureSpin(e.target.dataset.name);
            });
            
            header.appendChild(name);
            header.appendChild(multiplier);
            header.appendChild(removeBtn);
            
            pill.appendChild(header);
            pill.appendChild(description);
            
            featureSpinPills.appendChild(pill);
        });
    }
    
    function updateBonusPills(slot = null) {
        bonusPills.innerHTML = '';
        
        let bonuses = [];
        
        // If we have a slot with bonuses
        if (slot && slot.bonuses && slot.bonuses.length > 0) {
            bonuses = slot.bonuses;
        }
        
        // Create pills for each bonus
        bonuses.forEach(bonus => {
            const pill = document.createElement('div');
            pill.className = 'bonus-pill';
            
            // Enhanced pill format with description if available
            if (bonus.description) {
                pill.className = 'feature-spin-pill'; // Reuse the same pill style
                
                const header = document.createElement('div');
                header.className = 'feature-spin-pill-header';
                
                const name = document.createElement('div');
                name.className = 'feature-spin-pill-name';
                name.textContent = bonus.name;
                
                const multiplier = document.createElement('div');
                multiplier.className = 'feature-spin-pill-multiplier';
                multiplier.textContent = `${bonus.multiplier}x`;
                
                const description = document.createElement('div');
                description.className = 'feature-spin-pill-description';
                description.textContent = bonus.description;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-pill';
                removeBtn.textContent = '×';
                removeBtn.dataset.name = bonus.name;
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeBonus(e.target.dataset.name);
                });
                
                header.appendChild(name);
                header.appendChild(multiplier);
                header.appendChild(removeBtn);
                
                pill.appendChild(header);
                pill.appendChild(description);
            } else {
                // Simple format for bonuses without description
                pill.innerHTML = `
                    ${bonus.name} (${bonus.multiplier}x)
                    <button class="remove-pill" data-name="${bonus.name}">×</button>
                `;
                
                // Add event listener to remove button
                pill.querySelector('.remove-pill').addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeBonus(e.target.dataset.name);
                });
            }
            
            bonusPills.appendChild(pill);
        });
    }

    function updateBetLevelSourceInfo() {
        // Check if we're editing a slot
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                updateBetLevelPills(slot);
                return;
            }
        }
        
        // If creating a new slot or no slot found, use provider defaults
        updateBetLevelPills();
    }

    function addBetLevel() {
        const betValue = parseFloat(newBetLevelInput.value);
        
        if (isNaN(betValue) || betValue <= 0) {
            showStatusMessage('Please enter a valid bet amount', true);
            return;
        }
        
        // Get current bet levels
        let currentLevels = [];
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentLevels = slot.bet_levels || [];
            }
        }
        
        // If empty, start with provider defaults
        if (currentLevels.length === 0) {
            const providerName = slotProviderInput.value;
            if (providerName && appData.providerDefaultBetLevels[providerName]) {
                currentLevels = [...appData.providerDefaultBetLevels[providerName]];
            }
        }
        
        // Check if level already exists
        if (currentLevels.includes(betValue)) {
            showStatusMessage('This bet level already exists', true);
            return;
        }
        
        // Add the new level and sort
        currentLevels.push(betValue);
        currentLevels.sort((a, b) => a - b);
        
        // Update the slot object if editing
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                slot.bet_levels = currentLevels;
            }
        }
        
        // Clear input and update UI
        newBetLevelInput.value = '';
        
        // If editing a slot, pass the slot to updateBetLevelPills
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            updateBetLevelPills(slot);
        } else {
            // Creating a new slot, manually set the current levels
            updateBetLevelPills({ bet_levels: currentLevels });
        }
        
        showStatusMessage(`Added bet level: $${betValue.toFixed(2)}`);
    }

    function removeBetLevel(value) {
        // Get current bet levels
        let currentLevels = [];
        let slot = null;
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentLevels = slot.bet_levels || [];
            }
        }
        
        // If empty, we might be using provider defaults shown in the UI
        if (currentLevels.length === 0) {
            const providerName = slotProviderInput.value;
            if (providerName && appData.providerDefaultBetLevels[providerName]) {
                currentLevels = [...appData.providerDefaultBetLevels[providerName]];
            }
        }
        
        // Find and remove the level
        const index = currentLevels.indexOf(value);
        if (index !== -1) {
            currentLevels.splice(index, 1);
            
            // Update the slot object if editing
            if (slot) {
                slot.bet_levels = currentLevels;
            }
            
            // Update UI
            if (!appData.isCreatingNewSlot && slot) {
                updateBetLevelPills(slot);
            } else {
                updateBetLevelPills({ bet_levels: currentLevels });
            }
            
            showStatusMessage(`Removed bet level: $${value.toFixed(2)}`);
        }
    }

    function addBonus() {
        const bonusName = newBonusName.value.trim();
        const bonusMultiplier = parseInt(newBonusMultiplier.value);
        
        if (!bonusName) {
            showStatusMessage('Bonus name cannot be empty', true);
            return;
        }
        
        if (isNaN(bonusMultiplier) || bonusMultiplier < 1) {
            showStatusMessage('Please enter a valid bonus multiplier', true);
            return;
        }
        
        // Get current bonuses
        let currentBonuses = [];
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentBonuses = slot.bonuses || [];
            }
        }
        
        // Check if bonus with same name already exists
        if (currentBonuses.some(bonus => bonus.name === bonusName)) {
            showStatusMessage('A bonus with this name already exists', true);
            return;
        }
        
        // Add the new bonus
        currentBonuses.push({
            name: bonusName,
            multiplier: bonusMultiplier
        });
        
        // Update the slot object if editing
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                slot.bonuses = currentBonuses;
            }
        }
        
        // Clear inputs and update UI
        newBonusName.value = '';
        newBonusMultiplier.value = '';
        
        // If editing a slot, pass the slot to updateBonusPills
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            updateBonusPills(slot);
        } else {
            // Creating a new slot, manually set the current bonuses
            updateBonusPills({ bonuses: currentBonuses });
        }
        
        showStatusMessage(`Added bonus: ${bonusName} (${bonusMultiplier}x)`);
    }

    function removeBonus(name) {
        // Get current bonuses
        let currentBonuses = [];
        let slot = null;
        
        if (!appData.isCreatingNewSlot && appData.selectedSlotId !== null) {
            // Editing existing slot
            slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                currentBonuses = slot.bonuses || [];
            }
        }
        
        // Find and remove the bonus
        const index = currentBonuses.findIndex(bonus => bonus.name === name);
        if (index !== -1) {
            currentBonuses.splice(index, 1);
            
            // Update the slot object if editing
            if (slot) {
                slot.bonuses = currentBonuses;
            }
            
            // Update UI
            if (!appData.isCreatingNewSlot && slot) {
                updateBonusPills(slot);
            } else {
                updateBonusPills({ bonuses: currentBonuses });
            }
            
            showStatusMessage(`Removed bonus: ${name}`);
        }
    }

    function saveSlot() {
        // Validate inputs
        const name = slotNameInput.value.trim();
        const provider = slotProviderInput.value;
        const imageUrl = slotImageUrlInput.value.trim();
        const hasFeatureSpins = featureSpinsInput.value === 'true';
        const featureSpinsMultiplier = parseInt(featureSpinsMultiplierInput.value) || 1;
        
        // Validate feature spins multiplier
        if (hasFeatureSpins && (isNaN(featureSpinsMultiplier) || featureSpinsMultiplier < 1)) {
            showStatusMessage('Feature spins multiplier must be at least 1', true);
            return;
        }
        
        if (!name) {
            showStatusMessage('Slot name cannot be empty', true);
            return;
        }
        
        if (!provider) {
            showStatusMessage('Provider cannot be empty', true);
            return;
        }
        
        // Get bet levels from the UI
        const betLevels = [];
        document.querySelectorAll('.bet-pill .remove-pill').forEach(pill => {
            betLevels.push(parseFloat(pill.dataset.value));
        });
        
        // Get feature spins from the UI
        const additionalFeatureSpins = [];
        document.querySelectorAll('.feature-spin-pill').forEach(pill => {
            // Skip if this is a bonus pill
            if (pill.parentElement.id !== 'feature-spin-pills') return;
            
            const nameElement = pill.querySelector('.feature-spin-pill-name');
            const multiplierElement = pill.querySelector('.feature-spin-pill-multiplier');
            const descriptionElement = pill.querySelector('.feature-spin-pill-description');
            
            if (nameElement && multiplierElement) {
                const name = nameElement.textContent;
                const multiplierMatch = multiplierElement.textContent.match(/(\d+)x/);
                const multiplier = multiplierMatch ? parseInt(multiplierMatch[1]) : 1;
                const description = descriptionElement ? descriptionElement.textContent : '';
                
                additionalFeatureSpins.push({
                    name: name,
                    multiplier: multiplier,
                    description: description
                });
            }
        });
        
        // Get bonuses from the UI
        const bonuses = [];
        
        // First get enhanced bonuses
        document.querySelectorAll('.bonus-pills .feature-spin-pill').forEach(pill => {
            const nameElement = pill.querySelector('.feature-spin-pill-name');
            const multiplierElement = pill.querySelector('.feature-spin-pill-multiplier');
            const descriptionElement = pill.querySelector('.feature-spin-pill-description');
            
            if (nameElement && multiplierElement) {
                const name = nameElement.textContent;
                const multiplierMatch = multiplierElement.textContent.match(/(\d+)x/);
                const multiplier = multiplierMatch ? parseInt(multiplierMatch[1]) : 1;
                const description = descriptionElement ? descriptionElement.textContent : '';
                
                bonuses.push({
                    name: name,
                    multiplier: multiplier,
                    description: description
                });
            }
        });
        
        // Then get simple bonuses
        document.querySelectorAll('.bonus-pills .bonus-pill .remove-pill').forEach(pill => {
            const bonusName = pill.dataset.name;
            const bonusText = pill.parentElement.textContent.trim();
            const multiplierMatch = bonusText.match(/\((\d+)x\)/);
            const multiplier = multiplierMatch ? parseInt(multiplierMatch[1]) : 1;
            
            bonuses.push({
                name: bonusName,
                multiplier: multiplier
            });
        });
        
        if (appData.isCreatingNewSlot) {
            // Create new slot
            const newSlotId = appData.slots.length;
            appData.slots.push({
                id: newSlotId,
                game_name: name,
                provider: provider,
                game_image_url: imageUrl,
                bet_levels: betLevels,
                feature_spins: hasFeatureSpins,
                feature_spins_multiplier: featureSpinsMultiplier,
                additional_feature_spins: additionalFeatureSpins,
                bonuses: bonuses
            });
            
            showStatusMessage(`Created new slot: ${name}`);
        } else {
            // Update existing slot
            const slot = appData.slots.find(s => s.id === appData.selectedSlotId);
            if (slot) {
                slot.game_name = name;
                slot.provider = provider;
                slot.game_image_url = imageUrl;
                slot.bet_levels = betLevels;
                slot.feature_spins = hasFeatureSpins;
                slot.feature_spins_multiplier = featureSpinsMultiplier;
                slot.additional_feature_spins = additionalFeatureSpins;
                slot.bonuses = bonuses;
                
                showStatusMessage(`Updated slot: ${name}`);
            }
        }
        
        // Save to file
        saveToFile();
        
        // Hide the form and reset state
        slotForm.style.display = 'none';
        appData.selectedSlotId = null;
        appData.isCreatingNewSlot = false;
        
        // Update UI
        renderSlotGrid();
    }

    function cancelSlotEdit() {
        // Hide the form and reset state
        slotForm.style.display = 'none';
        appData.selectedSlotId = null;
        appData.isCreatingNewSlot = false;
        
        // Update UI
        renderSlotGrid();
    }

    function saveToFile() {
        // Create data structure that matches existing stake.json
        const dataToSave = [
            {
                slot_games: appData.slots.map(slot => {
                    const { id, ...slotWithoutId } = slot;
                    return slotWithoutId;
                })
            }
        ];
        
        // Use fetch to call a server-side endpoint to save the file
        fetch('/save-stake-json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showStatusMessage('Saved successfully!');
        })
        .catch(error => {
            console.error('Error saving data:', error);
            
            // Show an error message
            showStatusMessage('Error saving data. Please try again.', true);
        });
    }

    function showStatusMessage(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        
        if (isError) {
            statusMessage.classList.add('error');
        }
        
        statusMessage.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusMessage.classList.remove('show');
        }, 3000);
    }
});