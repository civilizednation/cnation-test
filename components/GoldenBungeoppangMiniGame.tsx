import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';

interface GoldenBungeoppangMiniGameProps {
    challengerIcon: string;
    onComplete: (success: boolean) => void;
}

type GamePhase = 'intro' | 'shuffling' | 'playing' | 'result';

interface MoldProps {
    isGolden: boolean; 
    isRevealed: boolean; 
    onClick: () => void;
    style: React.CSSProperties;
    disabled: boolean;
}

const Mold: React.FC<MoldProps> = ({ 
    isGolden, 
    isRevealed, 
    onClick, 
    style,
    disabled
}) => (
    <div 
        className={`absolute w-32 h-32 transition-all duration-500 ease-in-out ${!disabled ? 'cursor-pointer hover:scale-110' : ''}`}
        style={style}
        onClick={disabled ? undefined : onClick}
    >
        <div className={`relative w-full h-full transition-transform duration-300 transform-style-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
            {/* Back of mold */}
            <div className="absolute w-full h-full backface-hidden">
                <div className="w-full h-full text-slate-500 scale-125">
                     <ICONS.BUNGEOPPANG crustLevel={0} decorationLevel={0} />
                </div>
            </div>
            {/* Front of mold (content) */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180">
                <div className="w-full h-full scale-125">
                    {/* FIX: Icon components must be rendered as elements (<Component />), not objects. */}
                    {isGolden ? <ICONS.GOLDEN_BUNGEOPPANG /> : <ICONS.BUNGEOPPANG crustLevel={3} decorationLevel={0} />}
                </div>
            </div>
        </div>
    </div>
);

const GoldenBungeoppangMiniGame: React.FC<GoldenBungeoppangMiniGameProps> = ({ challengerIcon, onComplete }) => {
    const [phase, setPhase] = useState<GamePhase>('intro');
    const [positions, setPositions] = useState([0, 1, 2]);
    const [playerChoice, setPlayerChoice] = useState<number | null>(null);

    const goldenMoldIndex = useMemo(() => Math.floor(Math.random() * 3), []);
    
    const isCorrect = playerChoice !== null && positions[playerChoice] === goldenMoldIndex;

    useEffect(() => {
        let timer: number | undefined;
        const timeouts: number[] = [];

        if (phase === 'intro') {
            timer = window.setTimeout(() => setPhase('shuffling'), 2500);
        } else if (phase === 'shuffling') {
            let shuffleCount = 0;
            const shuffle = () => {
                setPositions(currentPositions => {
                    const newPositions = [...currentPositions];
                    const i = Math.floor(Math.random() * 3);
                    let j = Math.floor(Math.random() * 3);
                    while (i === j) {
                        j = Math.floor(Math.random() * 3);
                    }
                    [newPositions[i], newPositions[j]] = [newPositions[j], newPositions[i]];
                    return newPositions;
                });

                shuffleCount++;
                if (shuffleCount < 7) {
                    const id = window.setTimeout(shuffle, 450);
                    timeouts.push(id);
                } else {
                    const id = window.setTimeout(() => setPhase('playing'), 450);
                    timeouts.push(id);
                }
            };
            const id = window.setTimeout(shuffle, 500);
            timeouts.push(id);
        }
        
        return () => {
            if (timer) window.clearTimeout(timer);
            timeouts.forEach(window.clearTimeout);
        };
    }, [phase]);
    
    const handleChoice = (index: number) => {
        if (phase !== 'playing') return;
        setPlayerChoice(index);
        setPhase('result');
    };
    
    const getMessage = () => {
        switch(phase) {
            case 'intro': return "황금 붕어빵을 잘 보세요!";
            case 'shuffling': return "집중!";
            case 'playing': return "황금 붕어빵을 찾아보세요!";
            case 'result': return isCorrect ? "성공!" : "아까비!";
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in">
            <div className="bg-amber-100 rounded-2xl shadow-2xl border-4 border-amber-400 p-6 sm:p-8 w-full max-w-2xl m-4 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-800 mb-2">
                    <span className="text-4xl sm:text-5xl mr-2">{challengerIcon}</span>
                    VIP 손님의 특별한 내기!
                </h2>
                <p className="text-xl text-amber-700 font-semibold mb-8">{getMessage()}</p>
                
                <div className="relative h-40 w-full mb-8">
                    {[0, 1, 2].map(index => (
                        <Mold
                            key={index}
                            isGolden={positions[index] === goldenMoldIndex}
                            isRevealed={phase === 'intro' || (phase === 'result' && (playerChoice === index || positions[index] === goldenMoldIndex))}
                            onClick={() => handleChoice(index)}
                            disabled={phase !== 'playing'}
                            style={{ 
                                position: 'absolute',
                                left: '50%',
                                transform: `translateX(calc(-50% + ${(positions[index] - 1) * 132}px))`
                             }}
                        />
                    ))}
                </div>

                {phase === 'result' && (
                    <div className="animate-pop-in-subtle">
                        <p className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '정답입니다! 보너스 ₩5,000을 획득했습니다!' : '아쉽네요! 다음 기회에...'}
                        </p>
                        <button
                            onClick={() => onComplete(isCorrect)}
                            className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
                        >
                            계속하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoldenBungeoppangMiniGame;
