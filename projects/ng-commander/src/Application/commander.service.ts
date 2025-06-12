import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, concatMap, Subject, throwError } from 'rxjs';
import Command from '../Domain/command.interface';

export enum CommanderState {
  IDLE,
  EXECUTING,
  DONE,
  ERROR
}

export enum CommandsType {
  WAITING,
  DONE,
  ERROR,
}

@Injectable({
  providedIn: 'root'
})
export default class Commander {
  // Use BehaviorSubjects instead of arrays
  private commandsSubject = new BehaviorSubject<Command<any>[]>([]);
  private commandsDoneSubject = new BehaviorSubject<Command<any>[]>([]);
  private commandsInErrorSubject = new BehaviorSubject<Command<any>[]>([]);
  private stateSubject = new BehaviorSubject<CommanderState>(CommanderState.IDLE);

  private processingCommand = new Subject<{command: Command<any>, result: any}>();

  // Expose as Observables
  public commands$ = this.commandsSubject.asObservable();
  public commandsDone$ = this.commandsDoneSubject.asObservable();
  public commandsInError$ = this.commandsInErrorSubject.asObservable();
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.processingCommand.pipe(
      concatMap(({command}) => {
        this.stateSubject.next(CommanderState.EXECUTING);
        return command.execute().pipe(
          concatMap(result => {
            return [{ command, result, isError: false }];
          }),
          catchError(error => {
            return [{ command, error, isError: true }];
          })
        );
      }),
    ).subscribe({
      next: (data) => {
        if (data.isError) {
          this.stateSubject.next(CommanderState.ERROR);
          const currentErrors = this.commandsInErrorSubject.value;
          this.commandsInErrorSubject.next([...currentErrors, data.command]);
        } else {
          this.stateSubject.next(CommanderState.DONE);
          const currentDone = this.commandsDoneSubject.value;
          this.commandsDoneSubject.next([...currentDone, data.command]);
        }
        this.executeNextCommand();
      },
      error: (errorObj) => {
        this.stateSubject.next(CommanderState.ERROR);
        this.executeNextCommand();
      }
    })
  }

  addCommand<C>(command: Command<C>) {
    const currentCommands = this.commandsSubject.value;
    this.commandsSubject.next([...currentCommands, command]);
    if(currentCommands.length === 0) {
      this.executeNextCommand();
    }
  }


  replayCommandsInError() {
    const commandsInError = this.commandsInErrorSubject.value;
    this.commandsInErrorSubject.next([]);
    if(commandsInError.length > 0) {
      this.commandsSubject.next(commandsInError);
      this.executeNextCommand();
    }

  }

  getCommands(type: CommandsType): Command<any>[] {
    switch (type) {
      case CommandsType.WAITING:
        return this.commandsSubject.value;
      case CommandsType.DONE:
        return this.commandsDoneSubject.value;
      case CommandsType.ERROR:
        return this.commandsInErrorSubject.value;
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
      this.processingCommand.next({command, result: null});
    } else {
      this.stateSubject.next(CommanderState.IDLE);
    }
  }

}
