// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {HeadlessEntryPointRegistry} from '@amazon-devices/headless-task-manager';

import {doPeriodicTask} from './src/PeriodicTask';
import {TASK_COMPONENT_ID} from './src/taskConfig';

// Entry point for the headless task component in manifest.toml. The key is
// '<component id>::doTask'. The build bundles this file as task.hermes.bundle;
// registering it in index.js or service.js instead would not work.
HeadlessEntryPointRegistry.registerHeadlessEntryPoint2(
  `${TASK_COMPONENT_ID}::doTask`,
  () => doPeriodicTask,
);
