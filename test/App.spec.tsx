// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'react-native';
import {fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';

import {App} from '../src/App';
import {doPeriodicTask} from '../src/PeriodicTask';

// The C++ Turbo Module doesn't exist under Jest; use the library's manual mock.
jest.mock('../turbo-module/src/turbo-modules/PeriodicTaskScheduler');

describe('App', () => {
  it('schedules and cancels the task through the Turbo Module', async () => {
    const screen = render(<App />);
    expect(
      screen.getByText(
        "On launch: getState('periodicDemo') -> NOT_FOUND, no runs recorded yet",
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('action-schedule'));
    expect(
      await screen.findByText(/^scheduleRepeating\('periodicDemo'\) resolved -> /),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('action-state'));
    expect(screen.getByText("getState('periodicDemo') -> PENDING")).toBeTruthy();

    fireEvent.press(screen.getByTestId('action-cancel'));
    expect(screen.getByText("cancel('periodicDemo') -> true")).toBeTruthy();
  });

  it('shows runs recorded by the headless task', async () => {
    await doPeriodicTask();
    const screen = render(<App />);
    expect(
      screen.getByText(/^On launch: getState\('periodicDemo'\) -> NOT_FOUND, 1 runs, latest /),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('action-clear-history'));
    fireEvent.press(screen.getByTestId('action-history'));
    expect(screen.getByText('Run history: no runs recorded yet')).toBeTruthy();
  });
});
