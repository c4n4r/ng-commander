import Command from './command.interface';

export enum CommandEventType {
  START = 'start',
  SUCCESS = 'success',
  FAIL = 'fail',
  RESTART = 'restart',
  DEAD = 'dead',
}
export interface CommandEvent {
  type: CommandEventType;
  timestamp: Date;
  command: Command;
  data?: any;
}

// Signal types for Angular 18+ compatibility
export type CommandEventSignal = CommandEvent;
