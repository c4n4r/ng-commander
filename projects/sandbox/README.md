# Commander Service Sandbox

This is a simple sandbox application to test and demonstrate the functionality of the Commander service.

## Features

- Demonstrates the Command pattern implementation using RxJS
- Shows how to create and queue commands
- Displays the state of the Commander service
- Handles successful and error commands

## How to Use

1. Start the sandbox application:
   ```
   ng serve sandbox
   ```

2. Open your browser and navigate to `http://localhost:4200`

3. Use the UI to:
   - Add new commands to the queue
   - Add error commands to see error handling
   - View the current state of the Commander service
   - See lists of waiting, completed, and error commands

## Implementation Details

The sandbox demonstrates:

1. **Command Interface**: How to implement the Command interface with the required `id` property and `execute()` method.

2. **Command Types**:
   - `SampleCommand`: A simple command that succeeds after a delay
   - `ErrorCommand`: A command that throws an error to demonstrate error handling

3. **Commander Service**:
   - Command queuing
   - Sequential execution
   - State management
   - Error handling

## Code Examples

### Creating a Command

```typescript
class SampleCommand implements Command<string> {
  id: string;
  
  constructor(id: string) {
    this.id = id;
  }
  
  execute(): Observable<string> {
    // Implement your command logic here
    return of(`Result from command ${this.id}`).pipe(
      delay(1000)
    );
  }
}
```

### Using the Commander Service

```typescript
// Inject the service
constructor(private commander: Commander) {}

// Add a command to the queue
const command = new SampleCommand('my-command');
this.commander.addCommand(command);

// Get the current state
const state = this.commander.getState();

// Get commands by type
const waitingCommands = this.commander.getCommands(CommandsType.WAITING);
const doneCommands = this.commander.getCommands(CommandsType.DONE);
const errorCommands = this.commander.getCommands(CommandsType.ERROR);
```
