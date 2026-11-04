import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mold, Customer, FillingType, ServingPlate, MoldState, CustomerOrder, Upgrades, UpgradeType, DailySpecial } from './types';
import Header from './Header';
import BungeoppangGrill from './BungeoppangGrill';
import ControlPanel from './ControlPanel';
import CustomerQueue from './CustomerQueue';
import FillingSelectionModal from './FillingSelectionModal';
import { CUSTOMER_SPAWN_MIN_MS, CUSTOMER_SPAWN_MAX_MS, MAX_CUSTOMERS, ICONS, CUSTOMER_ICONS, BURN_TIME_MS, UPGRADE_CONFIG } from './constants';
import GoldenBungeoppangMiniGame from './GoldenBungeoppangMiniGame';

interface GameScreenProps {
    day: number;
    goal: number;
    initialTime: number;
    onDayEnd: (stats: { 
        revenue: number; 
        bunsSold: number;
        avgPatience: number;
        mostPopularFilling: FillingType | null;
        fillingsSold: Partial<Record<FillingType, number>>;
    }) => void;
    moldCount: number;
    cookTime: number;
    patienceTime: number;
    upgrades: Upgrades;
    pricePerBun: number;
    dailySpecial: DailySpecial | null;
}

type ServedParticle = {
    id: number;
    filling: FillingType;
    style: React.CSSProperties;
};

type TipParticle = {
  id: number;
  amount: number;
  style: React.CSSProperties;
};

const GameScreen: React.FC<GameScreenProps> = ({ day, goal, initialTime, onDayEnd, moldCount, cookTime, patienceTime, upgrades, pricePerBun, dailySpecial }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [revenue, setRevenue] = useState(0);
    const revenueRef = useRef(revenue);
    revenueRef.current = revenue;

    const [molds, setMolds] = useState<Mold[]>(
        Array.from({ length: moldCount }, (_, i) => ({ id: i, state: MoldState.EMPTY, filling: null, progress: 0 }))
    );
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [servingPlate, setServingPlate] = useState<ServingPlate>({ 
        [FillingType.RED_BEAN]: 0, 
        [FillingType.CHOUX_CREAM]: 0,
        [FillingType.PIZZA]: 0,
        [FillingType.SWEET_POTATO]: 0,
        [FillingType.CHOCOLATE]: 0,
        [FillingType.STRAWBERRY]: 0,
        [FillingType.BLUEBERRY]: 0,
        [FillingType.HONEY]: 0,
    });
    const [servedParticles, setServedParticles] = useState<ServedParticle[]>([]);
    const [tipParticles, setTipParticles] = useState<TipParticle[]>([]);
    const [fillingTarget, setFillingTarget] = useState<number | null>(null);
    const [isServing, setIsServing] = useState(false);
    const [isMiniGameActive, setIsMiniGameActive] = useState(false);
    const [challengerIcon, setChallengerIcon] = useState<string>('👑');
    
    const allTimeoutsRef = useRef<number[]>([]);
    const dayStatsRef = useRef({
        bunsSold: 0,
        servedCustomerCount: 0,
        totalPatienceRatioSum: 0,
        fillingsSold: {} as Partial<Record<FillingType, number>>,
    });

    const gameLoopId = useRef<number>();
    const lastFrameTimeRef = useRef(0);
    const nextCustomerSpawnTimeRef = useRef(0);
    
    useEffect(() => {
        const timeouts = allTimeoutsRef.current;
        return () => {
            timeouts.forEach(window.clearTimeout);
        };
    }, []);

    const startCooking = useCallback((id: number, filling: FillingType) => {
        setMolds(prevMolds => prevMolds.map(m =>
            m.id === id ? { ...m, state: MoldState.COOKING, filling, progress: cookTime } : m
        ));
        
        const readyTimeout = window.setTimeout(() => {
            setMolds(prevMolds => prevMolds.map(m => 
                m.id === id && m.state === MoldState.COOKING ? { ...m, state: MoldState.READY, progress: BURN_TIME_MS } : m
            ));

            const burntTimeout = window.setTimeout(() => {
                setMolds(prevMolds => prevMolds.map(m =>
                    m.id === id && m.state === MoldState.READY ? { ...m, state: MoldState.BURNT, progress: 0 } : m
                ));
            }, BURN_TIME_MS);
            allTimeoutsRef.current.push(burntTimeout);

        }, cookTime);
        allTimeoutsRef.current.push(readyTimeout);
    }, [cookTime]);

    // Main day timer
    useEffect(() => {
        if (isMiniGameActive || typeof window === 'undefined') return;

        const timer = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    
                    const finalStats = dayStatsRef.current;
                    const avgPatience = finalStats.servedCustomerCount > 0 
                        ? (finalStats.totalPatienceRatioSum / finalStats.servedCustomerCount) * 100 
                        : 0;
                    
                    const fillingsSoldEntries = Object.entries(finalStats.fillingsSold) as [FillingType, number][];
                    const mostPopularFilling = fillingsSoldEntries.length > 0
                        ? fillingsSoldEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
                        : null;

                    onDayEnd({
                        revenue: revenueRef.current,
                        bunsSold: finalStats.bunsSold,
                        avgPatience: Math.round(avgPatience),
                        mostPopularFilling,
                        fillingsSold: finalStats.fillingsSold
                    });

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isMiniGameActive, onDayEnd]);

    const runGameLoop = useCallback((timestamp: number) => {
        const deltaTime = timestamp - lastFrameTimeRef.current;
        lastFrameTimeRef.current = timestamp;

        if (isMiniGameActive || fillingTarget !== null) {
            gameLoopId.current = requestAnimationFrame(runGameLoop);
            return;
        }

        setMolds(prev => prev.map(m => ({ ...m, progress: Math.max(0, m.progress - deltaTime) })));
        setCustomers(prev => prev.map(c => ({ ...c, patience: Math.max(0, c.patience - deltaTime) })));
        
        if (timestamp >= nextCustomerSpawnTimeRef.current) {
            nextCustomerSpawnTimeRef.current = timestamp + Math.random() * (CUSTOMER_SPAWN_MAX_MS - CUSTOMER_SPAWN_MIN_MS) + CUSTOMER_SPAWN_MIN_MS;
            
            setCustomers(prevCustomers => {
                if (prevCustomers.length >= MAX_CUSTOMERS) {
                    return prevCustomers;
                }
                const fillings = Object.values(FillingType);
                const order: CustomerOrder = {};
                const totalItems = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < totalItems; i++) {
                    const randomFilling = fillings[Math.floor(Math.random() * fillings.length)];
                    order[randomFilling] = (order[randomFilling] || 0) + 1;
                }
                const randomIcon = CUSTOMER_ICONS[Math.floor(Math.random() * CUSTOMER_ICONS.length)];
                const newCustomer: Customer = { id: Date.now(), order, patience: patienceTime, maxPatience: patienceTime, icon: randomIcon };
                return [...prevCustomers, newCustomer];
            });
        }

        gameLoopId.current = requestAnimationFrame(runGameLoop);
    }, [isMiniGameActive, fillingTarget, patienceTime]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        lastFrameTimeRef.current = performance.now();
        nextCustomerSpawnTimeRef.current = performance.now() + CUSTOMER_SPAWN_MIN_MS;
        gameLoopId.current = requestAnimationFrame(runGameLoop);

        return () => {
            if (gameLoopId.current) {
                cancelAnimationFrame(gameLoopId.current);
            }
        };
    }, [runGameLoop]);

    // Mini-game trigger
    useEffect(() => {
        if (isMiniGameActive || typeof window === 'undefined') return;
        const miniGameCheckInterval = window.setInterval(() => {
            if (timeLeft < 20 || customers.length < 1) return;
            if (Math.random() < 0.015) {
                setChallengerIcon('👑');
                setIsMiniGameActive(true);
            }
        }, 1000);
        return () => window.clearInterval(miniGameCheckInterval);
    }, [isMiniGameActive, timeLeft, customers.length]);
    
    // Automatic serving logic
    useEffect(() => {
        if (isServing || timeLeft <= 0 || isMiniGameActive || typeof window === 'undefined') return;

        const customerToServe = customers.find(customer => {
            if (customer.patience <= 0) return false;
            const order = customer.order;
            return Object.entries(order).every(([filling, required]) => 
                servingPlate[filling as FillingType] >= (required || 0)
            );
        });

        if (customerToServe) {
            setIsServing(true);
            
            // FIX: Use bracket notation to access UPGRADE_CONFIG with an enum key
            const servingTime = UPGRADE_CONFIG[UpgradeType.FASTER_SERVING].levels[upgrades[UpgradeType.FASTER_SERVING]].value;
            const animationDurations = [1.0, 0.8, 0.6, 0.4, 0.25];
            const flyOutDuration = animationDurations[upgrades[UpgradeType.FASTER_SERVING]];
            
            const serveTimeout = window.setTimeout(() => {
                const order = customerToServe.order;
                let totalItems = 0;
                for (const qty of Object.values(order)) {
                    if (typeof qty === 'number') totalItems += qty;
                }

                setCustomers(prevCustomers => {
                    const customer = prevCustomers.find(c => c.id === customerToServe.id);
                    if (!customer) {
                        setIsServing(false);
                        return prevCustomers;
                    }

                    dayStatsRef.current.bunsSold += totalItems;
                    dayStatsRef.current.servedCustomerCount += 1;
                    dayStatsRef.current.totalPatienceRatioSum += customer.patience / customer.maxPatience;
                    Object.entries(customer.order).forEach(([filling, quantity]) => {
                        if (quantity) {
                            const ft = filling as FillingType;
                            dayStatsRef.current.fillingsSold[ft] = (dayStatsRef.current.fillingsSold[ft] || 0) + quantity;
                        }
                    });

                    const earnings = totalItems * pricePerBun;
                    let tip = 0;
                    const patienceRatio = customer.patience / customer.maxPatience;
                    if (patienceRatio > 0.8) tip = Math.floor(earnings * 0.2);
                    else if (patienceRatio > 0.5) tip = Math.floor(earnings * 0.1);

                    if (tip > 0) {
                        const id = Date.now() + Math.random();
                        setTipParticles(prev => [...prev, { id, amount: tip, style: { top: `${Math.random() * 20 + 40}%`, left: `${Math.random() * 15 + 5}%` } }]);
                        const tipTimeout = window.setTimeout(() => setTipParticles(prev => prev.filter(p => p.id !== id)), 1400);
                        allTimeoutsRef.current.push(tipTimeout);
                    }
                    
                    setRevenue(prev => prev + earnings + tip);

                    setServingPlate(prevPlate => {
                        const newPlate = { ...prevPlate };
                        for (const key in order) {
                            const filling = key as FillingType;
                            newPlate[filling] -= (order[filling] || 0);
                        }
                        return newPlate;
                    });
                    
                    const newParticles: ServedParticle[] = [];
                    Object.entries(order).forEach(([filling, quantity]) => {
                        for (let i = 0; i < Number(quantity || 0); i++) {
                            const id = Date.now() + Math.random();
                            newParticles.push({
                                id,
                                filling: filling as FillingType,
                                style: {
                                    left: `${Math.random() * 50 + 25}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: `${flyOutDuration}s`,
                                }
                            });
                            const removalDelay = (flyOutDuration * 1000) + (i * 100) + 50;
                            const particleTimeout = window.setTimeout(() => setServedParticles(prev => prev.filter(p => p.id !== id)), removalDelay);
                            allTimeoutsRef.current.push(particleTimeout);
                        }
                    });
                    setServedParticles(prev => [...prev, ...newParticles]);

                    setIsServing(false);
                    return prevCustomers.filter(c => c.id !== customerToServe.id);
                });

            }, servingTime);
            allTimeoutsRef.current.push(serveTimeout);
        }
    }, [servingPlate, customers, pricePerBun, upgrades, isServing, timeLeft, isMiniGameActive]);
    
     useEffect(() => {
        const updatedCustomers = customers.filter(c => c.patience > 0);
        if(updatedCustomers.length < customers.length) {
            setCustomers(updatedCustomers);
        }
    }, [customers]);

    const handleFillingSelection = (filling: FillingType) => {
        if (fillingTarget === null) return;
        startCooking(fillingTarget, filling);
        setFillingTarget(null);
    };

    const handleCleanAllMolds = useCallback(() => {
        setMolds(prevMolds => 
            prevMolds.map(m => ({
                ...m,
                state: MoldState.EMPTY,
                filling: null,
                progress: 0,
            }))
        );
    }, []);

    const handleMiniGameComplete = (success: boolean) => {
        if (success) {
            const reward = 5000;
            setRevenue(prev => prev + reward);
            const id = Date.now();
            setTipParticles(prev => [...prev, { id, amount: reward, style: { top: '50%', left: '45%' } }]);
            const tipTimeout = window.setTimeout(() => setTipParticles(prev => prev.filter(p => p.id !== id)), 1400);
            allTimeoutsRef.current.push(tipTimeout);
        }
        setIsMiniGameActive(false);
    };

    return (
        <div className="flex flex-col h-full bg-amber-50 rounded-lg p-2 sm:p-4 gap-2 sm:gap-4 relative">
            <Header day={day} timeLeft={timeLeft} revenue={revenue} goal={goal} dailySpecial={dailySpecial} />
            <div className="flex-grow flex flex-col lg:flex-row gap-4 overflow-hidden">
                <div className="w-full lg:w-1/4 h-48 lg:h-full flex-shrink-0">
                    <CustomerQueue customers={customers} upgrades={upgrades}/>
                </div>
                <div className="w-full lg:w-3/4 flex-grow flex flex-col gap-4 relative">
                    <BungeoppangGrill 
                        molds={molds} 
                        setMolds={setMolds} 
                        addTimeout={(id) => allTimeoutsRef.current.push(id)} 
                        setServingPlate={setServingPlate} 
                        setFillingTarget={setFillingTarget}
                        cookTime={cookTime}
                        upgrades={upgrades}
                        fillingTarget={fillingTarget}
                    />
                    <ControlPanel 
                        servingPlate={servingPlate} 
                        upgrades={upgrades} 
                        onCleanAllMolds={handleCleanAllMolds}
                    />
                    
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {servedParticles.map(particle => {
                            const FillingIcon = ICONS[particle.filling];
                            return (
                                <div key={particle.id} className="serve-particle" style={particle.style}>
                                    <div className="w-full h-full text-amber-700 relative">
                                        <ICONS.BUNGEOPPANG crustLevel={upgrades.BUNGEOPPANG_CRUST} decorationLevel={upgrades.BUNGEOPPANG_DECORATION} />
                                        <div className="absolute inset-0 flex items-center justify-center scale-50">
                                            <FillingIcon />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="absolute inset-0 pointer-events-none z-20">
                {tipParticles.map(particle => (
                    <div key={particle.id} className="tip-particle" style={particle.style}>
                        <span>💰</span>
                        <span>+₩{particle.amount}</span>
                    </div>
                ))}
            </div>

            <FillingSelectionModal 
                isOpen={fillingTarget !== null}
                onSelect={handleFillingSelection}
                onClose={() => setFillingTarget(null)}
            />
            
            {isMiniGameActive && (
                <GoldenBungeoppangMiniGame 
                    challengerIcon={challengerIcon}
                    onComplete={handleMiniGameComplete}
                />
            )}
        </div>
    );
};

export default GameScreen;