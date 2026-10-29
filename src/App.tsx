// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, {useEffect, useState} from 'react';
import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import {PeriodicTasks} from '@amazon-devices/periodic-task-scheduler';

import {ActionButton} from './components';
import {
  TASK_COMPONENT_ID,
  TASK_INTERVAL_SECONDS,
  TASK_NAME,
} from './taskConfig';
import {COLORS, FONT_SIZES, SAFE_ZONE_INSET} from './theme';

type Action = {
  id: string;
  label: string;
  run: (log: (line: string) => void) => void;
};

// The log shows the newest lines only, so it fits on screen without scrolling.
const MAX_LOG_LINES = 12;

const describeRuns = (runs: string[]): string =>
  runs.length === 0
    ? 'no runs recorded yet'
    : `${runs.length} runs, latest ${runs.slice(0, 3).join(', ')}`;

const ACTIONS: Action[] = [
  {
    id: 'schedule',
    label: `Schedule (${TASK_INTERVAL_SECONDS}s)`,
    run: (log) => {
      PeriodicTasks.scheduleRepeating({
        componentId: TASK_COMPONENT_ID,
        name: TASK_NAME,
        intervalSeconds: TASK_INTERVAL_SECONDS,
      })
        .then((uuid) => log(`scheduleRepeating('${TASK_NAME}') resolved -> ${uuid}`))
        .catch((e: Error) => log(`scheduleRepeating rejected -> ${e.message}`));
    },
  },
  {
    id: 'state',
    label: 'State',
    run: (log) => log(`getState('${TASK_NAME}') -> ${PeriodicTasks.getState(TASK_NAME)}`),
  },
  {
    id: 'list',
    label: 'List',
    run: (log) =>
      log(`getScheduledNames() -> ${JSON.stringify(PeriodicTasks.getScheduledNames())}`),
  },
  {
    id: 'history',
    label: 'History',
    run: (log) =>
      log(`Run history: ${describeRuns(PeriodicTasks.getRunHistory())}`),
  },
  {
    id: 'cancel',
    label: 'Cancel',
    run: (log) => log(`cancel('${TASK_NAME}') -> ${PeriodicTasks.cancel(TASK_NAME)}`),
  },
  {
    id: 'cancel-all',
    label: 'Cancel all',
    run: (log) => log(`cancelAll() -> ${PeriodicTasks.cancelAll()}`),
  },
  {
    id: 'clear-history',
    label: 'Clear history',
    run: (log) => {
      PeriodicTasks.clearRunHistory();
      log('clearRunHistory()');
    },
  },
];

// The task keeps its schedule after the app exits, so on launch show whether
// it's still scheduled and how many times it ran while the app was closed.
const describeLaunchState = (): string => {
  try {
    return `On launch: getState('${TASK_NAME}') -> ${PeriodicTasks.getState(
      TASK_NAME,
    )}, ${describeRuns(PeriodicTasks.getRunHistory())}`;
  } catch (e) {
    return `On launch: read failed -> ${(e as Error).message}`;
  }
};

export const App = () => {
  const [lines, setLines] = useState<string[]>(() => [describeLaunchState()]);

  const log = (line: string) => {
    // Also write to the device log so results can be checked without the screen.
    console.log(`[PeriodicTaskSample] ${line}`);
    setLines((prev) => [line, ...prev].slice(0, MAX_LOG_LINES));
  };

  useEffect(() => {
    console.log(`[PeriodicTaskSample] ${lines[lines.length - 1]}`);
    // Only log the launch state once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageBackground
      source={require('./assets/background.png')}
      style={styles.background}>
      <Text style={styles.title}>PeriodicTaskScheduler</Text>
      <Text style={styles.subtitle}>
        Runs headless task '{TASK_NAME}' every ~{TASK_INTERVAL_SECONDS}s, even
        with the app closed.
      </Text>

      <View style={styles.buttonRow}>
        {ACTIONS.map((action, index) => (
          <ActionButton
            key={action.id}
            testID={`action-${action.id}`}
            label={action.label}
            hasTVPreferredFocus={index === 0}
            onPress={() => {
              try {
                action.run(log);
              } catch (e) {
                log(`${action.label} threw -> ${(e as Error).message}`);
              }
            }}
          />
        ))}
      </View>

      <View style={styles.logBox}>
        {lines.map((line, i) => (
          <Text
            key={`${i}-${line}`}
            style={styles.logLine}
            numberOfLines={2}
            testID="log-line">
            {line}
          </Text>
        ))}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // The background image fills the screen; the content stays in the safe zone.
    padding: SAFE_ZONE_INSET,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    // Shadow keeps text readable over the background image.
    textShadowColor: COLORS.textShadow,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  subtitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    lineHeight: 32,
    marginTop: 8,
    marginBottom: 24,
    textShadowColor: COLORS.textShadow,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  logBox: {
    flex: 1,
    // Keep room for at least 5 log lines even on small screens.
    minHeight: 180,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: COLORS.logBackground,
    overflow: 'hidden',
  },
  logLine: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.log,
    lineHeight: 28,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
