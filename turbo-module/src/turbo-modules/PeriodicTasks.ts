// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import PeriodicTaskSchedulerModule from './PeriodicTaskScheduler';

export type TaskState =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'CANCELED'
  | 'FAILED'
  | 'SUCCEEDED'
  | 'NOT_FOUND';

export type RepeatingTaskOptions = {
  /** Task component id from the app's manifest.toml ([[components.task]]). */
  componentId: string;
  /** Unique within the app package, at most 32 bytes. */
  name: string;
  /** Minimum time between runs. Must be at least 60. */
  intervalSeconds: number;
  /** Only run while the device is connected to the internet. */
  requireInternet?: boolean;
};

/**
 * Thin JS layer over the native module. Adds typed options and a typed task
 * state, which the native side can't express directly.
 */
class PeriodicTasksApi {
  /** Resolves with the system-assigned task UUID. */
  scheduleRepeating({
    componentId,
    name,
    intervalSeconds,
    requireInternet = false,
  }: RepeatingTaskOptions): Promise<string> {
    return PeriodicTaskSchedulerModule.scheduleRepeatingTask(
      componentId,
      name,
      intervalSeconds,
      requireInternet,
    );
  }

  getState(name: string): TaskState {
    return PeriodicTaskSchedulerModule.getTaskState(name) as TaskState;
  }

  getScheduledNames(): string[] {
    return PeriodicTaskSchedulerModule.getScheduledTaskNames();
  }

  /** Returns false if no task with that name is scheduled. */
  cancel(name: string): boolean {
    return PeriodicTaskSchedulerModule.cancelTask(name);
  }

  /** Returns the number of tasks removed. */
  cancelAll(): number {
    return PeriodicTaskSchedulerModule.cancelAllTasks();
  }

  /**
   * Run history shared by the headless task and the UI, which run in separate
   * processes. Safe to call from the headless runtime.
   */
  recordRun(timestamp: string): void {
    PeriodicTaskSchedulerModule.recordRun(timestamp);
  }

  /** Newest first, at most the last 20 runs. */
  getRunHistory(): string[] {
    return PeriodicTaskSchedulerModule.getRunHistory();
  }

  clearRunHistory(): void {
    PeriodicTaskSchedulerModule.clearRunHistory();
  }
}

export const PeriodicTasks = new PeriodicTasksApi();
