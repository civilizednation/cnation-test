import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UpgradeType, Upgrades, DailySpecial } from '../types';
import { UPGRADE_CONFIG, LEVEL_CONFIG, BASE_PRICE_PER_BUN } from '../constants';
import TutorialModal from './TutorialModal';
import RecipeBookModal from './RecipeBookModal';
import UpgradeModal from './UpgradeModal';
import StartScreenAnimation from './StartScreenAnimation';
import DailySpecialModal from './DailySpecialModal';

interface StartScreenProps {
    onStart: (config: { time: number; goal: number; pricePerBun: number }) => void;
    day: number;
    totalRevenue: number;
    upgrades: Upgrades;
    onPurchaseUpgrade: (upgradeType: UpgradeType) => void;
    onReset: () => void;
    lastConfig: { time: number; goal: number } | null;
    dailySpecial: DailySpecial | null;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, day, totalRevenue, upgrades, onPurchaseUpgrade, onReset, dailySpecial }) => {
    const [dayDuration, setDayDuration] = useState(90);
    const [priceModifier, setPriceModifier] = useState(1.0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showRecipeBook, setShowRecipeBook] = useState(false);
    const [showUpgrades, setShowUpgrades] = useState(false);
    const [showSpecialModal, setShowSpecialModal] = useState(false);

    // Show tutorial on first visit
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('bungeoppangJangsaTutorialSeen');
        if (!hasSeenTutorial) {
            setShowTutorial(true);
            localStorage.setItem('bungeoppangJangsaTutorialSeen', 'true');
        }
    }, []);
    
    // Show daily special modal on new day
    useEffect(() => {
        if (dailySpecial) {
             const hasSeenKey = `dailySpecialSeen_day${day}`;
             if (!sessionStorage.getItem(hasSeenKey)) {
                const timer = window.setTimeout(() => {
                    setShowSpecialModal(true);
                    sessionStorage.setItem(hasSeenKey, 'true');
                }, 500);
                return () => window.clearTimeout(timer);
             }
        }
    }, [dailySpecial, day]);


    const levelConfig = useMemo(() => {
        if (day > LEVEL_CONFIG.length) {
            const lastLevel = LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
            return {
                day: day,
                goal: Math.floor(lastLevel.goal * Math.pow(1.2, day - LEVEL_CONFIG.length)),
            };
        }
        return LEVEL_CONFIG[day - 1];
    }, [day]);

    const handleStart = useCallback(() => {
        onStart({ time: dayDuration, goal: levelConfig.goal, pricePerBun: BASE_PRICE_PER_BUN * priceModifier });
    }, [onStart, dayDuration, levelConfig, priceModifier]);
    
    const priceModifierPercent = useMemo(() => Math.round((priceModifier - 1) * 100), [priceModifier]);

    return (
        <div className="flex flex-col h-full bg-amber-50 rounded-lg p-4 sm:p-8 overflow-y-auto">
            {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
            {showRecipeBook && <RecipeBookModal onClose={() => setShowRecipeBook(false)} />}
            {showSpecialModal && dailySpecial && <DailySpecialModal special={dailySpecial} onClose={() => setShowSpecialModal(false)} />}
            {showUpgrades && (
                <UpgradeModal
                    totalRevenue={totalRevenue}
                    upgrades={upgrades}
                    onPurchaseUpgrade={onPurchaseUpgrade}
                    onClose={() => setShowUpgrades(false)}
                    dailySpecial={dailySpecial}
                />
            )}
            
            <StartScreenAnimation upgrades={upgrades} />
            
            <header className="text-center z-10">
                <h1 className="text-5xl sm:text-7xl font-bold text-amber-800" style={{ textShadow: '3px 3px #f59e0b' }}>붕어빵 장사</h1>
                <p className="text-xl sm:text-2xl text-amber-700 mt-2">따끈따끈 붕어빵으로 부자가 되어보세요!</p>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center gap-8 mt-4 sm:mt-8 z-10">
                {/* Game Start Panel */}
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 border-amber-300 w-full max-w-md text-center flex flex-col">
                    <h2 className="text-3xl font-bold text-amber-800">Day {day}</h2>
                    <div className="text-lg text-stone-600 my-4 space-y-4">
                        <div>
                            <p className="font-semibold text-stone-700 mb-2">
                                게임 시간: <span className="text-amber-600 font-bold">{dayDuration}초</span>
                            </p>
                            <input
                                type="range"
                                min="30"
                                max="180"
                                step="15"
                                value={dayDuration}
                                onChange={(e) => setDayDuration(Number(e.target.value))}
                                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>
                         <div>
                            <p className="font-semibold text-stone-700 mb-2">
                                수익 배율 (가격): 
                                <span className={`font-bold ${
                                    priceModifier > 1.0 ? 'text-green-600' : 
                                    priceModifier < 1.0 ? 'text-red-600' : 'text-stone-700'
                                }`}>
                                    {priceModifier === 1.0 ? '보통' : `${priceModifierPercent > 0 ? '+' : ''}${priceModifierPercent}%`}
                                </span>
                            </p>
                             <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                value={priceModifier}
                                onChange={(e) => setPriceModifier(Number(e.target.value))}
                                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>
                    </div>
                    <div className="text-xl text-stone-600 mt-auto">
                        <p>오늘의 목표 수익: <span className="font-bold text-green-600">₩{levelConfig.goal.toLocaleString()}</span></p>
                    </div>
                    <button 
                        onClick={handleStart}
                        className="mt-6 px-10 py-4 text-2xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 ease-in-out border-4 border-orange-600"
                    >
                        장사 시작!
                    </button>
                </div>
            </main>

            <footer className="mt-auto pt-4 flex flex-col justify-center items-center gap-2 z-10">
                <div className="flex justify-center items-center gap-4 flex-wrap">
                    <button onClick={() => setShowUpgrades(true)} className="px-5 py-2 font-semibold text-green-800 bg-green-200 rounded-full hover:bg-green-300 transition-colors shadow">
                        가게 업그레이드
                    </button>
                    <button onClick={() => setShowRecipeBook(true)} className="px-5 py-2 font-semibold text-amber-800 bg-amber-200 rounded-full hover:bg-amber-300 transition-colors shadow">
                        붕어빵 도감
                    </button>
                    <button onClick={() => setShowTutorial(true)} className="px-5 py-2 font-semibold text-amber-800 bg-amber-200 rounded-full hover:bg-amber-300 transition-colors shadow">
                        게임 방법
                    </button>
                    <button onClick={onReset} className="px-5 py-2 font-semibold text-red-800 bg-red-200 rounded-full hover:bg-red-300 transition-colors shadow">
                        게임 초기화
                    </button>
                </div>
                <p className="text-xs text-stone-500 pt-2">
                    Copyright © lee d.c. ver 0.5
                </p>
            </footer>
        </div>
    );
};

export default StartScreen;