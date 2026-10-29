// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Shared by the UI (App.tsx) and the headless task (PeriodicTask.ts). Keep
// this file free of UI imports: the headless runtime crashes on them.

/** Task component id declared in manifest.toml ([[components.task]]). */
export const TASK_COMPONENT_ID =
  'com.amazondeveloper.periodictasksample.periodicTask';

/** Unique task name within the app package (at most 32 bytes). */
export const TASK_NAME = 'periodicDemo';

/** Task Manager's minimum repeat interval. */
export const TASK_INTERVAL_SECONDS = 60;
