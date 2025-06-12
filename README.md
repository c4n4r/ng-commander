# NgCommander

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.13.

## Libraries

### ng-commander

A queuing system based on RxJS that implements the command pattern. The library provides a service to queue and execute commands sequentially, with proper error handling and state management.

#### Features

- Command pattern implementation
- RxJS-based queuing system
- Sequential command execution
- Error handling
- State management

## Sandbox Application

A sandbox application is included to demonstrate the functionality of the ng-commander library. To run the sandbox:

```bash
ng serve sandbox
```

Then navigate to `http://localhost:4200/` in your browser.

The sandbox demonstrates:
- Creating and implementing commands
- Queuing commands for execution
- Handling successful and error commands
- Monitoring the state of the commander service

For more details, see the [Sandbox README](projects/sandbox/README.md).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
