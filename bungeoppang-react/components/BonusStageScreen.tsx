import React, { useState } from 'react';
import MatchingMiniGame from './MatchingMiniGame';
import RPSMiniGame from './RPSMiniGame';
import LadderMiniGame from './LadderMiniGame';
import RandomDrawMiniGame from './RandomDrawMiniGame';
import SnakeMiniGame from './SnakeMiniGame';
import BungeoppangShooterMiniGame from './BungeoppangShooterMiniGame';
import DecorateBungeoppangMiniGame from './DecorateBungeoppangMiniGame';
import CatchIngredientsMiniGame from './CatchIngredientsMiniGame';
import QuickRecipeMiniGame from './QuickRecipeMiniGame';
import BungeoppangMazeMiniGame from './BungeoppangMazeMiniGame';
import QuickChopMiniGame from './QuickChopMiniGame';
import PacManMiniGame from './PacManMiniGame';

interface BonusStageScreenProps {
  onComplete: (bonusRevenue: number) => void;
}

const BonusStageScreen: React.FC<BonusStageScreenProps> = ({ onComplete }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
  }

  if (selectedGame === 'matching') {
    return <MatchingMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'rps') {
    return <RPSMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'ladder') {
    return <LadderMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'randomDraw') {
    return <RandomDrawMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'snake') {
    return <SnakeMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'shooter') {
    return <BungeoppangShooterMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'decorate') {
    return <DecorateBungeoppangMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'catch') {
    return <CatchIngredientsMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'recipe') {
    return <QuickRecipeMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'maze') {
    return <BungeoppangMazeMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'quickChop') {
    return <QuickChopMiniGame onGameEnd={onComplete} />;
  }
  if (selectedGame === 'pacman') {
    return <PacManMiniGame onGameEnd={onComplete} />;
  }


  // A helper component for the cards
  const GameCard: React.FC<{title: string; description: string; onClick: () => void; disabled?: boolean}> = 
    ({ title, description, onClick, disabled }) => (
    <div 
        onClick={!disabled ? onClick : undefined}
        className={`bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border-4 
            ${disabled 
                ? 'border-stone-300 text-stone-500' 
                : 'border-amber-300 hover:border-orange-400 hover:shadow-2xl transform hover:-translate-y-2 transition-all cursor-pointer'}`
        }
    >
        <h2 className={`text-2xl font-bold mb-3 ${disabled ? 'text-stone-600' : 'text-orange-600'}`}>{title}</h2>
        <p className={disabled ? '' : 'text-stone-600'}>
            {description}
        </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-amber-50 rounded-lg p-4 sm:p-8 items-center justify-center text-center overflow-y-auto">
      <h1 className="text-4xl sm:text-5xl font-bold text-amber-800 mb-4" style={{ textShadow: '2px 2px #f59e0b' }}>
        보너스 미션
      </h1>
      <p className="text-lg sm:text-xl text-stone-600 mb-10">
        하루의 피로를 풀어줄 미니게임 시간! 성공하고 보너스 수익을 챙겨가세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
        <GameCard 
            title="붕어빵 짝 맞추기"
            description="카드를 뒤집어 같은 속을 가진 붕어빵을 찾아보세요. 당신의 기억력을 시험할 시간입니다!"
            onClick={() => handleSelectGame('matching')}
        />
        <GameCard 
            title="가위바위보 대결"
            description="타짜와의 숨막히는 한판 승부! 3판 2선승제로 보너스를 획득하세요!"
            onClick={() => handleSelectGame('rps')}
        />
        <GameCard 
            title="사다리 타기"
            description="운명의 사다리가 당신을 기다립니다! 대박을 노려보세요."
            onClick={() => handleSelectGame('ladder')}
        />
        <GameCard 
            title="무작위 뽑기"
            description="행운을 시험해보세요! 상자 안에 든 보너스는?"
            onClick={() => handleSelectGame('randomDraw')}
        />
        <GameCard 
            title="붕어빵 꼬리잡기"
            description="팥 붕어빵을 먹고 길어지세요! 벽이나 자신의 몸에 부딪히지 않게 조심하세요."
            onClick={() => handleSelectGame('snake')}
        />
        <GameCard 
            title="붕어빵 슈팅"
            description="탄 붕어빵 군단이 몰려온다! 반죽을 발사해 가게를 지키세요."
            onClick={() => handleSelectGame('shooter')}
        />
        <GameCard 
            title="토핑 데코레이션"
            description="VIP 손님의 특별 주문! 요청에 맞춰 붕어빵을 완벽하게 꾸며보세요. 시간은 금입니다!"
            onClick={() => handleSelectGame('decorate')}
        />
         <GameCard 
            title="재료 받기"
            description="하늘에서 재료가 쏟아져요! 바구니를 움직여 맛있는 속재료를 받고, 탄 붕어빵은 피하세요."
            onClick={() => handleSelectGame('catch')}
        />
        <GameCard 
            title="레시피 암기 챌린지"
            description="VIP의 비밀 레시피를 순간적으로 암기하고 그대로 만들어보세요. 기억력의 한계에 도전!"
            onClick={() => handleSelectGame('recipe')}
        />
        <GameCard 
            title="붕어빵 미로 찾기"
            description="미로를 탈출하여 맛있는 팥을 찾아가세요! 시간이 지날수록 보너스가 줄어듭니다."
            onClick={() => handleSelectGame('maze')}
        />
        <GameCard 
            title="재료 빨리 썰기"
            description="떨어지는 재료를 빠르게 클릭하여 손질하세요. 탄 붕어빵은 피해야 합니다!"
            onClick={() => handleSelectGame('quickChop')}
        />
        <GameCard 
            title="붕어빵 팩맨"
            description="미로를 탐험하며 팥을 모두 먹어치우세요! 탄 붕어빵 유령들을 조심하세요."
            onClick={() => handleSelectGame('pacman')}
        />
      </div>
    </div>
  );
};

export default BonusStageScreen;