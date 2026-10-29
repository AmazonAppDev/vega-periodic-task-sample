// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {PeriodicTasks} from '../src';

jest.mock('../src/turbo-modules/PeriodicTaskScheduler');

const options = {
  componentId: 'com.example.app.periodicTask',
  name: 'sync',
  intervalSeconds: 900,
};

describe('PeriodicTasks', () => {
  beforeEach(() => PeriodicTasks.cancelAll());

  it('schedules a task and reports its state', async () => {
    expect(PeriodicTasks.getState('sync')).toBe('NOT_FOUND');
    await expect(PeriodicTasks.scheduleRepeating(options)).resolves.toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(PeriodicTasks.getState('sync')).toBe('PENDING');
    expect(PeriodicTasks.getScheduledNames()).toEqual(['sync']);
  });

  it('rejects a duplicate name', async () => {
    await PeriodicTasks.scheduleRepeating(options);
    await expect(PeriodicTasks.scheduleRepeating(options)).rejects.toThrow(
      'already scheduled',
    );
  });

  it('rejects an interval under 60 seconds', async () => {
    await expect(
      PeriodicTasks.scheduleRepeating({...options, intervalSeconds: 30}),
    ).rejects.toThrow('at least 60');
  });

  it('cancels one task', async () => {
    await PeriodicTasks.scheduleRepeating(options);
    expect(PeriodicTasks.cancel('sync')).toBe(true);
    expect(PeriodicTasks.cancel('sync')).toBe(false);
    expect(PeriodicTasks.getState('sync')).toBe('NOT_FOUND');
  });

  it('records runs newest first and clears them', () => {
    PeriodicTasks.clearRunHistory();
    PeriodicTasks.recordRun('first');
    PeriodicTasks.recordRun('second');
    expect(PeriodicTasks.getRunHistory()).toEqual(['second', 'first']);
    PeriodicTasks.clearRunHistory();
    expect(PeriodicTasks.getRunHistory()).toEqual([]);
  });

  it('cancels all tasks', async () => {
    await PeriodicTasks.scheduleRepeating(options);
    await PeriodicTasks.scheduleRepeating({...options, name: 'other'});
    expect(PeriodicTasks.cancelAll()).toBe(2);
    expect(PeriodicTasks.getScheduledNames()).toEqual([]);
  });
});
