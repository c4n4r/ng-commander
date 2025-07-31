import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, concatMap, Subject } from 'rxjs';
import {
  CommandEvent,
  CommandEventType,
} from '../Domain/command-event.interface';
import Command from '../Domain/command.interface';
import { CommanderConfiguration } from './commander.service.configuration';

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

@Injectable({
  providedIn: 'root',
})
export default class Commander {
  private configuration: CommanderConfiguration = {
    error: {
      maxNumberOfRetries: 3,
    },
  };
  private commandsSubject = new BehaviorSubject<Command<any>[]>([]);
  private commandsDoneSubject = new BehaviorSubject<Command<any>[]>([]);
  private commandsInErrorSubject = new BehaviorSubject<Command<any>[]>([]);
  private commandsDeadSubject = new BehaviorSubject<Command<any>[]>([]);
  private stateSubject = new BehaviorSubject<CommanderState>(
    CommanderState.IDLE
  );

  private processingCommand = new Subject<{
    command: Command<any>;
    result: any;
  }>();

  public commands$ = this.commandsSubject.asObservable();
  public commandsDone$ = this.commandsDoneSubject.asObservable();
  public commandsInError$ = this.commandsInErrorSubject.asObservable();
  public commandsDead$ = this.commandsDeadSubject.asObservable();
  public state$ = this.stateSubject.asObservable();

  constructor() {}

  init(configuration: CommanderConfiguration) {
    this.configuration = configuration;
    this.startCommander();
  }

  private startCommander() {
    this.processingCommand
      .pipe(
        concatMap(({ command }) => {
          this.stateSubject.next(CommanderState.EXECUTING);
          return command.execute().pipe(
            concatMap((result) => {
              return [{ command, result, isError: false }];
            }),
            catchError((error) => {
              return [{ command, error, isError: true }];
            })
          );
        })
      )
      .subscribe({
        next: (data) => {
          if (data.isError) {
            this.stateSubject.next(CommanderState.ERROR);
            const currentErrors = this.commandsInErrorSubject.value;
            this.declareEventOnCommand(data.command, CommandEventType.FAIL);
            this.commandsInErrorSubject.next([...currentErrors, data.command]);
          } else {
            this.stateSubject.next(CommanderState.DONE);
            const currentDone = this.commandsDoneSubject.value;
            this.declareEventOnCommand(data.command, CommandEventType.SUCCESS);
            this.commandsDoneSubject.next([...currentDone, data.command]);
          }
          this.trashDeadCommands();

          this.executeNextCommand();
        },
        error: (errorObj) => {
          this.stateSubject.next(CommanderState.ERROR);
          this.executeNextCommand();
        },
      });
  }

  private declareEventOnCommand(
    command: Command<any>,
    type: CommandEventType
  ): void {
    const event: CommandEvent = {
      type,
      timestamp: new Date(),
      command: command,
    };
    if (!command.events) command.events = [];
    command.events.push(event);
  }

  stop() {
    this.stateSubject.complete();
  }

  addCommand<C>(command: Command<C>) {
    const currentCommands = this.commandsSubject.value;
    this.commandsSubject.next([...currentCommands, command]);
    if (currentCommands.length === 0) {
      this.executeNextCommand();
    }
  }

  replayCommandsInError() {
    const commandsInError = this.commandsInErrorSubject.value;
    this.commandsInErrorSubject.next([]);
    if (commandsInError.length > 0) {
      this.commandsSubject.next(commandsInError);
      this.executeNextCommand();
    }
  }

  private trashDeadCommands() {
    const inError = this.commandsInErrorSubject.value;
    inError.forEach((command) => {
      const events = command.events;
      if (
        events &&
        events.length > this.configuration.error.maxNumberOfRetries
      ) {
        this.declareEventOnCommand(command, CommandEventType.DEAD);
        this.commandsDeadSubject.next([
          ...this.commandsDeadSubject.value,
          command,
        ]);
        this.commandsInErrorSubject.next(inError.filter((c) => c !== command));
      }
    });
  }

  flushDeadCommands() {
    this.commandsDeadSubject.next([]);
  }

  getCommands(type: CommandsType): Command<any>[] {
    switch (type) {
      case CommandsType.WAITING:
        return this.commandsSubject.value;
      case CommandsType.DONE:
        return this.commandsDoneSubject.value;
      case CommandsType.ERROR:
        return this.commandsInErrorSubject.value;
      case CommandsType.DEAD:
        return this.commandsDeadSubject.value;
    }
  }

  getState(): CommanderState {
    return this.stateSubject.value;
  }

  private executeNextCommand() {
    const currentCommands = this.commandsSubject.value;
    if (currentCommands.length > 0) {
      const [command, ...rest] = currentCommands;
      this.commandsSubject.next(rest);
      this.stateSubject.next(CommanderState.EXECUTING);
      this.processingCommand.next({ command, result: null });
    } else {
      this.stateSubject.next(CommanderState.IDLE);
    }
  }
}
