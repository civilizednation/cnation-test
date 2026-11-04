import React, { useCallback } from 'react';
import { Mold, MoldState, ServingPlate, Upgrades } from '../types';
import { BURN_TIME_MS, ICONS } from '../constants';

interface MoldProps {
    mold: Mold;
    setMolds: React.Dispatch<React.SetStateAction<Mold[]>>;
    addTimeout: (timeout: number) => void;
    setServingPlate: React.Dispatch<React.SetStateAction<ServingPlate>>;
    setFillingTarget: React.Dispatch<React.SetStateAction<number | null>>;
    cookTime: number;
    upgrades: Upgrades;
    isSelected: boolean;
}

const MoldComponent: React.FC<MoldProps> = ({ mold, setMolds, setServingPlate, setFillingTarget, cookTime, upgrades, isSelected }) => {
    const updateMold = useCallback((id: number, updates: Partial<Mold>) => {
        setMolds(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
    }, [setMolds]);

    const handleClick = () => {
        switch (mold.state) {
            case MoldState.EMPTY:
                setFillingTarget(mold.id);
                break;
            case MoldState.READY:
                if (mold.filling !== null) {
                    setServingPlate(prev => ({ ...prev, [mold.filling]: prev[mold.filling] + 1 }));
                }
                updateMold(mold.id, { state: MoldState.EMPTY, filling: null, progress: 0 });
                break;
            case MoldState.BURNT:
                updateMold(mold.id, { state: MoldState.EMPTY, filling: null, progress: 0 });
                break;
        }
    };

    const getMoldBgColor = () => {
        switch (mold.state) {
            case MoldState.EMPTY: return 'bg-slate-800';
            case MoldState.COOKING: return 'bg-amber-400';
            case MoldState.READY: return 'bg-amber-600';
            case MoldState.BURNT: return 'bg-stone-900';
        }
    };
    
    const getProgressBarWidth = () => {
        let progressPercentage = 0;
        if (mold.state === MoldState.COOKING) {
            // Calculate the percentage of cooking completed to fill the bar from left to right.
            const elapsedTime = cookTime - mold.progress;
            progressPercentage = (elapsedTime / cookTime) * 100;
        } else if (mold.state === MoldState.READY) {
            // Calculate the percentage of time elapsed before it burns to fill the bar.
            const timeUntilBurnt = BURN_TIME_MS - mold.progress;
            progressPercentage = (timeUntilBurnt / BURN_TIME_MS) * 100;
        }
        return `${Math.max(0, Math.min(100, progressPercentage))}%`;
    };
    
    const getProgressBarColor = () => {
        return mold.state === MoldState.COOKING ? 'bg-green-500' : 'bg-red-500';
    }

    const BungeoppangIcon = ICONS.BUNGEOPPANG;
    const isActuallySelected = mold.state === MoldState.EMPTY && isSelected;

    return (
        <div 
            className={`relative rounded-lg flex items-center justify-center cursor-pointer transform transition-all duration-150 hover:scale-105 shadow-inner overflow-hidden ${getMoldBgColor()} ${isActuallySelected ? 'glow-on-select' : ''} ${mold.state === MoldState.READY ? 'glow-ready' : ''}`}
            onClick={handleClick}
            title={mold.state === MoldState.BURNT ? "타버렸다! 클릭해서 틀을 치우세요." : ""}
        >
            <div className="w-2/3 h-2/3 text-slate-500">
                <BungeoppangIcon />
            </div>

            {mold.state === MoldState.COOKING && mold.filling && (() => {
                const FillingIcon = ICONS[mold.filling];
                return (
                    <>
                        <div className="absolute text-amber-800 scale-[2]"><BungeoppangIcon /></div>
                        <div className="absolute w-1/2 h-1/2"><FillingIcon /></div>
                    </>
                );
            })()}

            {mold.state === MoldState.READY && mold.filling && (
                 <>
                    <div className="absolute text-amber-800 animate-gentle-bob animate-ready-pulse"><BungeoppangIcon crustLevel={upgrades.BUNGEOPPANG_CRUST} decorationLevel={upgrades.BUNGEOPPANG_DECORATION} /></div>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="sparkle" style={{ top: '20%', left: '30%', animationDelay: '0s' }}></div>
                        <div className="sparkle" style={{ top: '40%', left: '70%', animationDelay: '0.2s' }}></div>
                        <div className="sparkle" style={{ top: '65%', left: '25%', animationDelay: '0.5s' }}></div>
                        <div className="sparkle" style={{ top: '80%', left: '60%', animationDelay: '0.7s' }}></div>
                    </div>
                 </>
            )}

            {mold.state === MoldState.BURNT && (
                <>
                    <div className="absolute text-gray-600 scale-[2] opacity-40"><BungeoppangIcon /></div>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="smoke" style={{ top: '50%', left: '45%', animationDelay: '0s' }}></div>
                        <div className="smoke" style={{ top: '40%', left: '30%', animationDelay: '1s' }}></div>
                        <div className="smoke" style={{ top: '55%', left: '60%', animationDelay: '2s' }}></div>
                    </div>
                </>
            )}

            {(mold.state === MoldState.COOKING || mold.state === MoldState.READY) && (
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-300">
                    <div
                        className={`h-full transition-all duration-[50ms] ease-linear ${getProgressBarColor()}`}
                        style={{ width: getProgressBarWidth() }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MoldComponent);