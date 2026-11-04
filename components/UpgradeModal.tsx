import React from 'react';
import { UpgradeType, Upgrades, DailySpecial } from '../types';
import { UPGRADE_CONFIG } from '../constants';

interface UpgradeModalProps {
    totalRevenue: number;
    upgrades: Upgrades;
    onPurchaseUpgrade: (upgradeType: UpgradeType) => void;
    onClose: () => void;
    dailySpecial: DailySpecial | null;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ totalRevenue, upgrades, onPurchaseUpgrade, onClose, dailySpecial }) => {
    const handlePurchase = (upgradeType: UpgradeType) => {
        onPurchaseUpgrade(upgradeType);
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-amber-50 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 w-full max-w-md m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-center text-3xl sm:text-4xl font-bold text-amber-800 mb-2">가게 업그레이드</h2>
                <div className="text-center mb-4 text-xl font-bold text-amber-900">
                    총 수익: ₩{totalRevenue.toLocaleString()}
                </div>

                <div className="space-y-3 mt-4 flex-grow overflow-y-auto pr-2 max-h-[50vh]">
                    {Object.entries(UPGRADE_CONFIG).map(([key, config]) => {
                        const upgradeType = key as UpgradeType;
                        const currentLevel = upgrades[upgradeType] || 0;
                        const isMaxLevel = currentLevel >= config.levels.length - 1;
                        const nextLevelInfo = !isMaxLevel ? config.levels[currentLevel + 1] : null;
                        
                        const isSpecial = dailySpecial?.type === 'UPGRADE_DISCOUNT' && dailySpecial.target === upgradeType;
                        const originalCost = nextLevelInfo?.cost;
                        const finalCost = isSpecial && originalCost ? Math.floor(originalCost * dailySpecial.value) : originalCost;

                        return (
                            <div 
                                key={upgradeType} 
                                className={`p-3 rounded-lg flex items-center justify-between gap-2 border relative ${isSpecial ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-amber-200'}`}
                            >
                               {isSpecial && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full transform rotate-12 shadow-lg">SALE</div>}
                                <div className="flex-grow">
                                    <p className="font-bold text-amber-900 text-lg">{config.name}</p>
                                    <p className="text-sm text-stone-600">현재: {config.description(config.levels[currentLevel].value)}</p>
                                </div>
                                <button
                                    onClick={() => handlePurchase(upgradeType)}
                                    disabled={isMaxLevel || (finalCost != null && totalRevenue < finalCost)}
                                    className="w-32 text-center px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isMaxLevel ? '최고 레벨' : 
                                     isSpecial && originalCost ? (
                                        <span className="flex flex-col items-center">
                                            <span className="line-through opacity-70 text-xs">₩{originalCost.toLocaleString()}</span>
                                            <span>₩{finalCost?.toLocaleString()}</span>
                                        </span>
                                     ) : `₩${finalCost?.toLocaleString()}`
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleClose}
                        className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;