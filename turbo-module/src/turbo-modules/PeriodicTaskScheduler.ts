// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import type {KeplerTurboModule} from '@amazon-devices/keplerscript-turbomodule-api';
import {TurboModuleRegistry} from '@amazon-devices/keplerscript-turbomodule-api';

/**
 * Spec for the native module. Every call goes to the Vega Task Manager
 * platform API (com.amazon.kepler.tasks IDL), which has no JS binding in
 * SDK 2.0. Task Manager launches the given task component (declared in the
 * app's manifest.toml) in the background, even when the app isn't running.
 *
 * Tasks are identified by a name that is unique within the app package.
 *
 * After editing this file run `npm run kepler-codegen` to regenerate the C++
 * spec in kepler/turbo-modules/generated/.
 */
export interface PeriodicTaskScheduler extends KeplerTurboModule {
  // Asynchronous (the Task Manager IPC runs on a worker thread).
  // Resolves with the system-assigned task UUID. Rejects if a task with the
  // same name is already scheduled.
  scheduleRepeatingTask: (
    componentId: string,
    name: string,
    intervalSeconds: number,
    requireInternet: boolean,
  ) => Promise<string>;

  // Synchronous.
  // One of PENDING, READY, RUNNING, CANCELED, FAILED, SUCCEEDED, or
  // NOT_FOUND if no task with that name is scheduled.
  getTaskState: (name: string) => string;
  getScheduledTaskNames: () => string[];
  // Returns false if no task with that name is scheduled.
  cancelTask: (name: string) => boolean;
  // Returns the number of tasks removed.
  cancelAllTasks: () => number;

  // Run history, stored in a file in the app's /data directory so the
  // headless task and the UI (separate processes) can share it. AsyncStorage
  // isn't available in the RN 0.83 headless runtime.
  recordRun: (timestamp: string) => void;
  // Newest first, at most the last 20 runs.
  getRunHistory: () => string[];
  clearRunHistory: () => void;
}

export default TurboModuleRegistry.getEnforcing<PeriodicTaskScheduler>(
  'PeriodicTaskScheduler',
);
