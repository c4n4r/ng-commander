import { NgForOf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { delay, Observable, of, Subscription } from 'rxjs';
import Commander, {
  CommanderState,
} from '../../../ng-commander/src/Application/commander.service';
import Command from '../../../ng-commander/src/Domain/command.interface';

// Sample command implementation
class SampleCommand implements Command<string> {
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
class ErrorCommand implements Command<string> {
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
  standalone: true,
  selector: 'app-root',
  imports: [NgForOf],
  template: `
    <div>
      <h1>Commander Service Sandbox</h1>

      <div>
        <h2>Current State: {{ getStateText() }}</h2>

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
  waitingCommands: Command<any>[] = [];
  doneCommands: Command<any>[] = [];
  errorCommands: Command<any>[] = [];
  deadCommands: Command<any>[] = [];
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
      this.commander.commands$.subscribe((commands) => {
        this.waitingCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.commandsDone$.subscribe((commands) => {
        console.log('commands done', commands);
        this.doneCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.commandsInError$.subscribe((commands) => {
        this.errorCommands = commands;
      })
    );

    this.subscriptions.add(
      this.commander.state$.subscribe((state) => {
        this.currentState = state;
      })
    );

    this.subscriptions.add(
      this.commander.commandsDead$.subscribe((commands) => {
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

  getWaitingCommands(): Command<any>[] {
    return this.waitingCommands;
  }

  getDoneCommands(): Command<any>[] {
    return this.doneCommands;
  }

  getErrorCommands(): Command<any>[] {
    return this.errorCommands;
  }

  getDeadCommands(): Command<any>[] {
    return this.deadCommands;
  }
}
