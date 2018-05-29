# Smartmon

`smartmon` is a small cli tool to automatically restart your nodejs application
when a change occurs in any of the files required by your main script (including symlinked node_modules!).

## Features

* No configuration - drop in replacement for the node cli.
* Watch only dependencies - Only changes in your requires script will cause a restart to your node application.
* Symlinks supported - for use cases like symlinked node modules.
* Monorepos supported - specifically created for monorepos support. 

### Motivation

Current tools used for automatically restarting your node process, are based on watching directories and files defined 
by the developer. In certain scenarios, this means watching files that are not really apart of your application, meaning 
unnecessary restarts.

Also, in a monorepo, you probably want to restart your node server when there is a change in another
package dependency. Using directory watching to watch the folder in the node_modules would also mean watching files that 
are not actually related to your running node process. 

## Usage

Install `smartmon` globally:

npm:
```bash
npm i -g @botique/smartmon
```

yarn:
```bash
yarn global add @botique/smartmon
```

run your script with smartmon:
```bash
smartmon main.js
```

### Debugging and flags

`smartmon` currently comes with no configuration options. All flags are passed to the node process. You can use debugging flags and more as usual.

## What's inside

`smartmon`'s smarts are powered by two awesome libraries: `depedency-tree` and `watchpack`. `dependency-tree` is used to
find all the files that are required by your main script (and their dependencies) and watchpack is used for the same
abstraction it is used by webpack, keeping the amount of watchers minimal when watching lots of files, that could be 
located across directories.