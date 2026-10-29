# Vega periodic background task sample

Run JavaScript on a schedule in the background, even when your app isn't running.

This React Native for Vega app (SDK 2.0, RN 0.83) uses the **Vega Task Manager** to schedule a
repeating headless JS task. Task Manager launches the task at the requested interval, whether or not
the app is open, and keeps the schedule after the app exits.

Task Manager has no JavaScript API in SDK 2.0. The only JS scheduler,
`@amazon-devices/kepler-epg-sync-scheduler`, is limited to Live TV EPG sync. This sample includes a
small C++ Turbo Module that exposes Task Manager to JS, so any app can schedule its own periodic work.

Use it for work that should stay fresh without the user opening the app, for example refreshing
cached content, syncing settings, or prefetching data for the next launch.

## What you'll see

1. Open the app and press **Schedule (60s)**. The task runs once right away, then every 60
   seconds.
2. Close the app.
3. Come back a few minutes later. The app shows the task's state and every run that happened while
   it was closed:

   ```
   On launch: getState('periodicDemo') -> PENDING, 4 runs, latest 2026-09-30T16:02:09.523Z, ...
   ```

Verified on a Fire TV device running Vega OS 2.0.

## Quick start

### Prerequisites

- **Vega SDK 2.0 or later.** This sample requires SDK 2.0. Install the
  [Vega Developer Tools](https://developer.amazon.com/docs/vega/latest/install-vega-sdk.html) and make
  sure `vega` is on your `PATH`.
- Node.js 22.14 or later.
- A Vega device or the Vega Virtual Device.
- *(Optional)* The Vega Studio extension for Visual Studio Code, if you prefer an IDE to the command
  line. See [Set up the Vega Studio extension](https://developer.amazon.com/docs/vega/latest/setup-extension).

### Command line or IDE

You can build and run this sample from the command line with the `vega` CLI, or from Visual Studio
Code with the Vega Studio extension. The steps below use the command line. To use the IDE instead,
install the extension (see the link above), open this folder in Visual Studio Code, and follow the
Vega Studio documentation to build the app, start the Vega Virtual Device or select your device, and
run the app. Run `npm install` first in either case, because it also installs the Turbo Module's
dependencies.

### Build and run

```bash
npm install          # also installs the Turbo Module's dependencies (turbo-module/)
npm test             # Turbo Module tests, then app tests
npm run build        # builds the Turbo Module (C++, all architectures), then the app (Release)
```

`npm run build` writes one vpkg per architecture to `build/<arch>-release/`. Install the one that
matches the device's userspace architecture:

```bash
vega run-app build/armv7-release/periodictasksample_armv7.vpkg     # most Fire TV devices
vega run-app build/aarch64-release/periodictasksample_aarch64.vpkg # 64-bit userspace, Vega Virtual Device on Apple silicon Macs
vega run-app build/x86_64-release/periodictasksample_x86_64.vpkg   # Vega Virtual Device on Intel Macs and x86_64 Linux
```

Many Fire TV devices run a 32-bit (armv7) userspace on 64-bit hardware. The Vega Virtual Device
uses the host's CPU architecture, so on an Apple silicon Mac (M1 and later) it needs the
`aarch64` vpkg, not `x86_64`. If you install the wrong one, `vega run-app` still reports success,
but the app crashes on launch with `TurboModuleRegistry.getEnforcing(...): 'PeriodicTaskScheduler'
could not be found`.

Use `npm run build:debug` (output in `build/<arch>-debug/`) to see the app's `console.log` output
in the device log. Release builds don't write it.

## How it works

```
 UI process                                        Task Manager (system)
 ┌─────────────────────────────┐                   ┌──────────────────────┐
 │ App.tsx                     │ scheduleRepeating │                      │
 │   PeriodicTasks ──▶ C++ ────┼──────────────────▶│ every intervalSeconds│
 │   (Turbo Module)            │ ITaskManager::    │ app running or not   │
 └─────────────────────────────┘ submit()          └──────────┬───────────┘
                                                              │ launches
 Headless task process                                        ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │ manifest.toml [[components.task]] ──▶ task.js ──▶ src/PeriodicTask.ts │
 │                                                    PeriodicTasks.     │
 │                                                    recordRun()        │
 └──────────────────────────────────────────────────────┬───────────────┘
                                                         ▼
                              /data/periodic_task_runs.log ──▶ read by App.tsx on launch
```

Three pieces work together:

1. **A Turbo Module** (`turbo-module/`) wraps the Task Manager platform API
   (`com.amazon.kepler.tasks`) in C++ and exposes it to JS as `PeriodicTasks`.
2. **A headless task component** declared in `manifest.toml`. Task Manager launches it on schedule.
   `task.js` registers its JS entry point, `doPeriodicTask` in `src/PeriodicTask.ts`.
3. **Shared state.** The task runs in its own process, so it can't share memory with the UI. It
   records each run through the Turbo Module, which stores runs in a file in the app's `/data`
   directory. The UI reads them on launch.

### Project layout

```
vega-periodic-task-sample/
├── manifest.toml            Declares the UI and the headless task component
├── task.js                  Registers the task's entry point (bundled as task.hermes.bundle)
├── index.js                 UI entry point
├── src/
│   ├── App.tsx              UI: schedule, inspect and cancel the task, show run history
│   ├── components/          ActionButton (focusable button with TV focus styling)
│   ├── theme.ts             TV font sizes, colors and safe-zone inset
│   ├── PeriodicTask.ts      The background work (runs in the headless JS runtime)
│   └── taskConfig.ts        Component id, task name and interval shared by UI and task
├── test/App.spec.tsx
└── turbo-module/            Local package "@amazon-devices/periodic-task-scheduler" (app dependency file:./turbo-module)
    ├── CMakeLists.txt       Imports the com.amazon.kepler.tasks IDL
    ├── src/turbo-modules/
    │   ├── PeriodicTaskScheduler.ts   Turbo Module spec (input to codegen)
    │   └── PeriodicTasks.ts           Typed JS wrapper the app imports
    ├── kepler/turbo-modules/
    │   ├── PeriodicTaskScheduler.cpp  Task Manager calls
    │   └── generated/                 Codegen output, don't edit
    └── test/PeriodicTasks.spec.ts
```

The Vega app build doesn't compile native code in the app project itself. It links native code from
the app's npm dependencies. That's why the Turbo Module is its own local package. The root scripts
build both, so you work with a single project.

## Key code

### Schedule a repeating task (C++)

`turbo-module/kepler/turbo-modules/PeriodicTaskScheduler.cpp`:

```cpp
auto module = apmf::GetProcessObject()
                  ->getComponent("/com.amazon.kepler.tasks.tasks_module")
                  .TryQueryInterface<IKeplerTasksModule>();
auto manager = module->makeTaskManager();

MonotonicDuration repeat{};
repeat.time.seconds = intervalSeconds;
auto timeProperties = module->makeTimePropertiesBuilder()->repeatInterval(repeat)->build();

auto request = module->makeTaskRequestBuilder()
                   ->requireTime(timeProperties)
                   ->repeating()
                   ->persistAfterAppDeath()   // keep the schedule after the app exits
                   ->name(name)               // unique per app; prevents duplicates
                   ->build(componentId);      // a [[components.task]] from manifest.toml
auto registration = manager->submit(request);
```

The module also implements state queries, listing and cancelling with
`tryGetTaskRegistrationByName()`, `getAllTaskRegistrationsForPackage()` and
`ITaskRegistration::remove()`.

### Declare the task component

`manifest.toml`:

```toml
[[components.task]]
id = "com.amazondeveloper.periodictasksample.periodicTask"
runtime-module = "/com.amazon.kepler.runtime.react_native_kepler_headless_4@IReactNativeKeplerHeadless_0"

[processes]
[[processes.group]]
component-ids = ["com.amazondeveloper.periodictasksample.main"]

[[processes.group]]
component-ids = ["com.amazondeveloper.periodictasksample.periodicTask"]
```

A process group can't mix runtime modules, so the UI and the task each get their own.

### Register and implement the task

`task.js`. The key is `<component id>::doTask`, and it must be registered in `task.js`:

```js
HeadlessEntryPointRegistry.registerHeadlessEntryPoint2(
  `${TASK_COMPONENT_ID}::doTask`,
  () => doPeriodicTask,
);
```

`src/PeriodicTask.ts`:

```ts
export const doPeriodicTask = async (): Promise<void> => {
  try {
    PeriodicTasks.recordRun(new Date().toISOString()); // replace with your work
  } catch (e) {
    console.error(`periodic task failed: ${(e as Error).message}`);
  }
};
```

### Use it from JS

```ts
import {PeriodicTasks} from '@amazon-devices/periodic-task-scheduler';

await PeriodicTasks.scheduleRepeating({
  componentId: 'com.amazondeveloper.periodictasksample.periodicTask',
  name: 'periodicDemo',
  intervalSeconds: 60,
});
PeriodicTasks.getState('periodicDemo'); // 'PENDING' | 'RUNNING' | ... | 'NOT_FOUND'
PeriodicTasks.cancel('periodicDemo');
```

## `PeriodicTasks` API

| Method | Description |
| --- | --- |
| `scheduleRepeating({componentId, name, intervalSeconds, requireInternet?})` → `Promise<string>` | Schedules a repeating task. Resolves with the task UUID. Rejects if `intervalSeconds` is under 60, `name` is empty or over 32 bytes, or a task with that name is already scheduled. With `requireInternet`, runs only while the device is online. |
| `getState(name)` → `TaskState` | `PENDING`, `READY`, `RUNNING`, `CANCELED`, `FAILED`, `SUCCEEDED`, or `NOT_FOUND`. |
| `getScheduledNames()` → `string[]` | Names of all tasks scheduled by the app. |
| `cancel(name)` → `boolean` | Removes the task. Returns `false` if it wasn't scheduled. |
| `cancelAll()` → `number` | Removes all of the app's tasks. Returns how many were removed. |
| `recordRun(timestamp)`, `getRunHistory()`, `clearRunHistory()` | The sample's run log in `/data`, readable from both processes. Keeps the last 20 runs, newest first. |

## Checking it on a device

Each run shows up in the device log as a launch of the task component, followed by its completion.
These lines appear in Release builds too:

```bash
vda shell "loggingctl log -f" | grep -E 'periodicTask\): (Trigger event LAUNCH in state IDLE|Execution completed)'
```

```
... appInst[2204](com.amazondeveloper.periodictasksample.periodicTask): Trigger event LAUNCH in state IDLE. Completed: true
... appInst[2204](com.amazondeveloper.periodictasksample.periodicTask): Execution completed: 0
... appInst[2205](com.amazondeveloper.periodictasksample.periodicTask): Trigger event LAUNCH in state IDLE. Completed: true
```

To close the app from the command line:

```bash
vda shell vlcm terminate-app --pkg-id com.amazondeveloper.periodictasksample
```

## Adding this to your app

1. Copy `turbo-module/` into your project and add it as a dependency:
   `"@amazon-devices/periodic-task-scheduler": "file:./turbo-module"`. Add the Metro `blockList` entries from
   `metro.config.js`.
2. Declare a `[[components.task]]` and its own `[[processes.group]]` in your `manifest.toml`.
3. Register `<component id>::doTask` in a `task.js` at the project root, with
   `@amazon-devices/headless-task-manager`.
4. Call `PeriodicTasks.scheduleRepeating()` when the work should start, for example after sign-in.
   Schedule again after app updates (see below).

## Things to know

- **Use the longest interval you can.** 60 seconds is for the demo. The minimum is 60 seconds.
  Frequent background work costs device resources.
- **Run times aren't exact.** Task Manager may delay a run when the system is busy. If a run is
  still waiting when the next one is due, the older one is dropped.
- **The interval follows system uptime.** The countdown restarts after a power cycle.
- **Installing a new build clears the schedule.** After an update, `getState()` returns `NOT_FOUND`.
  Schedule again at startup, or from a task with `[[tasks.work]] mode = "install"` in the manifest.
  Uninstalling the app removes its tasks.
- **A run gets 5 minutes.**
- **The headless runtime is limited.** Don't import UI components or UI APIs from `react-native`.
  AsyncStorage isn't available in the RN 0.83 headless runtime (`NativeModule: AsyncStorage is
  null`), even though it works in the UI. Your own Turbo Modules do load there, which is how this
  sample shares state.
- **Don't let `doTask` reject.** With `@amazon-devices/headless-task-manager` 1.2.8 on OS 2.0, a
  rejected `doTask` never completes and the task stays `RUNNING`. Catch errors inside `doTask`.
- **Some Task Manager features aren't implemented in SDK 2.0** and throw `NotSupportedError`:
  observers and results, success and failure counts, custom retry policies, `requireDeviceIdle()`,
  input payloads, and `update()`. To change the interval, cancel and schedule again.
- **Boot-triggered tasks** (`requireReboot()`) need a first-party-only privilege and aren't
  available to third-party apps.

The full Task Manager API is documented in the SDK, in `tasks.idl` and `tasks-cookbook.md` in the
`KeplerAppInterface` package.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| App crashes on launch with `TurboModuleRegistry.getEnforcing(...): 'PeriodicTaskScheduler' could not be found` | The installed vpkg doesn't match the device's userspace architecture. Most Fire TV devices need `armv7`, even on 64-bit hardware. The Vega Virtual Device needs `aarch64` on Apple silicon Macs and `x86_64` on Intel hosts. Install the matching vpkg from `build/<arch>-release/`. See [Quick start](#quick-start) to check the architecture. |
| No `[PeriodicTaskSample]` lines in the device log | Release builds don't write `console.log` output. Use `npm run build:debug`, or check the Task Manager launch lines shown in [Checking it on a device](#checking-it-on-a-device). |
| `scheduleRepeating rejected -> A task named 'periodicDemo' is already scheduled` | The task is already scheduled. Press **Cancel**, then **Schedule** again. |
| `getState()` returns `NOT_FOUND` after installing a new build | Installing a build clears the schedule. Press **Schedule** again. |
| Task stays `RUNNING` and never runs again | `doTask` rejected. Catch all errors inside it (see [Things to know](#things-to-know)). |

## Changing the Turbo Module's API

1. Edit `turbo-module/src/turbo-modules/PeriodicTaskScheduler.ts`.
2. Run `npm --prefix turbo-module run kepler-codegen`. This regenerates `generated/` **and
   overwrites** `PeriodicTaskScheduler.{h,cpp}`. Back up your implementation first and merge it back
   in afterwards.
3. Update `PeriodicTasks.ts` and `turbo-module/src/turbo-modules/__mocks__/PeriodicTaskScheduler.ts`.
4. Run `npm run build`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md). Please don't report security issues in public GitHub issues.

## License

This sample is licensed under the MIT-0 License. See [LICENSE](LICENSE).
