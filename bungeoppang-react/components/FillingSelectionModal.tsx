import React from 'react';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface FillingSelectionModalProps {
    isOpen: boolean;
    onSelect: (filling: FillingType) => void;
    onClose: () => void;
}

const FillingSelectionModal: React.FC<FillingSelectionModalProps> = ({ isOpen, onSelect, onClose }) => {
    
    const handleSelect = (filling: FillingType) => {
        onSelect(filling);
    };

    return (
        <div 
            className={`fixed inset-0 z-40 bg-black/60 flex items-center justify-center transition-opacity duration-100 ease-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-modal="true"
            aria-hidden={!isOpen}
            role="dialog"
        >
            <div 
                className={`bg-white/90 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 w-full max-w-md m-4 transition-transform duration-100 ease-out ${isOpen ? 'scale-100' : 'scale-95'}`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h2 className="text-center text-3xl font-bold text-amber-800 mb-6">어떤 속을 넣을까요?</h2>
                <div className="grid grid-cols-2 gap-4">
                    {Object.values(FillingType).map((filling) => {
                        // FIX: Cast the string value from Object.values to the specific enum type for safe access.
                        const fillingType = filling as FillingType;
                        const details = FILLING_DETAILS[fillingType];
                        const Icon = ICONS[fillingType];
                        return (
                            <button 
                                key={fillingType}
                                onClick={() => handleSelect(fillingType)}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-4 border-amber-300 bg-amber-100 hover:bg-white hover:border-amber-500 hover:scale-105 transform transition-all h-28 text-center"
                                tabIndex={isOpen ? 0 : -1}
                            >
                                <div className="w-16 h-16">
                                    <Icon />
                                </div>
                                <span className={`font-bold text-lg ${details.textColor}`}>{details.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FillingSelectionModal;
