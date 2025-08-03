import { computed, Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  finalize,
  Subject,
  switchMap,
} from 'rxjs';
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
export class Commander implements OnDestroy {
  private configuration: CommanderConfiguration = {
    error: {
      maxNumberOfRetries: 3,
    },
  };

  private commandsSubject = new BehaviorSubject<Command[]>([]);
  private commandsDoneSubject = new BehaviorSubject<Command[]>([]);
  private commandsInErrorSubject = new BehaviorSubject<Command[]>([]);
  private commandsDeadSubject = new BehaviorSubject<Command[]>([]);
  private stateSubject = new BehaviorSubject<CommanderState>(
    CommanderState.IDLE
  );

  private processingCommand = new Subject<{
    command: Command;
    result: any;
  }>();

  private destroy$ = new Subject<void>();

  public commands$ = this.commandsSubject.asObservable();
  public commandsDone$ = this.commandsDoneSubject.asObservable();
  public commandsInError$ = this.commandsInErrorSubject.asObservable();
  public commandsDead$ = this.commandsDeadSubject.asObservable();
  public state$ = this.stateSubject.asObservable();

  // Signal properties for Angular 18+ compatibility
  public commandsSignal = computed(() => this.commandsSubject.value);
  public commandsDoneSignal = computed(() => this.commandsDoneSubject.value);
  public commandsInErrorSignal = computed(
    () => this.commandsInErrorSubject.value
  );
  public commandsDeadSignal = computed(() => this.commandsDeadSubject.value);
  public stateSignal = computed(() => this.stateSubject.value);

  constructor() {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  init(configuration: CommanderConfiguration) {
    this.configuration = configuration;
    this.startCommander();
  }

  private startCommander() {
    this.processingCommand
      .pipe(
        switchMap(({ command }) => {
          // Update state to executing before starting execution
          this.stateSubject.next(CommanderState.EXECUTING);

          return command.execute().pipe(
            // Handle successful execution
            switchMap((result) => {
              return this.handleSuccessfulCommand(command, result);
            }),
            // Handle errors with retry logic
            catchError((error) => {
              return this.handleFailedCommand(command, error);
            }),
            // Finalize to ensure cleanup
            finalize(() => {
              this.executeNextCommand();
            })
          );
        }),
        // Complete the stream when destroy$ emits
        finalize(() => {
          this.stateSubject.complete();
        })
      )
      .subscribe({
        error: (error) => {
          console.error('Commander error:', error);
          this.stateSubject.next(CommanderState.ERROR);
        },
      });
  }

  private handleSuccessfulCommand(command: Command, result: any) {
    const event: CommandEvent = {
      type: CommandEventType.SUCCESS,
      timestamp: new Date(),
      command: command,
    };

    if (!command.events) command.events = [];
    command.events.push(event);

    const currentDone = this.commandsDoneSubject.value;
    this.commandsDoneSubject.next([...currentDone, command]);

    // Update state to DONE only if there are no more commands
    this.stateSubject.next(
      this.commandsSubject.value.length > 0
        ? CommanderState.EXECUTING
        : CommanderState.DONE
    );

    return EMPTY;
  }

  private handleFailedCommand(command: Command, error: any) {
    const event: CommandEvent = {
      type: CommandEventType.FAIL,
      timestamp: new Date(),
      command: command,
    };

    if (!command.events) command.events = [];
    command.events.push(event);

    const currentErrors = this.commandsInErrorSubject.value;
    this.commandsInErrorSubject.next([...currentErrors, command]);

    // Check if we should mark as dead
    this.trashDeadCommands();

    return EMPTY;
  }
  stop() {
    this.stateSubject.complete();
  }

  addCommand(command: Command) {
    const currentCommands = this.commandsSubject.value;
    this.commandsSubject.next([...currentCommands, command]);

    // Start processing if this is the first command
    if (
      currentCommands.length === 0 &&
      this.stateSubject.value === CommanderState.IDLE
    ) {
      this.executeNextCommand();
    }
  }

  replayCommandsInError() {
    const commandsInError = this.commandsInErrorSubject.value;
    this.commandsInErrorSubject.next([]);

    if (commandsInError.length > 0) {
      this.commandsSubject.next(commandsInError);

      // Only start execution if not already executing
      if (this.stateSubject.value === CommanderState.IDLE) {
        this.executeNextCommand();
      }
    }
  }

  private trashDeadCommands() {
    const inError = this.commandsInErrorSubject.value;

    // Check for commands that have exceeded max retries
    const deadCommands: Command[] = [];
    const remainingCommands: Command[] = [];

    inError.forEach((command) => {
      const events = command.events;

      // Count failure events (excluding restarts if they exist)
      const failCount =
        events?.filter((e) => e.type === CommandEventType.FAIL).length || 0;

      if (events && failCount > this.configuration.error.maxNumberOfRetries) {
        // Mark as dead
        const event: CommandEvent = {
          type: CommandEventType.DEAD,
          timestamp: new Date(),
          command: command,
        };

        if (!command.events) command.events = [];
        command.events.push(event);

        deadCommands.push(command);
      } else {
        remainingCommands.push(command);
      }
    });

    if (deadCommands.length > 0) {
      this.commandsDeadSubject.next([
        ...this.commandsDeadSubject.value,
        ...deadCommands,
      ]);
    }

    if (remainingCommands.length !== inError.length) {
      this.commandsInErrorSubject.next(remainingCommands);
    }
  }

  flushDeadCommands() {
    this.commandsDeadSubject.next([]);
  }

  getCommands(type: CommandsType): Command[] {
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

      // Update state to EXECUTING
      if (this.stateSubject.value !== CommanderState.EXECUTING) {
        this.stateSubject.next(CommanderState.EXECUTING);
      }

      // Process the command
      this.processingCommand.next({ command, result: null });
    } else {
      // No more commands, set to IDLE
      this.stateSubject.next(CommanderState.IDLE);
    }
  }
}
