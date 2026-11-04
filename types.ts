// FIX: Export all necessary types for the application.
export enum GameState {
  START_SCREEN = 'START_SCREEN',
  PLAYING = 'PLAYING',
  DAY_END = 'DAY_END',
  BONUS_STAGE = 'BONUS_STAGE',
}

export enum UpgradeType {
  MOLD_COUNT = 'MOLD_COUNT',
  COOK_SPEED = 'COOK_SPEED',
  PATIENCE_TIME = 'PATIENCE_TIME',
  BUNGEOPPANG_CRUST = 'BUNGEOPPANG_CRUST',
  BUNGEOPPANG_DECORATION = 'BUNGEOPPANG_DECORATION',
  FASTER_SERVING = 'FASTER_SERVING',
  AUTO_BAKE = 'AUTO_BAKE',
  AUTO_SERVE = 'AUTO_SERVE',
}

export type Upgrades = {
  [key in UpgradeType]: number;
};

export enum FillingType {
  RED_BEAN = 'RED_BEAN',
  CHOUX_CREAM = 'CHOUX_CREAM',
  PIZZA = 'PIZZA',
  SWEET_POTATO = 'SWEET_POTATO',
  CHOCOLATE = 'CHOCOLATE',
  STRAWBERRY = 'STRAWBERRY',
  BLUEBERRY = 'BLUEBERRY',
  HONEY = 'HONEY',
}

export type DailySpecial = {
  type: 'UPGRADE_DISCOUNT' | 'FILLING_BONUS';
  target: UpgradeType | FillingType;
  value: number;
  description: string;
};

export enum MoldState {
    EMPTY,
    COOKING,
    READY,
    BURNT,
}

export interface Mold {
    id: number;
    state: MoldState;
    filling: FillingType | null;
    progress: number;
}

export type CustomerOrder = Partial<Record<FillingType, number>>;

export interface Customer {
    id: number;
    order: CustomerOrder;
    patience: number;
    maxPatience: number;
    icon: string;
}

export type ServingPlate = Record<FillingType, number>;
