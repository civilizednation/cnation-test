import React from 'react';
import { Mold, ServingPlate, Upgrades } from '../types';
import MoldComponent from './Mold';

interface BungeoppangGrillProps {
    molds: Mold[];
    setMolds: React.Dispatch<React.SetStateAction<Mold[]>>;
    // FIX: Use `number` for timer IDs to align with browser environments.
    addTimeout: (timeout: number) => void;
    setServingPlate: React.Dispatch<React.SetStateAction<ServingPlate>>;
    setFillingTarget: React.Dispatch<React.SetStateAction<number | null>>;
    cookTime: number;
    upgrades: Upgrades;
    fillingTarget: number | null;
}

const BungeoppangGrill: React.FC<BungeoppangGrillProps> = ({ molds, setMolds, addTimeout, setServingPlate, setFillingTarget, cookTime, upgrades, fillingTarget }) => {
    
    const getGridClasses = (count: number) => {
        switch (count) {
            case 8:
                return 'grid-cols-2 grid-rows-4 sm:grid-cols-4 sm:grid-rows-2';
            case 9:
                return 'grid-cols-3 grid-rows-3';
            case 12:
                return 'grid-cols-3 grid-rows-4 sm:grid-cols-4 sm:grid-rows-3';
            case 6:
            default:
                return 'grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2';
        }
    }
    
    return (
        <div className={`flex-grow bg-slate-700 rounded-lg p-2 sm:p-4 grid gap-2 sm:gap-4 border-4 border-slate-800 shadow-inner ${getGridClasses(molds.length)}`}>
            {molds.map(mold => (
                <MoldComponent 
                    key={mold.id} 
                    mold={mold} 
                    setMolds={setMolds}
                    addTimeout={addTimeout}
                    setServingPlate={setServingPlate}
                    setFillingTarget={setFillingTarget}
                    cookTime={cookTime}
                    upgrades={upgrades}
                    isSelected={fillingTarget === mold.id}
                />
            ))}
        </div>
    );
};

export default BungeoppangGrill;