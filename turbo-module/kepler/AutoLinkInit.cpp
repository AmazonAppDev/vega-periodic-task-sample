// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

#include "turbo-modules/PeriodicTaskScheduler.h"

#include <Kepler/turbomodule/KeplerTurboModuleRegistration.h>

extern "C" {
__attribute__((visibility("default"))) void
    autoLinkKeplerTurboModulesV1() noexcept {
        KEPLER_REGISTER_TURBO_MODULE(PeriodicTaskSchedulerTurboModule, PeriodicTaskScheduler);
 }
}
