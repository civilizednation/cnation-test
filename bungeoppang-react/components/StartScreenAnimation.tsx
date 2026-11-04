import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Upgrades } from '../types';

interface StartScreenAnimationProps {
    upgrades: Upgrades;
}

const StartScreenAnimation: React.FC<StartScreenAnimationProps> = ({ upgrades }) => {
    const [state, setState] = useState<'empty' | 'pouring' | 'cooking' | 'ready'>('empty');

    const BungeoppangIcon = ICONS.BUNGEOPPANG;
    const EmptyMoldIcon = ICONS.BUNGEOPPANG;

    useEffect(() => {
        const sequence: Array<() => void> = [
            () => setState('empty'),
            () => setState('pouring'),
            () => setState('cooking'),
            () => setState('ready'),
        ];
        const timings = [2000, 2000, 3000, 3000]; // delays FOR empty, pouring, cooking, ready

        let index = 0;
        let timer: number;

        const advance = () => {
            sequence[index]();
            // Using window.setTimeout to avoid type issues with Node.js setTimeout
            timer = window.setTimeout(advance, timings[index]);
            index = (index + 1) % sequence.length;
        };

        advance();

        return () => window.clearTimeout(timer);
    }, []);

    // This component is a decorative element placed above the main title.
    return (
        <div className="w-full h-40 sm:h-48 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-full h-full flex items-center justify-center scale-125">
                {/* Mold Base */}
                <div className={`w-32 h-32 text-slate-500 transition-transform duration-500 ${state === 'cooking' ? 'scale-105' : 'scale-100'}`}>
                    <EmptyMoldIcon crustLevel={0} decorationLevel={0} />
                </div>
                
                {/* Batter fill */}
                <div className={`absolute w-32 h-32 text-amber-300 ${state === 'pouring' ? 'animate-fill-in' : ''} ${state === 'cooking' || state === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
                     <EmptyMoldIcon crustLevel={0} decorationLevel={0} />
                </div>
                
                {/* Hand icon */}
                { state === 'pouring' &&
                    <div className="absolute -top-8 -right-8 text-4xl animate-hand-pour" style={{transformOrigin: 'bottom left'}}>🤏</div>
                }

                {/* Smoke for cooking */}
                { state === 'cooking' &&
                    <>
                        <div className="smoke" style={{ top: '50%', left: '45%', animationDelay: '0s' }}></div>
                        <div className="smoke" style={{ top: '40%', left: '30%', animationDelay: '0.5s' }}></div>
                        <div className="smoke" style={{ top: '55%', left: '60%', animationDelay: '1s' }}></div>
                    </>
                }

                {/* Finished Bungeoppang */}
                { state === 'ready' &&
                    <div className="absolute w-32 h-32 animate-pop-in-subtle">
                        <BungeoppangIcon crustLevel={upgrades.BUNGEOPPANG_CRUST} decorationLevel={upgrades.BUNGEOPPANG_DECORATION} />
                    </div>
                }
            </div>
        </div>
    );
};

export default StartScreenAnimation;
