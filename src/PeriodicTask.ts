// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {PeriodicTasks} from '@amazon-devices/periodic-task-scheduler';

// Runs in the headless JS runtime, launched by Task Manager each time the
// schedule fires, whether or not the app's UI is open. Only import headless-safe
// modules here (no react-native UI components or UI APIs). The app's own Turbo
// Module works here; AsyncStorage doesn't in the RN 0.83 headless runtime.
//
// Task Manager allows a run 5 minutes.
export const doPeriodicTask = async (): Promise<void> => {
  const now = new Date().toISOString();
  console.log(`[PeriodicTaskSample] periodic task started at ${now}`);
  try {
    // Replace this with the app's real background work, for example
    // fetch()ing fresh content and caching it for the next launch.
    PeriodicTasks.recordRun(now);
    console.log('[PeriodicTaskSample] periodic task done');
  } catch (e) {
    // Don't reject. On OS 2.0 (headless-task-manager 1.2.8) a rejected doTask
    // hits "TypeError: undefined is not a function" inside the task manager,
    // the run never completes, and the task stays RUNNING instead of being
    // retried. Log the failure and let the next scheduled run try again.
    console.error(`[PeriodicTaskSample] periodic task failed: ${(e as Error).message}`);
  }
};
