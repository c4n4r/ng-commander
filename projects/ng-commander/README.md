# NG Commander

NG Commander is a service designed to manage and execute commands in an Angular application using RxJS for reactive programming. It provides a robust framework for handling command execution, retries, and error management.

## Features

- **Command Execution**: Execute commands asynchronously and manage their state.
- **Error Handling**: Automatically retry commands that fail, with configurable retry limits.
- **State Management**: Track the state of command execution (IDLE, EXECUTING, DONE, ERROR).
- **Reactive Programming**: Utilize RxJS for reactive command management.

## Installation

To install NG Commander, run the following command:

```bash
npm install ng-commander
```

## Usage

### Import the Service

Import the `Commander` service into your Angular module or component:

```typescript
import { Commander } from "ng-commander";
```

### Initialize the Service

Initialize the service with a configuration object:

```typescript
constructor(private commander: Commander) {
  this.commander.init({
    error: {
      maxNumberOfRetries: 3,
    },
  });
}
```

### Add Commands

Add commands to the commander for execution:

```typescript
const command: Command<any> = {
  execute: () => {
    // Command execution logic
    return of("Command executed successfully");
  },
};

this.commander.addCommand(command);
```

### Handle Command Events

Subscribe to command events to handle execution results:

```typescript
this.commander.commands$.subscribe((commands) => {
  console.log("Commands:", commands);
});

this.commander.commandsDone$.subscribe((doneCommands) => {
  console.log("Done Commands:", doneCommands);
});

this.commander.commandsInError$.subscribe((errorCommands) => {
  console.log("Error Commands:", errorCommands);
});

this.commander.commandsDead$.subscribe((deadCommands) => {
  console.log("Dead Commands:", deadCommands);
});

this.commander.state$.subscribe((state) => {
  console.log("State:", state);
});
```

## API

### Methods

- `init(configuration: CommanderConfiguration)`: Initialize the commander with a configuration.
- `addCommand<C>(command: Command<C>)`: Add a command to the commander.
- `replayCommandsInError()`: Replay commands that are in error.
- `getCommands(type: CommandsType)`: Get commands of a specific type.
- `getState()`: Get the current state of the commander.
- `stop()`: Stop the commander.

### Observables

- `commands$`: Observable of all commands.
- `commandsDone$`: Observable of commands that have been executed successfully.
- `commandsInError$`: Observable of commands that have encountered errors.
- `commandsDead$`: Observable of commands that have been marked as dead.
- `state$`: Observable of the current state of the commander.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
