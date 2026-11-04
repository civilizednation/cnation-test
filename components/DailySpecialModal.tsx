import React from 'react';
import { DailySpecial, FillingType, UpgradeType } from '../types';
import { ICONS } from '../constants';

const UPGRADE_ICONS: Record<UpgradeType, string> = {
    [UpgradeType.MOLD_COUNT]: '➕',
    [UpgradeType.COOK_SPEED]: '🔥',
    [UpgradeType.PATIENCE_TIME]: '⏳',
    [UpgradeType.BUNGEOPPANG_CRUST]: '🍞',
    [UpgradeType.BUNGEOPPANG_DECORATION]: '✨',
    [UpgradeType.FASTER_SERVING]: '🚀',
    [UpgradeType.AUTO_BAKE]: '🤖',
    [UpgradeType.AUTO_SERVE]: '🦾',
};

const DailySpecialModal: React.FC<{ special: DailySpecial; onClose: () => void }> = ({ special, onClose }) => {
    const handleClose = () => {
        onClose();
    };

    const getIcon = () => {
        if (special.type === 'FILLING_BONUS') {
            const Icon = ICONS[special.target as FillingType];
            return <div className="w-24 h-24"><Icon/></div>;
        } else {
            return <div className="text-6xl">{UPGRADE_ICONS[special.target as UpgradeType]}</div>;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-yellow-50 rounded-2xl shadow-2xl border-4 border-yellow-400 p-8 w-full max-w-sm m-4 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-3xl font-bold text-orange-600" style={{ textShadow: '1px 1px #fff' }}>🌟 오늘의 스페셜! 🌟</h2>
                <div className="my-6 flex items-center justify-center h-28">{getIcon()}</div>
                <p className="text-xl font-semibold text-stone-700">{special.description}</p>
                <button
                    onClick={handleClose}
                    className="mt-8 px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default DailySpecialModal;