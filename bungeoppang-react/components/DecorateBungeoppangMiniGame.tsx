import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ICONS, UPGRADE_CONFIG } from '../constants';
import { UpgradeType } from '../types';

interface DecorateBungeoppangMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const GAME_TIME = 45; // seconds
const BONUS_PER_SUCCESS = 300;
const TIME_PENALTY_WRONG = 3; // seconds
const CUSTOMER_ICONS = ['🧐', '👑', '😎', '🧐', '🤩'];

type DecorationOrder = {
  crust: number;
  decoration: number;
};

const DecorateBungeoppangMiniGame: React.FC<DecorateBungeoppangMiniGameProps> = ({ onGameEnd }) => {
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [score, setScore] = useState(0);
  const [currentOrder, setCurrentOrder] = useState<DecorationOrder | null>(null);
  const [playerCrust, setPlayerCrust] = useState<number>(0);
  const [playerDecoration, setPlayerDecoration] = useState<number>(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');
  const [customerIcon, setCustomerIcon] = useState('🧐');

  const decorationOptions = useMemo(() => UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_DECORATION].levels, []);
  const crustOptions = useMemo(() => UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_CRUST].levels.slice(1), []); // Exclude basic crust

  const generateNewOrder = useCallback(() => {
    const randomCrust = crustOptions[Math.floor(Math.random() * crustOptions.length)];
    const randomDecoration = decorationOptions[Math.floor(Math.random() * (decorationOptions.length - 1)) + 1]; // Exclude 'none'
    
    setCurrentOrder({ crust: randomCrust.value, decoration: randomDecoration.value });
    setCustomerIcon(CUSTOMER_ICONS[Math.floor(Math.random() * CUSTOMER_ICONS.length)]);
    setPlayerCrust(0);
    setPlayerDecoration(0);
  }, [decorationOptions, crustOptions]);

  useEffect(() => {
    if (gameState === 'playing') {
      generateNewOrder();
      const timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [gameState, generateNewOrder]);

  const handleServe = () => {
    if (!currentOrder) return;
    if (playerCrust === currentOrder.crust && playerDecoration === currentOrder.decoration) {
      setScore(prev => prev + 1);
    } else {
      setTimeLeft(prev => Math.max(0, prev - TIME_PENALTY_WRONG));
    }
    generateNewOrder();
  };

  // FIX: Wrapped icon component to prevent potential rendering errors with direct assignment.
  const BungeoppangIcon: React.FC<{crustLevel?: number; decorationLevel?: number;}> = (props) => <ICONS.BUNGEOPPANG {...props} />;

  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">붕어빵 데코레이션 챌린지</h2>
        <p className="text-stone-700 text-lg mb-6">VIP 손님의 까다로운 주문을 맞춰주세요! 정확하고 빠르게 만들수록 높은 보너스를 받습니다.</p>
        <button
          onClick={() => setGameState('playing')}
          className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
        >
          도전 시작!
        </button>
      </div>
    );
  }

  if (gameState === 'end') {
    const bonus = score * BONUS_PER_SUCCESS;
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl text-center flex flex-col items-center">
        <h2 className="text-4xl font-bold text-amber-800 mb-4">게임 종료!</h2>
        <p className="text-2xl text-stone-700 mb-2">완성한 붕어빵: {score}개</p>
        <p className="text-xl text-green-600 font-bold mb-6">획득 보너스: ₩{bonus.toLocaleString()}</p>
        <button
          onClick={() => onGameEnd(bonus)}
          className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
        >
          가게로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-200/80 p-4 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-4xl flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-amber-800">VIP 특별 주문</h2>
        <div className="text-xl font-bold text-stone-700">남은 시간: {timeLeft}s</div>
        <div className="text-xl font-bold text-green-700">완성: {score}</div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Order Section */}
        <div className="bg-white/50 p-4 rounded-lg border-2 border-amber-300 flex flex-col items-center">
          <h3 className="text-2xl font-bold text-amber-900 mb-2">주문서 <span className="text-3xl">{customerIcon}</span></h3>
          {currentOrder && (
            <div className="w-48 h-32">
              <BungeoppangIcon crustLevel={currentOrder.crust} decorationLevel={currentOrder.decoration} />
            </div>
          )}
          <div className="text-center mt-2">
            {/* FIX: Use bracket notation with enums to access config properties correctly. */}
            <p className="font-semibold">{UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_CRUST].description(currentOrder?.crust ?? 0)}</p>
            <p className="font-semibold">{UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_DECORATION].description(currentOrder?.decoration ?? 0)}</p>
          </div>
        </div>

        {/* Player Section */}
        <div className="bg-white/50 p-4 rounded-lg border-2 border-amber-300 flex flex-col items-center">
           <h3 className="text-2xl font-bold text-blue-800 mb-2">제작 중</h3>
            <div className="w-48 h-32">
                <BungeoppangIcon crustLevel={playerCrust} decorationLevel={playerDecoration} />
            </div>
            <div className="text-center mt-2 h-12">
              {/* FIX: Use bracket notation with enums to access config properties correctly. */}
              <p className="font-semibold">{UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_CRUST].description(playerCrust ?? 0)}</p>
              <p className="font-semibold">{UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_DECORATION].description(playerDecoration ?? 0)}</p>
            </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex flex-col gap-3">
          <div>
              <h4 className="font-bold text-center text-amber-800">껍질 선택</h4>
              <div className="flex flex-wrap justify-center gap-2 p-2 bg-white/40 rounded-lg">
                  {crustOptions.map(opt => (
                       <button key={opt.value} onClick={() => setPlayerCrust(opt.value)} className={`px-3 py-1 rounded-md text-sm transition-colors ${playerCrust === opt.value ? 'bg-blue-500 text-white' : 'bg-amber-100 hover:bg-amber-200'}`}>
                           {/* FIX: Use bracket notation with enums to access config properties correctly. */}
                           {UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_CRUST].description(opt.value)}
                       </button>
                  ))}
              </div>
          </div>
          <div>
              <h4 className="font-bold text-center text-amber-800">토핑 선택</h4>
              <div className="flex flex-wrap justify-center gap-2 p-2 bg-white/40 rounded-lg">
                   {decorationOptions.slice(1).map(opt => ( // Exclude 'none'
                       <button key={opt.value} onClick={() => setPlayerDecoration(opt.value)} className={`px-3 py-1 rounded-md text-sm transition-colors ${playerDecoration === opt.value ? 'bg-blue-500 text-white' : 'bg-amber-100 hover:bg-amber-200'}`}>
                           {/* FIX: The 'description' function is on the main upgrade config object, not on the individual level object ('opt'). */}
                           {UPGRADE_CONFIG[UpgradeType.BUNGEOPPANG_DECORATION].description(opt.value)}
                       </button>
                   ))}
              </div>
          </div>
      </div>

      <button onClick={handleServe} className="w-full mt-4 py-3 text-xl font-bold text-white bg-green-600 rounded-full shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all">
        서빙하기!
      </button>
    </div>
  );
};

export default DecorateBungeoppangMiniGame;
