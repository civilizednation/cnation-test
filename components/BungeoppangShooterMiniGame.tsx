import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICONS } from '../constants';

// Component props
interface BungeoppangShooterMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

// Base game constants for scaling
const BASE_GAME_WIDTH = 500;
const BASE_GAME_HEIGHT = 600;
const BASE_PLAYER_WIDTH = 50;
const BASE_PLAYER_HEIGHT = 50;
const BASE_PLAYER_SPEED = 8;
const BASE_PROJECTILE_WIDTH = 10;
const BASE_PROJECTILE_HEIGHT = 20;
const BASE_PROJECTILE_SPEED = 12;
const BASE_ENEMY_PROJECTILE_SPEED = 4;
const BASE_ENEMY_PROJECTILE_SIZE = 12;
const BASE_ENEMY_WIDTH = 40;
const BASE_ENEMY_HEIGHT = 40;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const INITIAL_LIVES = 3;
const BONUS_PER_SCORE = 25;
const SHOOT_COOLDOWN = 250; // ms

// Type definitions
type GameObject = { id: number; x: number; y: number; };
type EnemyType = 'burnt' | 'choux_cream' | 'pizza';
type Enemy = GameObject & { 
    type: EnemyType; 
    shootCooldown?: number;
    dashState?: { active: boolean; targetX: number; cooldown: number; };
};
type EnemyProjectile = GameObject;

// FIX: Changed ENEMY_CONFIG to store component factories (functions returning JSX) instead of static ReactElements.
// This ensures a new element is created for each enemy, preventing rendering bugs and improving performance.
const ENEMY_CONFIG: Record<EnemyType, { speed: number; score: number; icon: React.FC }> = {
    burnt: { speed: 0.5, score: 10, icon: () => <ICONS.BUNGEOPPANG crustLevel={3} decorationLevel={0} /> },
    choux_cream: { speed: 0.8, score: 20, icon: () => <ICONS.CHOUX_CREAM /> },
    pizza: { speed: 0.3, score: 30, icon: () => <ICONS.PIZZA /> },
};

const BungeoppangShooterMiniGame: React.FC<BungeoppangShooterMiniGameProps> = ({ onGameEnd }) => {
    const [player, setPlayer] = useState({ x: BASE_GAME_WIDTH / 2 - BASE_PLAYER_WIDTH / 2 });
    const [projectiles, setProjectiles] = useState<GameObject[]>([]);
    const [enemyProjectiles, setEnemyProjectiles] = useState<EnemyProjectile[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [explosions, setExplosions] = useState<GameObject[]>([]);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
    const [scale, setScale] = useState(1);
    
    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const lastShotTime = useRef<number>(0);
    const shootRequested = useRef<boolean>(false);
    const gameLoopRef = useRef<() => void>();
    const gameContainerRef = useRef<HTMLDivElement>(null);

    // Scaling effect
    useEffect(() => {
        const handleResize = () => {
            if (gameContainerRef.current) {
                const { width, height } = gameContainerRef.current.getBoundingClientRect();
                const scaleX = width / BASE_GAME_WIDTH;
                const scaleY = height / BASE_GAME_HEIGHT;
                setScale(Math.min(scaleX, scaleY));
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize enemies
    useEffect(() => {
        const initialEnemies: Enemy[] = [];
        for (let row = 0; row < ENEMY_ROWS; row++) {
            for (let col = 0; col < ENEMY_COLS; col++) {
                const rand = Math.random();
                let type: EnemyType;
                if (rand < 0.15) {
                    type = 'pizza';
                } else if (rand < 0.4) {
                    type = 'choux_cream';
                } else {
                    type = 'burnt';
                }
                
                const enemy: Enemy = {
                    id: Date.now() + row * ENEMY_COLS + col,
                    x: col * (BASE_ENEMY_WIDTH + 15) + 30,
                    y: row * (BASE_ENEMY_HEIGHT + 15) + 50,
                    type: type,
                };

                if (type === 'pizza') {
                    enemy.shootCooldown = 2000 + Math.random() * 3000;
                }
                if (type === 'choux_cream') {
                    enemy.dashState = { active: false, targetX: 0, cooldown: 3000 + Math.random() * 4000 };
                }

                initialEnemies.push(enemy);
            }
        }
        setEnemies(initialEnemies);
    }, []);

    const handleManualShoot = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
        if (e) e.preventDefault();
        if (gameState === 'playing') {
            shootRequested.current = true;
        }
    }, [gameState]);

    const handleMoveStart = useCallback((direction: 'left' | 'right') => {
        if (gameState === 'playing') {
            keysPressed.current[direction === 'left' ? 'ArrowLeft' : 'ArrowRight'] = true;
        }
    }, [gameState]);

    const handleMoveEnd = useCallback(() => {
        keysPressed.current['ArrowLeft'] = false;
        keysPressed.current['ArrowRight'] = false;
    }, []);

    // Game loop logic
    const gameLoop = useCallback(() => {
        // --- Player Movement ---
        let newPlayerX = player.x;
        if (keysPressed.current['ArrowLeft']) newPlayerX -= BASE_PLAYER_SPEED;
        if (keysPressed.current['ArrowRight']) newPlayerX += BASE_PLAYER_SPEED;
        newPlayerX = Math.max(0, Math.min(BASE_GAME_WIDTH - BASE_PLAYER_WIDTH, newPlayerX));
        const finalPlayerX = newPlayerX;
        setPlayer({ x: finalPlayerX });
        
        // --- Update Projectiles (Movement & New Shots) ---
        let newProjectiles = projectiles
            .map(p => ({ ...p, y: p.y - BASE_PROJECTILE_SPEED }))
            .filter(p => p.y > 0);

        if (keysPressed.current[' '] || keysPressed.current['Spacebar'] || shootRequested.current) {
            shootRequested.current = false;
            const now = Date.now();
            if (now - lastShotTime.current > SHOOT_COOLDOWN) {
                lastShotTime.current = now;
                newProjectiles.push({
                    id: now,
                    x: finalPlayerX + BASE_PLAYER_WIDTH / 2 - BASE_PROJECTILE_WIDTH / 2,
                    y: BASE_GAME_HEIGHT - BASE_PLAYER_HEIGHT,
                });
            }
        }

        // --- Update Enemy Projectiles ---
        let newEnemyProjectiles = enemyProjectiles
            .map(p => ({ ...p, y: p.y + BASE_ENEMY_PROJECTILE_SPEED }))
            .filter(p => p.y < BASE_GAME_HEIGHT);

        // --- Update Enemy Positions and behavior ---
        let enemiesToUpdate = [...enemies];
        const spawnedEnemyProjectiles: EnemyProjectile[] = [];
        const now = Date.now();

        enemiesToUpdate = enemiesToUpdate.map(e => {
            const config = ENEMY_CONFIG[e.type];
            let newEnemy = { ...e };
            
            newEnemy.y += config.speed;
            newEnemy.x += Math.sin(newEnemy.y / 50 + e.id) * 0.5; 
            newEnemy.x += (Math.sin(now / 1500 + e.id / 5) * 0.2); 
            
            switch(e.type) {
                case 'choux_cream':
                    if (e.dashState) {
                        e.dashState.cooldown -= 16;
                        if (e.dashState.cooldown <= 0 && !e.dashState.active) {
                            e.dashState.active = true;
                            e.dashState.targetX = player.x;
                        }
                        if (e.dashState.active) {
                            const dx = e.dashState.targetX - e.x;
                            newEnemy.x += Math.sign(dx) * BASE_PLAYER_SPEED * 0.5;
                            newEnemy.y += BASE_PLAYER_SPEED * 0.3;
                            if (Math.abs(dx) < 10 || e.y > BASE_GAME_HEIGHT) {
                                e.dashState.active = false;
                                e.dashState.cooldown = 4000 + Math.random() * 3000;
                            }
                        }
                    }
                    break;
                case 'pizza':
                    if (e.shootCooldown) {
                        e.shootCooldown -= 16;
                        if (e.shootCooldown <= 0) {
                            spawnedEnemyProjectiles.push({
                                id: Date.now() + Math.random(),
                                x: e.x + BASE_ENEMY_WIDTH / 2 - BASE_ENEMY_PROJECTILE_SIZE / 2,
                                y: e.y + BASE_ENEMY_HEIGHT
                            });
                            e.shootCooldown = 3000 + Math.random() * 2000;
                        }
                    }
                    break;
            }
            return newEnemy;
        });
        
        if (spawnedEnemyProjectiles.length > 0) {
            newEnemyProjectiles.push(...spawnedEnemyProjectiles);
        }

        // --- Collision Detection & State Update ---
        let hitEnemies = new Set<number>();
        let newScore = score;
        let explosionsToAdd: GameObject[] = [];

        // 1. Player projectiles vs enemies
        for (const p of newProjectiles) {
            for (const e of enemiesToUpdate) {
                if (hitEnemies.has(e.id)) continue;
                if (p.x < e.x + BASE_ENEMY_WIDTH && p.x + BASE_PROJECTILE_WIDTH > e.x && p.y < e.y + BASE_ENEMY_HEIGHT && p.y + BASE_PROJECTILE_HEIGHT > e.y) {
                    hitEnemies.add(e.id);
                    p.y = -100; // Mark projectile for removal
                    newScore += ENEMY_CONFIG[e.type].score;
                    explosionsToAdd.push({ id: e.id, x: e.x, y: e.y });
                }
            }
        }

        if (hitEnemies.size > 0) {
            setScore(newScore);
            newProjectiles = newProjectiles.filter(p => p.y > -50);
            setExplosions(exps => [...exps, ...explosionsToAdd]);
            window.setTimeout(() => {
                setExplosions(exps => exps.filter(exp => !explosionsToAdd.some(e => e.id === exp.id)));
            }, 400);
        }
        
        let livesLostThisFrame = 0;

        newEnemyProjectiles = newEnemyProjectiles.filter(ep => {
            if (ep.x < finalPlayerX + BASE_PLAYER_WIDTH && ep.x + BASE_ENEMY_PROJECTILE_SIZE > finalPlayerX && ep.y < BASE_GAME_HEIGHT && ep.y + BASE_ENEMY_PROJECTILE_SIZE > BASE_GAME_HEIGHT - BASE_PLAYER_HEIGHT) {
                livesLostThisFrame++;
                return false;
            }
            return true;
        });
        
        const enemiesToRemove = new Set<number>();
        for (const e of enemiesToUpdate) {
            if (hitEnemies.has(e.id)) continue;
            if (e.y + BASE_ENEMY_HEIGHT >= BASE_GAME_HEIGHT) {
                livesLostThisFrame++;
                enemiesToRemove.add(e.id);
            }
        }
        
        if (livesLostThisFrame > 0) {
            const newLives = lives - livesLostThisFrame;
            setLives(Math.max(0, newLives));
            
            if (newLives <= 0) {
                setGameState('lost');
                return;
            }
        }
        
        const remainingEnemies = enemiesToUpdate.filter(e => !hitEnemies.has(e.id) && !enemiesToRemove.has(e.id));
        setEnemies(remainingEnemies);
        setProjectiles(newProjectiles);
        setEnemyProjectiles(newEnemyProjectiles);
        
        if (remainingEnemies.length === 0 && enemies.length > 0) {
            setGameState('won');
        }
    }, [gameState, player, projectiles, enemyProjectiles, enemies, score, lives]);

    useEffect(() => {
        gameLoopRef.current = gameLoop;
    });

    useEffect(() => {
        if (gameState !== 'playing') return;
        let animationFrameId: number;
        const loop = () => {
            gameLoopRef.current?.();
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);
    
    // FIX: Updated EnemyIcon to render the component from the config correctly.
    const EnemyIcon: React.FC<{type: EnemyType}> = ({ type }) => {
        const IconComponent = ENEMY_CONFIG[type].icon;
        return <div className="w-full h-full" style={{ filter: 'brightness(0.7) sepia(0.3)' }}><IconComponent /></div>;
    };
    // FIX: Wrapped memoized icon component in a new component to prevent potential "Expected 1 arguments, but got 0" error.
    const PlayerIcon: React.FC<{crustLevel?: number, decorationLevel?: number}> = (props) => <ICONS.BUNGEOPPANG {...props} />;
    // FIX: Wrapped memoized icon component in a new component to prevent potential "Expected 1 arguments, but got 0" error.
    const ProjectileIcon: React.FC = (props) => <ICONS.CHOUX_CREAM {...props} />;

    const bonus = score * BONUS_PER_SCORE;

    return (
        <div className="bg-slate-800 h-full w-full p-2 sm:p-4 rounded-lg flex flex-col items-center justify-center relative text-center">
            <div className="flex-shrink-0 w-full max-w-xl flex justify-between items-center mb-2 text-white">
                <h2 className="text-xl font-bold">붕어빵 슈팅</h2>
                <div className="font-bold">점수: {score}</div>
                <div className="font-bold">목숨: {'❤️'.repeat(Math.max(0, lives))}</div>
            </div>

            <div ref={gameContainerRef} className="w-full flex-grow relative flex items-center justify-center">
                <div
                    className="relative bg-slate-900 overflow-hidden border-2 border-slate-700"
                    style={{
                        width: BASE_GAME_WIDTH,
                        height: BASE_GAME_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Player */}
                    <div
                        className="absolute text-amber-300"
                        style={{ left: player.x, bottom: 0, width: BASE_PLAYER_WIDTH, height: BASE_PLAYER_HEIGHT, touchAction: 'none' }}
                        onClick={handleManualShoot}
                        onTouchStart={handleManualShoot}
                    >
                        <PlayerIcon crustLevel={1} />
                    </div>
                    
                    {/* Player Projectiles */}
                    {projectiles.map(p => (
                        <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, width: BASE_PROJECTILE_WIDTH, height: BASE_PROJECTILE_HEIGHT, transform: 'rotate(90deg)' }}>
                            <ProjectileIcon />
                        </div>
                    ))}

                    {/* Enemy Projectiles */}
                    {enemyProjectiles.map(ep => (
                        <div key={ep.id} className="absolute bg-red-500 rounded-full border-2 border-red-300" style={{ left: ep.x, top: ep.y, width: BASE_ENEMY_PROJECTILE_SIZE, height: BASE_ENEMY_PROJECTILE_SIZE }}></div>
                    ))}
                    
                    {/* Enemies */}
                    {enemies.map(e => (
                        <div key={e.id} className="absolute" style={{ left: e.x, top: e.y, width: BASE_ENEMY_WIDTH, height: BASE_ENEMY_HEIGHT }}>
                            <EnemyIcon type={e.type} />
                        </div>
                    ))}
                    
                    {/* Explosions */}
                    {explosions.map(exp => (
                        <div key={exp.id} className="explosion" style={{ left: exp.x, top: exp.y, width: BASE_ENEMY_WIDTH, height: BASE_ENEMY_HEIGHT }}></div>
                    ))}

                    {/* Game Overlays */}
                    {gameState !== 'playing' && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 z-10">
                            {gameState === 'intro' && (
                                <>
                                    <h3 className="text-4xl font-bold mb-4">준비!</h3>
                                    <p className="text-lg mb-6">방향키로 움직이고, 스페이스바나 발사 버튼으로 공격하세요!</p>
                                    <button
                                        onClick={() => setGameState('playing')}
                                        className="px-8 py-3 text-xl font-bold text-white bg-green-500 rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all"
                                    >
                                        게임 시작
                                    </button>
                                </>
                            )}
                            {(gameState === 'won' || gameState === 'lost') && (
                                <>
                                    <h3 className="text-5xl font-bold mb-4">{gameState === 'won' ? '🎉 승리! 🎉' : '😭 게임 오버 😭'}</h3>
                                    <p className="text-xl mb-6">
                                        {bonus > 0 ? `보너스 ₩${bonus.toLocaleString()} 획득!` : '아쉽지만 보너스는 없습니다.'}
                                    </p>
                                    <button
                                        onClick={() => onGameEnd(bonus)}
                                        className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
                                    >
                                        가게로 돌아가기
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 w-full max-w-md mt-2 flex justify-between items-center gap-2 select-none">
                <button
                    className="w-1/3 h-16 bg-slate-500 text-white font-bold text-3xl rounded-lg shadow-md active:bg-slate-600 active:scale-95 transition-all"
                    onMouseDown={() => handleMoveStart('left')}
                    onMouseUp={handleMoveEnd}
                    onTouchStart={(e) => { e.preventDefault(); handleMoveStart('left'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleMoveEnd(); }}
                    onMouseLeave={handleMoveEnd}
                >
                    ◀
                </button>
                <button
                    className="w-1/3 h-20 bg-red-500 text-white font-bold text-2xl rounded-full shadow-lg active:bg-red-600 active:scale-95 transition-all flex flex-col items-center justify-center"
                    onMouseDown={handleManualShoot}
                    onTouchStart={handleManualShoot}
                >
                    <span>발사</span>
                    <span className="text-xs opacity-80">(Space)</span>
                </button>
                <button
                    className="w-1/3 h-16 bg-slate-500 text-white font-bold text-3xl rounded-lg shadow-md active:bg-slate-600 active:scale-95 transition-all"
                    onMouseDown={() => handleMoveStart('right')}
                    onMouseUp={handleMoveEnd}
                    onTouchStart={(e) => { e.preventDefault(); handleMoveStart('right'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleMoveEnd(); }}
                    onMouseLeave={handleMoveEnd}
                >
                    ▶
                </button>
            </div>
        </div>
    );
};

export default BungeoppangShooterMiniGame;
