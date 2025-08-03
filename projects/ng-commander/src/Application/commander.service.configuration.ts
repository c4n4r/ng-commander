import Command from '../Domain/command.interface';

export interface CommanderConfiguration {
  error: {
    maxNumberOfRetries: number;
  };
}

export enum CommanderState {
  IDLE,
  EXECUTING,
  DONE,
  ERROR,
}

export enum CommandsType {
  WAITING,
  DONE,
  ERROR,
  DEAD,
}

// Signal types for Angular 18+ compatibility
export type CommandsSignal = Command[];
export type CommanderStateSignal = CommanderState;
