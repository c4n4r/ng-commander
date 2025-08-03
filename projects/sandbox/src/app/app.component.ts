import { Component, OnDestroy, OnInit } from '@angular/core';
import { delay, Observable, of, Subscription } from 'rxjs';
import { CommanderState } from '../../../ng-commander/src/Application/commander.service.configuration';
import Command from '../../../ng-commander/src/Domain/command.interface';
import { Commander } from '../../../ng-commander/src/public-api';

// Sample command implementation
class SampleCommand implements Command {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  execute(): Observable<string> {
    // Simulate async operation
    return of(`Result from command ${this.id}`).pipe(delay(1000));
  }
}

// Sample error command
class ErrorCommand implements Command {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  execute(): Observable<string> {
    // Simulate error
    return new Observable((subscriber) => {
      setTimeout(() => {
        subscriber.error(new Error(`Error in command ${this.id}`));
      }, 1000);
    });
  }
}

@Component({
  standalone: false,
  selector: 'app-root',
  template: `
    <div>
      <h1>Commander Service Sandbox</h1>

      <div>
        <h2>Current State: {{ getStateText() }}</h2>
        <p>Signal state: {{ stateSignal() | json }}</p>

        <button (click)="addCommand()">Add Command</button>
        <button (click)="addErrorCommand()">Add Error Command</button>
        <button (click)="replayCommandsInError()">
          Replay Commands in Error Queue
        </button>

        <h3>Waiting Commands: {{ getWaitingCommands().length }}</h3>
        <ul>
          <li *ngFor="let cmd of getWaitingCommands()">{{ cmd.id }}</li>
        </ul>

        <h3>Completed Commands: {{ getDoneCommands().length }}</h3>
        <ul>
          <li *ngFor="let cmd of getDoneCommands()">{{ cmd.id }}</li>
        </ul>

        <h3>Error Commands: {{ getErrorCommands().length }}</h3>
        <ul>
          <li *ngFor="let cmd of getErrorCommands()">{{ cmd.id }}</li>
        </ul>

        <h3>Dead Commands: {{ getDeadCommands().length }}</h3>
        <ul>
          <li *ngFor="let cmd of getDeadCommands()">{{ cmd.id }}</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private commandCounter = 0;
  private subscriptions = new Subscription();

  // Local state
  waitingCommands: Command[] = [];
  doneCommands: Command[] = [];
  errorCommands: Command[] = [];
  deadCommands: Command[] = [];
  currentState: CommanderState = CommanderState.IDLE;

  constructor(private commander: Commander) {}

  ngOnInit() {
    this.commander.init({
      error: {
        maxNumberOfRetries: 3,
      },
    });

    // Subscribe to changes
    this.subscriptions.add(
      this.commander.commands$.subscribe((commands: Command[]) => {
        this.waitingCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.commandsDone$.subscribe((commands: Command[]) => {
        console.log('commands done', commands);
        this.doneCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.commandsInError$.subscribe((commands: Command[]) => {
        this.errorCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.state$.subscribe((state: CommanderState) => {
        this.currentState = state;
      })
    );

    this.subscriptions.add(
      this.commander.commandsDead$.subscribe((commands: Command[]) => {
        this.deadCommands = commands;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  replayCommandsInError() {
    this.commander.replayCommandsInError();
  }

  addCommand() {
    this.commandCounter++;
    const command = new SampleCommand(`cmd-${this.commandCounter}`);
    this.commander.addCommand(command);
  }

  addErrorCommand() {
    this.commandCounter++;
    const command = new ErrorCommand(`err-${this.commandCounter}`);
    this.commander.addCommand(command);
  }

  getStateText(): string {
    return CommanderState[this.currentState];
  }

  stateSignal() {
    return this.commander.stateSignal();
  }

  getWaitingCommands(): Command[] {
    return this.waitingCommands;
  }

  getDoneCommands(): Command[] {
    return this.doneCommands;
  }

  getErrorCommands(): Command[] {
    return this.errorCommands;
  }

  getDeadCommands(): Command[] {
    return this.deadCommands;
  }
}
