# IntelliJ Mattermost Plugin

This project is a Gradle Kotlin DSL build of the Mattermost integration plugin for IntelliJ-based IDEs. It targets IntelliJ Platform build 252 (2024.3) and later.

## Features

- Configure Mattermost personal access tokens directly from the IDE settings.
- Tool window for browsing teams and channels and posting messages.
- Context action to send the current editor selection to the configured channel.

## Building

```bash
gradle build
```

## Running the IDE Sandbox

```bash
gradle runIde
```

## Requirements

- Java 21+
- IntelliJ IDEA 2024.3 or compatible IDE.
