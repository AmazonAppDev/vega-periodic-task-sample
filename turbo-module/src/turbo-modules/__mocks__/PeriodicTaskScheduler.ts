// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Jest manual mock: the C++ Turbo Module doesn't exist under Jest.
const tasks = new Map<string, string>();
const runs: string[] = [];
let nextId = 1;

export default {
  scheduleRepeatingTask: (
    _componentId: string,
    name: string,
    intervalSeconds: number,
    _requireInternet: boolean,
  ) => {
    if (intervalSeconds < 60) {
      return Promise.reject(new Error('intervalSeconds must be at least 60'));
    }
    if (tasks.has(name)) {
      return Promise.reject(
        new Error(`A task named '${name}' is already scheduled`),
      );
    }
    const uuid = `00000000-0000-0000-0000-${String(nextId++).padStart(
      12,
      '0',
    )}`;
    tasks.set(name, uuid);
    return Promise.resolve(uuid);
  },
  getTaskState: (name: string) => (tasks.has(name) ? 'PENDING' : 'NOT_FOUND'),
  getScheduledTaskNames: () => Array.from(tasks.keys()).sort(),
  cancelTask: (name: string) => tasks.delete(name),
  cancelAllTasks: () => {
    const count = tasks.size;
    tasks.clear();
    return count;
  },
  recordRun: (timestamp: string) => {
    runs.unshift(timestamp);
    runs.splice(20);
  },
  getRunHistory: () => [...runs],
  clearRunHistory: () => {
    runs.length = 0;
  },
};
