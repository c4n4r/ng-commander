import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject, concatMap, delay, of } from 'rxjs';
import Command from '../Domain/command.interface';
import Commander, { CommanderState, CommandsType } from './commander.service';

describe('commander service tests', () => {
  let commander: Commander;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Commander],
    });
    commander = TestBed.inject(Commander);
    commander.init({
      error: {
        maxNumberOfRetries: 3,
      },
    });
  });

  it('should be created', () => {
    expect(commander).toBeTruthy();
  });

  it('should be able to add command', fakeAsync(() => {
    const command: Command = {
      id: '1',
      execute: () => {
        return of('test');
      },
    };
    commander.addCommand(command);
    tick();
    expect(commander.getCommands(CommandsType.DONE).length).toBe(1);
  }));

  it('should be able to get commands', fakeAsync(() => {
    const command: Command = {
      id: '1',
      execute: () => {
        return of('test');
      },
    };
    commander.addCommand(command);
    tick();
    const commands = commander.getCommands(CommandsType.DONE);
    expect(commands.length).toBe(1);
  }));

  it('should be able to add multiple commands', fakeAsync(() => {
    const command: Command = {
      id: '1',
      execute: () => {
        return of('test');
      },
    };
    commander.addCommand(command);
    tick();
    expect(commander.getCommands(CommandsType.DONE).length).toBe(1);
    const command2: Command = {
      id: '2',
      execute: () => {
        return of('test');
      },
    };
    commander.addCommand(command2);
    tick();
    expect(commander.getCommands(CommandsType.DONE).length).toBe(2);
  }));

  it('should change state correctly for a command that takes 10 seconds', fakeAsync(() => {
    const command: Command = {
      id: '1',
      execute: () => {
        return new BehaviorSubject('').pipe(
          concatMap(() => {
            return new Promise<string>((resolve) => {
              setTimeout(() => {
                resolve('test');
              }, 10000);
            });
          })
        );
      },
    };
    expect(commander.getState()).toBe(CommanderState.IDLE);
    commander.addCommand(command);
    expect(commander.getState()).toBe(CommanderState.EXECUTING);
    tick(100000);
    expect(commander.getCommands(CommandsType.DONE).length).toBe(1);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(0);
    expect(commander.getCommands(CommandsType.WAITING).length).toBe(0);
  }));

  it('should add command to error queue if command throws an error', fakeAsync(() => {
    const command: Command = {
      id: '1',
      execute: () => {
        return new BehaviorSubject('').pipe(
          concatMap(() => {
            return new Promise<string>((resolve, reject) => {
              setTimeout(() => {
                reject('test');
              }, 10000);
            });
          })
        );
      },
    };
    commander.addCommand(command);
    tick(20000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
  }));

  it('should continue processing commands after an error', fakeAsync(() => {
    // Add an error command
    const errorCommand: Command = {
      id: 'error-1',
      execute: () => {
        return new BehaviorSubject('').pipe(
          concatMap(() => {
            return new Promise<string>((resolve, reject) => {
              setTimeout(() => {
                reject('test error');
              }, 1000);
            });
          })
        );
      },
    };

    // Add a normal command
    const normalCommand: Command = {
      id: 'normal-1',
      execute: () => {
        return of('test success').pipe(delay(1000));
      },
    };

    // Add both commands
    commander.addCommand(errorCommand);
    commander.addCommand(normalCommand);

    // Process the error command
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
    expect(commander.getCommands(CommandsType.ERROR)[0].id).toBe('error-1');

    // Process the normal command
    tick(2000);
    expect(commander.getCommands(CommandsType.DONE).length).toBe(1);
    //expect(commander.getCommands(CommandsType.DONE)[0].id).toBe('normal-1');

    // Verify final state is IDLE
    expect(commander.getState()).toBe(CommanderState.IDLE);
  }));

  it('should replay commands in error queue', fakeAsync(() => {
    // create a command that will fail
    const command: Command = {
      id: '1',
      execute: () => {
        return new BehaviorSubject('').pipe(
          concatMap(() => {
            return new Promise<string>((resolve, reject) => {
              setTimeout(() => {
                reject('test error');
              }, 1000);
            });
          })
        );
      },
    };
    commander.addCommand(command);
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
    expect(commander.getCommands(CommandsType.ERROR)[0].id).toBe('1');

    commander.replayCommandsInError();
    expect(commander.getState()).toBe(CommanderState.EXECUTING);
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
  }));

  it('should stop replaying commands in error after 3 attempts', fakeAsync(() => {
    const errorCommand: Command = {
      id: 'error-1',
      execute: () => {
        return new BehaviorSubject('').pipe(
          concatMap(() => {
            return new Promise<string>((resolve, reject) => {
              setTimeout(() => {
                reject('test error');
              }, 1000);
            });
          })
        );
      },
    };

    commander.addCommand(errorCommand);
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
    commander.replayCommandsInError();
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
    commander.replayCommandsInError();
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(1);
    commander.replayCommandsInError();
    tick(2000);
    expect(commander.getCommands(CommandsType.ERROR).length).toBe(0);
    expect(commander.getCommands(CommandsType.DEAD).length).toBe(1);
  }));
});
