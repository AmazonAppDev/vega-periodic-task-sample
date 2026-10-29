// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const moduleRoot = path.resolve(__dirname, 'turbo-module');
const escape = p => p.replace(/[/\\^$.*+?()[\]{}|-]/g, '\\$&');
const below = dir => new RegExp(`^${escape(path.join(moduleRoot, dir))}[/\\\\].*`);

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    blockList: [
      defaultConfig.resolver.blockList,
      // The Turbo Module's native build output. Its sysroot is full of
      // symlinks that break Metro's file map ("already exists in the file map
      // as a file").
      below('build'),
      // The Turbo Module's own dev dependencies (Jest, TypeScript, ...). Its
      // runtime dependency resolves from the app's node_modules instead, so
      // the app bundles a single copy.
      below('node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
