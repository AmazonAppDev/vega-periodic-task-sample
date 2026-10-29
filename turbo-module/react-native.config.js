// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

module.exports = {
    dependency: {
        platforms: {
            kepler: {
                "autolink": {
                    "PeriodicTaskScheduler": {
                        "libraryName": "libPeriodicTaskScheduler.so",
                        "linkDynamic": true,
                        "provider": "application",
                        "components": [],
                        "turbomodules": [
                            "PeriodicTaskScheduler"
                        ]
                    }
                }
            },
        },
    },
};