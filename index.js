// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {AppRegistry} from 'react-native';

import {name as appName} from './app.json';
import {App} from './src/App';

AppRegistry.registerComponent(appName, () => App);
