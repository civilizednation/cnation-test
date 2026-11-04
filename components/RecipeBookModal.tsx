import React from 'react';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface RecipeBookModalProps {
    onClose: () => void;
}

const RecipeBookModal: React.FC<RecipeBookModalProps> = ({ onClose }) => {
    const handleClose = () => {
        onClose();
    }
    
    const BungeoppangIcon = ICONS.BUNGEOPPANG;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white/95 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 w-full max-w-md m-4 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-center text-3xl sm:text-4xl font-bold text-amber-800 mb-6 flex-shrink-0">붕어빵 도감</h2>
                <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                    <p className="text-center text-stone-600 pb-2">가게에서 만들 수 있는 붕어빵 종류입니다.</p>
                    
                    <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="w-12 h-12 flex-shrink-0">
                            <BungeoppangIcon />
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-amber-900">기본 붕어빵</h3>
                            <p className="text-sm text-stone-600">따끈하고 바삭한 기본 붕어빵입니다. 여기에 맛있는 속을 채워요!</p>
                        </div>
                    </div>

                    {Object.values(FillingType).map((filling) => {
                        // FIX: Cast the string value from Object.values to the specific enum type for safe access.
                        const fillingType = filling as FillingType;
                        const details = FILLING_DETAILS[fillingType];
                        const Icon = ICONS[fillingType];
                        return (
                            <div key={fillingType} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <Icon />
                                </div>
                                <div className="flex-grow">
                                    <h3 className={`font-bold text-lg ${details.textColor}`}>{details.label}</h3>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-8 text-center flex-shrink-0">
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

export default RecipeBookModal;
