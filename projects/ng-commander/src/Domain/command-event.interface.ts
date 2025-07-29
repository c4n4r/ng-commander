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
  command: Command<any>;
  data?: any;
}
