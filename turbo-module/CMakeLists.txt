# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

cmake_minimum_required(VERSION 3.22)

project(PeriodicTaskScheduler
        VERSION 1.0
        LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Fail at compile time for unresolved symbols. This can catch cases
# where we forget to add .cpp files to the CMake target shared object
# library. If your use case requires dynamic symbol linking, remove
# these lines.
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_link_options("LINKER:--no-undefined" "LINKER:-z,defs")
endif()

if (CMAKE_SYSTEM_NAME STREQUAL Android)
  add_compile_definitions(ANDROID)
endif()

set(HEADERS
  kepler/turbo-modules/generated/PeriodicTaskSchedulerSpec.h
  kepler/turbo-modules/PeriodicTaskScheduler.h
)
set(SOURCES
    kepler/turbo-modules/generated/PeriodicTaskSchedulerSpec.cpp
    kepler/turbo-modules/PeriodicTaskScheduler.cpp
    kepler/AutoLinkInit.cpp
)

find_package(Apmf REQUIRED)
find_package(Kepler REQUIRED)
find_package(turbomoduleAPI CONFIG REQUIRED)

# Generates the C++ headers for the Vega Task Manager platform API from its IDL
# (tasks.idl in package KeplerAppInterface in the SDK) and links the interface library.
kepler_add_idl_import_library(
  idl_pkg
  PACKAGES
  com.amazon.kepler.tasks
)

kepler_add_turbo_module_library(PeriodicTaskScheduler SHARED ${HEADERS} ${SOURCES})

list(APPEND LIBRARIES idl_pkg)

if (CMAKE_SYSTEM_NAME STREQUAL Android)
    list(APPEND LIBRARIES
        android log)
endif()
target_link_libraries(PeriodicTaskScheduler PRIVATE ${LIBRARIES})

install(TARGETS PeriodicTaskScheduler)
