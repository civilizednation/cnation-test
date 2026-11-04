import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Import types from the newly fixed types.ts
import { GameState, UpgradeType, Upgrades, FillingType, DailySpecial } from './types';
import GameScreen from './components/GameScreen';
import StartScreen from './components/StartScreen';
import EndScreen from './components/EndScreen';
import BonusStageScreen from './components/BonusStageScreen';
import { UPGRADE_CONFIG, FILLING_DETAILS } from './constants';

const SAVE_KEY = 'bungeoppangJangsaSave';

export interface DayEndResult {
  revenue: number;
  goal: number;
  success: boolean;
  bunsSold: number;
  avgPatience: number;
  mostPopularFilling: FillingType | null;
  fillingsSold: Partial<Record<FillingType, number>>;
}

const pseudoRandom = (seed: number) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const generateDailySpecial = (day: number, currentUpgrades: Upgrades): DailySpecial | null => {
    const seed = day * 1234; // Simple seed
    
    // FIX: Use a type-safe way to iterate over enum keys to prevent type errors.
    const availableUpgrades = (Object.keys(UPGRADE_CONFIG) as Array<keyof typeof UPGRADE_CONFIG>).filter(upgradeType => {
        const currentLevel = currentUpgrades[upgradeType] || 0;
        return currentLevel < UPGRADE_CONFIG[upgradeType].levels.length - 1;
    });
    
    const allFillings = Object.values(FillingType);

    const rand = pseudoRandom(seed);
    
    // 50/50 chance for bonus or discount, if discounts are possible
    if (availableUpgrades.length > 0 && rand < 0.5) {
        // UPGRADE_DISCOUNT
        const targetUpgrade = availableUpgrades[Math.floor(pseudoRandom(seed + 1) * availableUpgrades.length)];
        const discountValue = 0.7; // 30% off
        return {
            type: 'UPGRADE_DISCOUNT',
            target: targetUpgrade,
            value: discountValue,
            description: `${UPGRADE_CONFIG[targetUpgrade].name} 30% 할인!`,
        };
    } else {
        // FILLING_BONUS
        const targetFilling = allFillings[Math.floor(pseudoRandom(seed + 2) * allFillings.length)];
        const bonusValue = 1.5; // 50% bonus revenue
        return {
            type: 'FILLING_BONUS',
            target: targetFilling,
            value: bonusValue,
            description: `${FILLING_DETAILS[targetFilling].label} 붕어빵 판매 시 수익 50% 보너스!`,
        };
    }
};


const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
    const [day, setDay] = useState(1);
    const [lastDayResult, setLastDayResult] = useState<DayEndResult | null>(null);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [gameConfig, setGameConfig] = useState<{ time: number; goal: number; pricePerBun: number; } | null>(null);
    const [dailySpecial, setDailySpecial] = useState<DailySpecial | null>(null);
    
    const [upgrades, setUpgrades] = useState<Upgrades>({
        [UpgradeType.MOLD_COUNT]: 0,
        [UpgradeType.COOK_SPEED]: 0,
        [UpgradeType.PATIENCE_TIME]: 0,
        [UpgradeType.BUNGEOPPANG_CRUST]: 0,
        [UpgradeType.BUNGEOPPANG_DECORATION]: 0,
        [UpgradeType.FASTER_SERVING]: 0,
        [UpgradeType.AUTO_BAKE]: 0,
        [UpgradeType.AUTO_SERVE]: 0,
    });

    // Load game state from localStorage on initial render
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                if (window.confirm("저장된 게임 데이터가 있습니다. 이어서 플레이하시겠습니까?\n(취소를 누르면 새 게임이 시작되며, 기존 데이터는 삭제됩니다.)")) {
                    const { day: savedDay, totalRevenue: savedTotalRevenue, upgrades: savedUpgrades } = JSON.parse(savedData);
                    if (typeof savedDay === 'number' && typeof savedTotalRevenue === 'number') {
                        setDay(savedDay);
                        setTotalRevenue(savedTotalRevenue);
                    }
                    if (savedUpgrades) {
                        // Merge saved upgrades with default to prevent crashes if new upgrades are added
                        setUpgrades(prev => ({...prev, ...savedUpgrades}));
                    }
                } else {
                    // User chose to start a new game, so delete the old save.
                    localStorage.removeItem(SAVE_KEY);
                    // Also clear session storage for seen specials to be consistent with reset
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.startsWith('dailySpecialSeen_day')) {
                            sessionStorage.removeItem(key);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load game data from localStorage:", error);
            localStorage.removeItem(SAVE_KEY);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save game state to localStorage whenever day, totalRevenue, or upgrades change
    useEffect(() => {
        try {
            const gameStateToSave = { day, totalRevenue, upgrades };
            localStorage.setItem(SAVE_KEY, JSON.stringify(gameStateToSave));
        } catch (error) {
            console.error("Failed to save game data to localStorage:", error);
        }
    }, [day, totalRevenue, upgrades]);

    // Generate daily special when day changes
    useEffect(() => {
        const special = generateDailySpecial(day, upgrades);
        setDailySpecial(special);
    }, [day, upgrades]);

    const handlePurchaseUpgrade = useCallback((upgradeType: UpgradeType) => {
        const currentLevel = upgrades[upgradeType] || 0;
        const config = UPGRADE_CONFIG[upgradeType];
        if (currentLevel < config.levels.length - 1) {
            const nextLevelConfig = config.levels[currentLevel + 1];

            let finalCost = nextLevelConfig.cost;
            if (dailySpecial?.type === 'UPGRADE_DISCOUNT' && dailySpecial.target === upgradeType) {
                finalCost = Math.floor(finalCost * dailySpecial.value);
            }

            if (totalRevenue >= finalCost) {
                setTotalRevenue(prev => prev - finalCost);
                setUpgrades(prev => ({
                    ...prev,
                    [upgradeType]: currentLevel + 1,
                }));
            }
        }
    }, [upgrades, totalRevenue, dailySpecial]);

    const handleStartGame = useCallback((config: { time: number; goal: number; pricePerBun: number; }) => {
        setGameConfig(config);
        setGameState(GameState.PLAYING);
    }, []);

    const handleDayEnd = useCallback((stats: { revenue: number; bunsSold: number; avgPatience: number; mostPopularFilling: FillingType | null; fillingsSold: Partial<Record<FillingType, number>>; }) => {
        if (!gameConfig) return;

        const goal = gameConfig.goal;
        const success = stats.revenue >= goal;

        setLastDayResult({ ...stats, goal, success });
        if (success) {
            setTotalRevenue(prev => prev + stats.revenue);
        }
        setGameState(GameState.DAY_END);
    }, [gameConfig]);
    
    const handleProceedFromDayEnd = useCallback(() => {
        if (lastDayResult?.success) {
            setGameState(GameState.BONUS_STAGE);
        } else {
            // If the day failed, go back to start screen to retry
            setGameConfig(null);
            setGameState(GameState.START_SCREEN);
        }
    }, [lastDayResult]);

    const handleBonusStageComplete = useCallback((bonusRevenue: number) => {
        if (bonusRevenue > 0) {
            setTotalRevenue(prev => prev + bonusRevenue);
        }
        
        // Only increment day if the previous day was a success
        if (lastDayResult?.success) {
            setDay(prev => prev + 1);
        }
        
        setGameConfig(null);
        setGameState(GameState.START_SCREEN);
    }, [lastDayResult]);

    const handleResetGame = useCallback(() => {
        if (window.confirm('정말로 게임을 초기화하시겠습니까? Day 기록, 총 수익, 업그레이드가 모두 초기화됩니다.')) {
            localStorage.removeItem(SAVE_KEY);
            // Also clear session storage for seen specials
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('dailySpecialSeen_day')) {
                    sessionStorage.removeItem(key);
                }
            });
            setDay(1);
            setTotalRevenue(0);
            setUpgrades({
                [UpgradeType.MOLD_COUNT]: 0,
                [UpgradeType.COOK_SPEED]: 0,
                [UpgradeType.PATIENCE_TIME]: 0,
                [UpgradeType.BUNGEOPPANG_CRUST]: 0,
                [UpgradeType.BUNGEOPPANG_DECORATION]: 0,
                [UpgradeType.FASTER_SERVING]: 0,
                [UpgradeType.AUTO_BAKE]: 0,
                [UpgradeType.AUTO_SERVE]: 0,
            });
            setLastDayResult(null);
            setGameConfig(null);
            setGameState(GameState.START_SCREEN);
        }
    }, []);

    const renderContent = () => {
        switch (gameState) {
            case GameState.START_SCREEN:
                return <StartScreen 
                            onStart={handleStartGame} 
                            day={day} 
                            lastConfig={gameConfig} 
                            onReset={handleResetGame}
                            totalRevenue={totalRevenue}
                            upgrades={upgrades}
                            onPurchaseUpgrade={handlePurchaseUpgrade}
                            dailySpecial={dailySpecial}
                        />;
            case GameState.PLAYING:
                if (!gameConfig) return null; // Should not happen in normal flow
                // FIX: Use bracket notation with enums to access config properties correctly.
                const effectiveMoldCount = UPGRADE_CONFIG[UpgradeType.MOLD_COUNT].levels[upgrades.MOLD_COUNT].value;
                const effectiveCookTime = UPGRADE_CONFIG[UpgradeType.COOK_SPEED].levels[upgrades.COOK_SPEED].value;
                const effectivePatienceTime = UPGRADE_CONFIG[UpgradeType.PATIENCE_TIME].levels[upgrades.PATIENCE_TIME].value;
                
                return <GameScreen 
                            day={day} 
                            goal={gameConfig.goal} 
                            initialTime={gameConfig.time} 
                            onDayEnd={handleDayEnd}
                            moldCount={effectiveMoldCount}
                            cookTime={effectiveCookTime}
                            patienceTime={effectivePatienceTime}
                            upgrades={upgrades}
                            pricePerBun={gameConfig.pricePerBun}
                            dailySpecial={dailySpecial}
                        />;
            case GameState.DAY_END:
                return lastDayResult && <EndScreen day={day} result={lastDayResult} onProceed={handleProceedFromDayEnd} totalRevenue={totalRevenue} />;
            case GameState.BONUS_STAGE:
                return <BonusStageScreen onComplete={handleBonusStageComplete} />;
            default:
                 return <StartScreen 
                            onStart={handleStartGame} 
                            day={day} 
                            lastConfig={gameConfig} 
                            onReset={handleResetGame}
                            totalRevenue={totalRevenue}
                            upgrades={upgrades}
                            onPurchaseUpgrade={handlePurchaseUpgrade}
                            dailySpecial={dailySpecial}
                        />;
        }
    };

    return (
        <main className="bg-amber-100 min-h-screen w-full flex items-stretch justify-center p-1 sm:p-4 antialiased">
            <div className="w-full max-w-7xl h-full sm:h-[90vh] sm:max-h-[800px] bg-white rounded-2xl shadow-2xl border-4 border-amber-300 flex flex-col">
                {renderContent()}
            </div>
        </main>
    );
};

export default App;
