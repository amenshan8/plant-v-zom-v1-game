// Game initialization and animation
function animateIntro() {
    const introOverlay = document.getElementById('intro-overlay');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        introOverlay.style.transition = 'opacity 0.5s ease-out';
        introOverlay.style.opacity = '0';
        setTimeout(() => {
            introOverlay.remove();
        }, 500);
    }, 3000);
}

// Call the intro animation when the page loads
window.addEventListener('load', animateIntro);

// Game state and initialization
const lawn = document.getElementById('lawn');
const cemetery = document.getElementById('cemetery');
const sunCounter = document.getElementById('sun-amount');
const plantSelection = document.getElementById('plant-selection');
const startButton = document.getElementById('start-button');
const selectedPlants = document.getElementById('selected-plants');

const gameState = {
    plants: [],
    zombies: [],
    sun: 50,
    wave: 1,
    gameStarted: false,
    selectedSlots: new Array(6).fill(null),
    currentSelection: null,
    zombieSpeed: 5000,
    lastZombieSpawn: 0,
    zombieSpawnRate: 15000,
    hitboxMode: false,
    startTime: 0,
    zombiesEnabled: false,
    waveInProgress: false,
    zombiesInWave: 0,
    zombiesSpawned: 0,
    waveConfig: {
        1: { 
            waves: [
                { count: 5, spawnRate: 15000, reward: 50, zombieTypes: ['basic'] },
                { count: 8, spawnRate: 13000, reward: 75, zombieTypes: ['basic', 'conehead'] },
                { superWave: true, count: 12, spawnRate: 10000, reward: 100, zombieTypes: ['basic', 'conehead', 'buckethead'] }
            ]
        },
        2: {
            waves: [
                { count: 8, spawnRate: 13000, reward: 75, zombieTypes: ['basic', 'conehead'] },
                { count: 10, spawnRate: 11000, reward: 100, zombieTypes: ['basic', 'conehead', 'buckethead'] },
                { superWave: true, count: 15, spawnRate: 9000, reward: 150, zombieTypes: ['basic', 'conehead', 'buckethead', 'screendoor'] }
            ]
        },
        // Add more levels as needed
    },
    currentWaveIndex: 0,
    currentLevelWaves: [],
    waveProgress: 0
};

// Plant definitions
const PLANTS = {
    types: {
        sunflower: {
            name: 'sunflower',
            cost: 50,
            health: 300,
            rechargeSpeed: 'Very Fast',
            rechargeTime: 5000,
            imageSrc: 'sunflower.png',
            imageAlt: 'cartoon sunflower with a smiling face',
            abilities: {
                generateSun: {
                    amount: 25,
                    interval: 24000
                }
            }
        },
        peashooter: {
            name: 'peashooter',
            cost: 100,
            health: 300,
            rechargeSpeed: 'Very Fast',
            rechargeTime: 5000,
            imageSrc: 'peashooter.png',
            imageAlt: 'green plant that shoots peas',
            abilities: {
                shoot: {
                    damage: 20,
                    interval: 1500,
                    projectile: {
                        type: 'pea',
                        speed: 1500
                    }
                }
            }
        },
        wallnut: {
            name: 'wallnut',
            cost: 50,
            health: 4000,
            rechargeSpeed: 'Medium',
            rechargeTime: 30000,
            imageSrc: 'wall-nut.png',
            imageAlt: 'brown defensive nut with worried expression',
            abilities: {}
        },
        potatoMine: {
            name: 'potatoMine',
            cost: 25,
            health: 300,
            rechargeSpeed: 'Medium',
            rechargeTime: 30000,
            imageSrc: 'potato-mine-unarmed.png',
            imageAlt: 'brown potato mine with a red detonator',
            armedImageSrc: 'potato-mine.png',
            traits: {
                unarmed: {
                    duration: 14000,
                    onArmed: function(plant) {
                        plant.element.querySelector('img').src = 'potato-mine.png';
                        plant.traits.ghost = true;
                    }
                },
                ghost: false
            },
            abilities: {
                explode: {
                    damage: 1800,
                    trigger: 'zombie-collision'
                }
            }
        },
        shovel: {
            name: 'shovel',
            cost: 50,
            rechargeTime: 0,
            imageSrc: 'shovel.png',
            imageAlt: 'shovel tool for removing plants'
        },
        snowPea: {
            name: 'snowPea',
            cost: 175,
            health: 300,
            rechargeSpeed: 'Fast',
            rechargeTime: 7500,
            abilities: {
                shoot: {
                    damage: 20,
                    interval: 1500,
                    projectile: {
                        type: 'frozen-pea',
                        speed: 1500,
                        effect: {
                            type: 'slow',
                            duration: 3000,
                            multiplier: 0.5
                        }
                    }
                }
            }
        },
        repeater: {
            name: 'repeater',
            cost: 200,
            health: 300,
            rechargeSpeed: 'Fast',
            rechargeTime: 7500,
            abilities: {
                shoot: {
                    damage: 20,
                    interval: 1500,
                    projectile: {
                        type: 'double-pea',
                        speed: 1500,
                        count: 2,
                        delay: 150
                    }
                }
            }
        },
        splitPea: {
            name: 'splitPea',
            cost: 125,
            health: 300,
            rechargeSpeed: 'Fast',
            rechargeTime: 7500,
            abilities: {
                shoot: {
                    damage: 20,
                    interval: 1500,
                    projectile: {
                        type: 'split-pea',
                        speed: 1500,
                        directions: ['forward', 'backward']
                    }
                }
            }
        }
    },
    
    create: function(type, row, col) {
        const plantData = this.types[type];
        const plantElement = document.createElement('div');
        plantElement.className = `${type}-plant`;
        plantElement.dataset.health = plantData.health;
        
        const img = document.createElement('img');
        switch(type) {
            case 'snowPea':
                img.src = 'Snow Pea.png';
                break;
            case 'repeater':
                img.src = 'Repeater.png';
                break;
            case 'splitPea':
                img.src = 'Split Pea.png';
                break;
            case 'peashooter':
                img.src = 'peashooter.png';
                break;
            case 'sunflower':
                img.src = 'sunflower.png';
                break;
            case 'wallnut':
                img.src = 'wall-nut.png';
                break;
            case 'potatoMine':
                img.src = plantData.traits?.unarmed ? 'potato-mine-unarmed.png' : 'potato-mine.png';
                break;
        }
        img.alt = plantData.imageAlt || `${type} plant`;
        img.width = 65;
        img.height = 65;
        
        plantElement.appendChild(img);
        
        const plant = {
            type: type,
            row: row,
            col: col,
            health: plantData.health,
            element: plantElement,
            traits: {}
        };

        if (plantData.traits) {
            Object.entries(plantData.traits).forEach(([trait, value]) => {
                if (typeof value === 'object' && value.duration) {
                    plant.traits[trait] = true;
                    setTimeout(() => {
                        value.onArmed(plant);
                    }, value.duration);
                } else {
                    plant.traits[trait] = value;
                }
            });
        }
        
        return plant;
    },
    
    initializeAbilities: function(plant) {
        const plantData = this.types[plant.type];
        
        if (plantData.abilities.generateSun) {
            this.initSunGeneration(plant);
        }
        
        if (plantData.abilities.shoot) {
            this.initShooting(plant);
        }
    },
    
    initSunGeneration: function(plant) {
        const ability = this.types[plant.type].abilities.generateSun;
        
        const generateSun = () => {
            if (!plant.element.parentElement) return;
            
            gameState.sun += ability.amount;
            sunCounter.textContent = gameState.sun;
            
            const tile = plant.element.parentElement;
            const sun = document.createElement('div');
            sun.className = 'falling-sun';
            sun.style.left = `${tile.offsetLeft + 20}px`;
            sun.style.top = `${tile.offsetTop}px`;
            
            document.querySelector('.game-container').appendChild(sun);
            
            sun.addEventListener('click', () => {
                gameState.sun += 25;
                sunCounter.textContent = gameState.sun;
                sun.remove();
            });
            
            setTimeout(() => {
                if (sun.parentElement) sun.remove();
            }, 15000);
        };
        
        setInterval(generateSun, ability.interval);
    },
    
    initShooting: function(plant) {
        const ability = this.types[plant.type].abilities.shoot;
        
        const shootInterval = setInterval(() => {
            if (!plant.element || !plant.element.parentElement) {
                clearInterval(shootInterval);
                return;
            }
            
            const zombiesInLane = gameState.zombies.some(zombie => 
                zombie.row === plant.row && 
                (plant.type !== 'splitPea' || 
                 zombie.col <= plant.col || 
                 gameState.zombies.some(z => z.row === plant.row && z.col > plant.col))
            );

            if (zombiesInLane) {
                if (plant.type === 'splitPea') {
                    // Check for zombies behind
                    const zombiesBehind = gameState.zombies.some(z => z.row === plant.row && z.col < plant.col);
                    if (zombiesBehind) {
                        plant.element.classList.add('shooting-backward');
                        setTimeout(() => plant.element.classList.remove('shooting-backward'), 300);
                        this.createProjectile(plant, {...ability, direction: 'backward'});
                    }
                    
                    // Check for zombies ahead
                    const zombiesAhead = gameState.zombies.some(z => z.row === plant.row && z.col > plant.col);
                    if (zombiesAhead) {
                        plant.element.classList.add('shooting-forward');
                        setTimeout(() => plant.element.classList.remove('shooting-forward'), 300);
                        this.createProjectile(plant, {...ability, direction: 'forward'});
                    }
                } else {
                    plant.element.classList.add('shooting');
                    setTimeout(() => plant.element.classList.remove('shooting'), 300);
                    
                    if (plant.type === 'repeater') {
                        this.createProjectile(plant, ability);
                        setTimeout(() => {
                            if (plant.element && plant.element.parentElement) {
                                this.createProjectile(plant, ability);
                            }
                        }, 150);
                    } else {
                        this.createProjectile(plant, ability);
                    }
                }
            }
        }, ability.interval);
    },
    
    createProjectile: function(plant, ability) {
        const pea = document.createElement('div');
        pea.className = plant.type === 'snowPea' ? 'frozen-pea' : 'pea';
        
        const tile = plant.element.parentElement;
        if (!tile) return;
        
        const startX = tile.offsetLeft + tile.offsetWidth / 2;
        pea.style.left = `${startX}px`;
        pea.style.top = `${tile.offsetTop + tile.offsetHeight / 2 - 10}px`;
        
        document.querySelector('.game-container').appendChild(pea);
        
        const lawnRect = lawn.getBoundingClientRect();
        const endX = ability.direction === 'backward' ? 0 : lawnRect.right;
        
        requestAnimationFrame(() => {
            pea.style.left = `${endX}px`;
        });

        const checkCollision = setInterval(() => {
            if (!pea.parentElement) {
                clearInterval(checkCollision);
                return;
            }

            const peaRect = pea.getBoundingClientRect();
            
            for (let zombie of gameState.zombies) {
                if (zombie.row === plant.row) {
                    const zombieRect = zombie.element.getBoundingClientRect();
                    const collision = ability.direction === 'backward' ?
                        (peaRect.left <= zombieRect.right && peaRect.right >= zombieRect.left) :
                        (peaRect.right >= zombieRect.left && peaRect.left <= zombieRect.right);

                    if (collision) {
                        zombie.health -= ability.damage;
                        const healthPercentage = Math.max(0, (zombie.health / zombie.maxHealth) * 100);
                        zombie.element.querySelector('.zombie-health-fill').style.width = `${healthPercentage}%`;
                        
                        // Apply slow effect for snow pea
                        if (plant.type === 'snowPea') {
                            const zombieElement = zombie.element;
                            zombieElement.style.transition = `left ${ZOMBIES.basic.speed * 2}ms linear`;
                            zombie.slowed = true;
                            
                            setTimeout(() => {
                                if (zombieElement && zombieElement.parentElement) {
                                    zombieElement.style.transition = `left ${ZOMBIES.basic.speed}ms linear`;
                                    zombie.slowed = false;
                                }
                            }, 3000);
                        }
                        
                        if (zombie.health <= 0) {
                            zombie.element.remove();
                            gameState.zombies = gameState.zombies.filter(z => z !== zombie);
                        }
                        
                        clearInterval(checkCollision);
                        pea.remove();
                        return;
                    }
                }
            }
            
            if ((ability.direction === 'backward' && peaRect.right <= 0) ||
                (ability.direction !== 'backward' && peaRect.left >= endX)) {
                clearInterval(checkCollision);
                pea.remove();
            }
        }, 50);

        setTimeout(() => {
            if (pea.parentElement) {
                pea.remove();
                clearInterval(checkCollision);
            }
        }, ability.projectile.speed * 2);
    }
};

// Modify the ZOMBIES constant to include new zombie types
const ZOMBIES = {
    basic: {
        health: 220,
        speed: 5000,
        damage: 50,
        name: 'Basic Zombie'
    },
    conehead: {
        health: 640,
        speed: 5000,
        damage: 50,
        name: 'Conehead Zombie'
    },
    buckethead: {
        health: 1300,
        speed: 5000,
        damage: 50,
        name: 'Buckethead Zombie'
    },
    screendoor: {
        health: 1100,
        speed: 5000,
        damage: 50,
        name: 'Screen Door Zombie'
    }
};

function showWaveAlert() {
    const currentWave = gameState.currentLevelWaves[gameState.currentWaveIndex];
    
    if (currentWave.superWave) {
        showSuperWaveWarning();
        return;
    }
    
    // Existing wave alert code...
    const alertDiv = document.createElement('div');
    alertDiv.style.position = 'absolute';
    alertDiv.style.top = '50%';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translate(-50%, -50%)';
    alertDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    alertDiv.style.color = '#ff0000';
    alertDiv.style.padding = '20px';
    alertDiv.style.borderRadius = '10px';
    alertDiv.style.fontSize = '24px';
    alertDiv.style.fontWeight = 'bold';
    alertDiv.style.zIndex = '1000';
    alertDiv.style.textAlign = 'center';
    alertDiv.innerHTML = `WAVE ${gameState.wave}<br>Get Ready!`;
    
    document.querySelector('.game-container').appendChild(alertDiv);
    
    const zombieWarning = new Audio('zombie_are_coming.mp3');
    zombieWarning.play();
    
    setTimeout(() => {
        alertDiv.remove();
        startWave();
    }, 3000);
}

function showSuperWaveWarning() {
    const warning = document.createElement('div');
    warning.className = 'super-wave-warning';
    warning.innerHTML = 'SUPER WAVE INCOMING!<br>Get Ready for a Challenge!';
    document.querySelector('.game-container').appendChild(warning);
    
    const zombieWarning = new Audio('zombie_are_coming.mp3');
    zombieWarning.play();
    
    setTimeout(() => {
        warning.remove();
        startWave();
    }, 5000);
}

function startWave() {
    const currentWave = gameState.currentLevelWaves[gameState.currentWaveIndex];
    gameState.waveInProgress = true;
    gameState.zombiesInWave = currentWave.count;
    gameState.zombiesSpawned = 0;
    gameState.zombieSpawnRate = currentWave.spawnRate;
}

function updateWaveProgress() {
    const progressBar = document.querySelector('.wave-progress-bar');
    const waveInfo = document.querySelector('.wave-info');
    
    if (gameState.waveInProgress) {
        const progress = (gameState.zombiesSpawned / gameState.zombiesInWave) * 100;
        progressBar.style.width = `${progress}%`;
        waveInfo.textContent = `Wave ${gameState.wave} - ${Math.floor(progress)}%`;
    }
}

function awardWaveCompletion(reward) {
    gameState.sun += reward;
    sunCounter.textContent = gameState.sun;
    
    const rewardDiv = document.createElement('div');
    rewardDiv.style.position = 'absolute';
    rewardDiv.style.top = '50%';
    rewardDiv.style.left = '50%';
    rewardDiv.style.transform = 'translate(-50%, -50%)';
    rewardDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    rewardDiv.style.color = '#ffd700';
    rewardDiv.style.padding = '20px';
    rewardDiv.style.borderRadius = '10px';
    rewardDiv.style.fontSize = '24px';
    rewardDiv.style.fontWeight = 'bold';
    rewardDiv.style.zIndex = '1000';
    rewardDiv.innerHTML = `Wave Complete!<br>+${reward} Sun`;
    
    document.querySelector('.game-container').appendChild(rewardDiv);
    
    setTimeout(() => {
        rewardDiv.remove();
        setTimeout(() => {
            showWaveAlert();
        }, 5000);
    }, 3000);
}

function startGame() {
    gameState.gameStarted = true;
    plantSelection.style.display = 'none';
    gameState.startTime = Date.now();
    gameState.zombiesEnabled = false;
    gameState.currentWaveIndex = 0;
    gameState.currentLevelWaves = gameState.waveConfig[1].waves;
    
    setInterval(createSun, 10000);
    gameState.lastZombieSpawn = Date.now();
    
    setTimeout(() => {
        gameState.zombiesEnabled = true;
        showWaveAlert();
    }, 25000);
    
    setInterval(() => {
        updateGame();
    }, 1000/30);
}

function updateGame() {
    sunCounter.textContent = gameState.sun;
    updateWaveProgress();
    
    const now = Date.now();
    if (gameState.zombiesEnabled && gameState.waveInProgress && 
        now - gameState.lastZombieSpawn >= gameState.zombieSpawnRate) {
        createZombie();
        gameState.lastZombieSpawn = now;
    }

    moveZombies();
    
    // Check if wave is complete
    if (gameState.waveInProgress && 
        gameState.zombiesSpawned >= gameState.zombiesInWave && 
        gameState.zombies.length === 0) {
        gameState.waveInProgress = false;
        
        const currentWave = gameState.currentLevelWaves[gameState.currentWaveIndex];
        awardWaveCompletion(currentWave.reward);
        
        gameState.currentWaveIndex++;
        if (gameState.currentWaveIndex >= gameState.currentLevelWaves.length) {
            gameState.wave++;
            gameState.currentWaveIndex = 0;
            if (gameState.waveConfig[gameState.wave]) {
                gameState.currentLevelWaves = gameState.waveConfig[gameState.wave].waves;
            }
        }
    }
}

function createZombie() {
    if (!gameState.waveInProgress || gameState.zombiesSpawned >= gameState.zombiesInWave) {
        return;
    }
    
    gameState.zombiesSpawned++;
    
    const randomRow = Math.floor(Math.random() * 5);
    const startTile = document.querySelector(`.tile[data-row="${randomRow}"][data-col="8"]`);
    
    // Get available zombie types for current wave
    const waveConfig = gameState.currentLevelWaves[gameState.currentWaveIndex];
    const zombieTypes = waveConfig.zombieTypes;
    const randomType = zombieTypes[Math.floor(Math.random() * zombieTypes.length)];
    
    const zombieData = ZOMBIES[randomType];
    
    const zombie = {
        row: randomRow,
        col: 8,
        type: randomType,
        health: zombieData.health,
        element: null,
        lastMove: Date.now(),
        eating: false,
        lastAttack: 0,
        maxHealth: zombieData.health,
        slowed: false
    };

    const zombieElement = document.createElement('div');
    zombieElement.className = `zombie ${randomType}-zombie`;
    
    const zombieImg = document.createElement('img');
    // Changed image source based on zombie type
    switch(randomType) {
        case 'buckethead':
            zombieImg.src = 'Buckethead Zombie.webp';
            break;
        case 'conehead':
            zombieImg.src = 'ConeHead Zombie.webp';
            break;
        case 'screendoor':
            zombieImg.src = 'screendoor zombie.webp';
            break;
        default:
            zombieImg.src = 'zombie-basic.png';
    }
    zombieImg.alt = zombieData.name;
    zombieImg.width = 90;
    zombieImg.height = 90;
    zombieElement.appendChild(zombieImg);

    // Add health bar
    const healthBar = document.createElement('div');
    healthBar.className = 'zombie-health-bar';
    const healthFill = document.createElement('div');
    healthFill.className = 'zombie-health-fill';
    
    // Add zombie type indicator
    const typeIndicator = document.createElement('div');
    typeIndicator.className = 'zombie-type';
    typeIndicator.textContent = zombieData.name;
    typeIndicator.style.position = 'absolute';
    typeIndicator.style.top = '-20px';
    typeIndicator.style.left = '50%';
    typeIndicator.style.transform = 'translateX(-50%)';
    typeIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
    typeIndicator.style.color = 'white';
    typeIndicator.style.padding = '2px 5px';
    typeIndicator.style.borderRadius = '3px';
    typeIndicator.style.fontSize = '10px';
    
    healthBar.appendChild(healthFill);
    zombieElement.appendChild(healthBar);
    zombieElement.appendChild(typeIndicator);

    zombieElement.style.left = `${startTile.offsetLeft + startTile.offsetWidth / 2}px`;
    zombieElement.style.top = `${startTile.offsetTop - 20}px`; 
    
    document.querySelector('.game-container').appendChild(zombieElement);
    zombie.element = zombieElement;

    gameState.zombies.push(zombie);
}

function moveZombies() {
    const now = Date.now();
    gameState.zombies.forEach((zombie, zombieIndex) => {
        if (zombie.eating) {
            const targetPlant = gameState.plants.find(p => p.row === zombie.row && p.col === zombie.col - 1);
            if (targetPlant && !targetPlant.traits?.ghost) {
                if (now - zombie.lastAttack >= 1000) {
                    targetPlant.health -= 50;
                    targetPlant.element.dataset.health = targetPlant.health;
                    zombie.lastAttack = now;
                    playRandomChomp();

                    if (targetPlant.health <= 0) {
                        const plantIndex = gameState.plants.indexOf(targetPlant);
                        if (plantIndex > -1) {
                            gameState.plants.splice(plantIndex, 1);
                        }
                        targetPlant.element.parentNode?.removeChild(targetPlant.element);
                        zombie.eating = false;
                    }
                }
            } else {
                zombie.eating = false;
            }
        } else {
            const moveDelay = zombie.slowed ? ZOMBIES.basic.speed * 2 : ZOMBIES.basic.speed;
            if (now - zombie.lastMove >= moveDelay) {
                const plantInNext = gameState.plants.find(p => p.row === zombie.row && p.col === zombie.col - 1);
                const plantInCurrent = gameState.plants.find(p => p.row === zombie.row && p.col === zombie.col);
                
                if (plantInCurrent?.type === 'potatoMine' && !plantInCurrent.traits.unarmed) {
                    zombie.health -= PLANTS.types.potatoMine.abilities.explode.damage;
                    const healthPercentage = Math.max(0, (zombie.health / zombie.maxHealth) * 100);
                    zombie.element.querySelector('.zombie-health-fill').style.width = `${healthPercentage}%`;
                    
                    const plantIndex = gameState.plants.indexOf(plantInCurrent);
                    if (plantIndex > -1) {
                        gameState.plants.splice(plantIndex, 1);
                    }
                    plantInCurrent.element.parentNode?.removeChild(plantInCurrent.element);
                    
                    if (zombie.health <= 0) {
                        zombie.element.remove();
                        gameState.zombies.splice(zombieIndex, 1);
                    }
                    return;
                }
                
                if (plantInNext && !plantInNext.traits?.ghost) {
                    zombie.eating = true;
                    zombie.lastAttack = now;
                    playRandomChomp();
                } else if (zombie.col > 0) {
                    const nextTile = document.querySelector(`.tile[data-row="${zombie.row}"][data-col="${zombie.col - 1}"]`);
                    if (nextTile) {
                        zombie.col--;
                        zombie.element.style.left = `${nextTile.offsetLeft + nextTile.offsetWidth / 2}px`;
                        zombie.lastMove = now;
                    } else {
                        gameOver();
                    }
                } else {
                    gameOver();
                }
            }
        }
    });
}

function playRandomChomp() {
    const chomp1 = new Audio('chomp.mp3');
    const chomp2 = new Audio('chomp2.mp3');
    const random = Math.random();
    if (random < 0.5) {
        chomp1.play();
    } else {
        chomp2.play();
    }
}

function plantOnTile(type, row, col) {
    const plantData = PLANTS.types[type];
    
    if (plantData.isRecharging) return false;
    if (gameState.sun < plantData.cost) return false;
    
    const tile = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
    if (tile.children.length > 0) return false;
    
    const plant = PLANTS.create(type, row, col);
    gameState.plants.push(plant);
    
    gameState.sun -= plantData.cost;
    sunCounter.textContent = gameState.sun;
    
    // Create plant element and set up its image
    const plantElement = document.createElement('div');
    plantElement.className = `${type}-plant`;
    
    const img = document.createElement('img');
    switch(type) {
        case 'snowPea':
            img.src = 'Snow Pea.png';
            break;
        case 'repeater':
            img.src = 'Repeater.png';
            break;
        case 'splitPea':
            img.src = 'Split Pea.png';
            break;
        case 'peashooter':
            img.src = 'peashooter.png';
            break;
        case 'sunflower':
            img.src = 'sunflower.png';
            break;
        case 'wallnut':
            img.src = 'wall-nut.png';
            break;
        case 'potatoMine':
            img.src = plantData.traits?.unarmed ? 'potato-mine-unarmed.png' : 'potato-mine.png';
            break;
    }
    img.alt = plantData.imageAlt || `${type} plant`;
    img.width = 65;
    img.height = 65;
    
    plantElement.appendChild(img);
    tile.appendChild(plantElement);
    
    plant.element = plantElement;  // Important: Set the element reference
    
    const plantedSound = new Audio('planted.ogg');
    plantedSound.currentTime = 0;
    plantedSound.play();
    
    PLANTS.initializeAbilities(plant);
    
    const plantSlot = document.querySelector('.plant-slot.selected');
    if (plantSlot) {
        startRecharge(type, plantSlot);
    }
    
    return true;
}

function startRecharge(plantType, slot) {
    const plantData = PLANTS.types[plantType];
    
    PLANTS.types[plantType].isRecharging = true;
    slot.classList.add('recharging');
    
    const timer = document.createElement('div');
    timer.className = 'recharge-timer';
    slot.appendChild(timer);
    
    let timeLeft = plantData.rechargeTime / 1000;
    timer.textContent = Math.ceil(timeLeft);
    
    const countdown = setInterval(() => {
        timeLeft -= 0.1;
        timer.textContent = Math.ceil(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(countdown);
            PLANTS.types[plantType].isRecharging = false;
            slot.classList.remove('recharging');
            slot.classList.remove('selected');
            gameState.currentSelection = null;
            timer.remove();
        }
    }, 100);
}

function createSun() {
    const sun = document.createElement('div');
    sun.className = 'falling-sun';
    
    const lawnRect = lawn.getBoundingClientRect();
    const randomX = Math.random() * (lawnRect.width - 40);
    
    sun.style.left = `${lawnRect.left + randomX}px`;
    sun.style.top = `${lawnRect.top}px`;
    
    document.querySelector('.game-container').appendChild(sun);
    
    sun.addEventListener('click', () => {
        gameState.sun += 25;
        sunCounter.textContent = gameState.sun;
        sun.remove();
    });
    
    setTimeout(() => {
        if (sun.parentElement) sun.remove();
    }, 15000);
}

function gameOver() {
    // Stop the game loop
    gameState.gameStarted = false;
    gameState.zombiesEnabled = false;

    // Create game over overlay
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    
    const gameOverImg = document.createElement('img');
    gameOverImg.src = 'gameover.png';
    gameOverImg.alt = 'THE ZOMBIES ATE YOUR BRAINS!';
    gameOverImg.width = 800;
    gameOverImg.height = 600;
    
    gameOverDiv.appendChild(gameOverImg);
    document.body.appendChild(gameOverDiv);

    // Clean up existing game elements
    gameState.zombies.forEach(zombie => {
        zombie.element.remove();
    });
    gameState.zombies = [];
}

const hitboxToggle = document.getElementById('hitbox-toggle');

hitboxToggle.addEventListener('click', () => {
    gameState.hitboxMode = !gameState.hitboxMode;
    document.querySelector('.game-container').classList.toggle('hitbox-mode');
    hitboxToggle.textContent = `Hitbox View Mode: ${gameState.hitboxMode ? 'ON' : 'OFF'}`;
});

document.getElementById('cheat-button').addEventListener('click', () => {
    gameState.sun = 9999;
    sunCounter.textContent = gameState.sun;
});

startButton.addEventListener('click', startGame);

for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.row = row;
        tile.dataset.col = col;
        
        tile.addEventListener('click', (e) => {
            if (gameState.currentSelection && gameState.gameStarted) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (gameState.currentSelection === 'shovel') {
                    const plant = gameState.plants.find(p => p.row === row && p.col === col);
                    if (plant && gameState.sun >= PLANTS.types.shovel.cost) {
                        gameState.sun -= PLANTS.types.shovel.cost;
                        sunCounter.textContent = gameState.sun;
                        const plantIndex = gameState.plants.indexOf(plant);
                        if (plantIndex > -1) {
                            gameState.plants.splice(plantIndex, 1);
                        }
                        plant.element.parentNode?.removeChild(plant.element);
                        
                        // Reset shovel selection
                        const selectedSlot = document.querySelector('.plant-slot.selected');
                        if (selectedSlot) {
                            selectedSlot.classList.remove('selected');
                            gameState.currentSelection = null;
                        }
                    }
                } else {
                    plantOnTile(gameState.currentSelection, row, col);
                }
            }
        });
        
        lawn.appendChild(tile);
    }
}

for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 2; col++) {
        const tile = document.createElement('div');
        tile.className = 'cemetery-tile';
        
        const tombstone = document.createElement('div');
        tombstone.className = 'tombstone';
        tile.appendChild(tombstone);
        
        cemetery.appendChild(tile);
    }
}

const sunflowerCard = document.querySelector('.plant-card.sunflower');
sunflowerCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('sunflower')) {
        const slotIndex = gameState.selectedSlots.indexOf('sunflower');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'sunflower';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot sunflower';
        const img = document.createElement('img');
        img.src = 'sunflower.png';
        img.alt = 'cartoon sunflower with a smiling face';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

const peashooterCard = document.querySelector('.plant-card.peashooter');
peashooterCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('peashooter')) {
        const slotIndex = gameState.selectedSlots.indexOf('peashooter');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'peashooter';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot peashooter';
        const img = document.createElement('img');
        img.src = 'peashooter.png';
        img.alt = 'green plant that shoots peas';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

const wallnutCard = document.querySelector('.plant-card.wallnut');
wallnutCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('wallnut')) {
        const slotIndex = gameState.selectedSlots.indexOf('wallnut');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'wallnut';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot wallnut';
        const img = document.createElement('img');
        img.src = 'wall-nut.png';
        img.alt = 'brown defensive nut with worried expression';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Add Potato Mine card click handler
const potatoMineCard = document.querySelector('.plant-card.potatoMine');
potatoMineCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('potatoMine')) {
        const slotIndex = gameState.selectedSlots.indexOf('potatoMine');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'potatoMine';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot potatoMine';
        const img = document.createElement('img');
        img.src = 'potato-mine-unarmed.png';
        img.alt = 'brown potato mine with a red detonator';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Add shovel card click handler
const shovelCard = document.querySelector('.plant-card.shovel');
shovelCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('shovel')) {
        const slotIndex = gameState.selectedSlots.indexOf('shovel');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
        document.body.classList.remove('shovel-cursor');
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'shovel';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot shovel';
        const img = document.createElement('img');
        img.src = 'shovel.png';
        img.alt = 'shovel tool for removing plants';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Add Snow Pea card click handler
const snowPeaCard = document.querySelector('.plant-card.snowPea');
snowPeaCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('snowPea')) {
        const slotIndex = gameState.selectedSlots.indexOf('snowPea');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'snowPea';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot snowPea';
        const img = document.createElement('img');
        img.src = 'Snow Pea.png';
        img.alt = 'snow pea plant';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Add Repeater card click handler
const repeaterCard = document.querySelector('.plant-card.repeater');
repeaterCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('repeater')) {
        const slotIndex = gameState.selectedSlots.indexOf('repeater');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'repeater';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot repeater';
        const img = document.createElement('img');
        img.src = 'Repeater.png';
        img.alt = 'repeater plant';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Add Split Pea card click handler
const splitPeaCard = document.querySelector('.plant-card.splitPea');
splitPeaCard.addEventListener('click', () => {
    const firstEmptySlot = gameState.selectedSlots.indexOf(null);
    
    if (gameState.selectedSlots.includes('splitPea')) {
        const slotIndex = gameState.selectedSlots.indexOf('splitPea');
        gameState.selectedSlots[slotIndex] = null;
        selectedPlants.children[slotIndex].className = 'plant-slot';
        selectedPlants.children[slotIndex].innerHTML = '';
    } else if (firstEmptySlot !== -1) {
        gameState.selectedSlots[firstEmptySlot] = 'splitPea';
        selectedPlants.children[firstEmptySlot].className = 'plant-slot splitPea';
        const img = document.createElement('img');
        img.src = 'Split Pea.png';
        img.alt = 'split pea plant';
        img.width = 50;
        img.height = 50;
        selectedPlants.children[firstEmptySlot].appendChild(img);
    }
});

// Modify the selectedPlants event listeners to handle plant selection
selectedPlants.querySelectorAll('.plant-slot').forEach(slot => {
    slot.addEventListener('click', () => {
        const plant = slot.classList.contains('sunflower') ? 'sunflower' : 
                     slot.classList.contains('peashooter') ? 'peashooter' : 
                     slot.classList.contains('wallnut') ? 'wallnut' : 
                     slot.classList.contains('potatoMine') ? 'potatoMine' :
                     slot.classList.contains('shovel') ? 'shovel' :
                     slot.classList.contains('snowPea') ? 'snowPea' :
                     slot.classList.contains('repeater') ? 'repeater' :
                     slot.classList.contains('splitPea') ? 'splitPea' : null;
                     
        if (plant && !PLANTS.types[plant].isRecharging) {
            const prevSelected = selectedPlants.querySelector('.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
                document.body.classList.remove('shovel-cursor');
            }
            
            slot.classList.add('selected');
            gameState.currentSelection = plant;
            
            if (plant === 'shovel') {
                document.body.classList.add('shovel-cursor');
            }
        }
    });
});