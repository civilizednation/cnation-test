import React from 'react';
import { FillingType, ServingPlate, Upgrades } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface ControlPanelProps {
    servingPlate: ServingPlate;
    upgrades: Upgrades;
    onCleanAllMolds: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ servingPlate, upgrades, onCleanAllMolds }) => {
    const BungeoppangIcon = ICONS.BUNGEOPPANG;

    return (
        <div className="bg-amber-200 rounded-lg p-2 sm:p-4 flex flex-col items-center justify-center gap-4 border-4 border-amber-400">
            {/* Serving Plate */}
            <div className="flex flex-col items-center gap-2 w-full">
                <h3 className="text-xl sm:text-2xl font-bold text-amber-800">접시</h3>
                <div className="bg-white w-full max-w-xl rounded-lg p-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-2 border-amber-400 shadow-inner">
                    {Object.values(FillingType).map((filling) => {
                        // FIX: Cast the string value from Object.values to the specific enum type for safe access.
                        const fillingType = filling as FillingType;
                        const Icon = ICONS[fillingType];
                        const details = FILLING_DETAILS[fillingType];
                        return (
                             <div key={fillingType} className={`flex items-center gap-2 text-lg sm:text-xl font-bold ${details.textColor}`}>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700"><BungeoppangIcon crustLevel={upgrades.BUNGEOPPANG_CRUST} decorationLevel={upgrades.BUNGEOPPANG_DECORATION} /></div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8"><Icon /></div>
                                <span>x {servingPlate[fillingType]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="w-full flex justify-center">
                <button
                    onClick={onCleanAllMolds}
                    className="px-5 py-2 bg-slate-500 text-white font-semibold rounded-full shadow hover:bg-slate-600 transition-all duration-200 transform hover:scale-105"
                >
                    ✨ 틀 전체 청소
                </button>
            </div>
        </div>
    );
};

export default React.memo(ControlPanel);
