import {toList} from "dependency-tree";
import * as Watchpack from "watchpack";
import {realpathSync, lstatSync} from "fs";
import {ChildProcess, spawn} from "child_process";
import {asLines} from "treeify";
import chalk from "chalk";
import * as union from "lodash.union";
import * as compact from "lodash.compact";
import { sep } from "path";
import { format } from "date-fns";

export function log(...args) {
  console.log(chalk.yellow.bold(`[smartmon ${format(new Date(), "YYYY-MM-DD HH:mm:ss.SSS")}]`), chalk.yellow(...args));
}

const NODE_MODULES_DIR = "node_modules";
const MAX_CHANGED_FILES_TO_LOG = 15;
const WATCH_AGGREGATE_TIMEOUT = 3000;

export function createFilterFunction() {
  const knownModules: { [moduleName: string]: boolean } = {};
  return function shouldFileBeListed(path) {
    if (path.indexOf(NODE_MODULES_DIR) === -1) {
      return true;
    }
    else {
      const indexAfterNodeModules= path.indexOf(NODE_MODULES_DIR) + NODE_MODULES_DIR.length + 1;
      const pathAfterNodeModules = path.substr(indexAfterNodeModules);
      let moduleName = pathAfterNodeModules.split(sep)[0];
  
      if (moduleName.startsWith("@")) {
          moduleName = pathAfterNodeModules.substr(0, pathAfterNodeModules.split(sep, 2).join(sep).length);
      }

      if (!(moduleName in knownModules)) {
        const modulePath = path.substr(0, indexAfterNodeModules + moduleName.length);
        const isModuleSymLinked = lstatSync(modulePath).isSymbolicLink();
        knownModules[moduleName] = isModuleSymLinked;
      }

      return knownModules[moduleName];
    }
  }
}

export function runAndWatchScript(scriptPath: string, nodeArguments: string[]) {
  log("Initializing dependency tree watch and running script... ");
  let childProcess: ChildProcess;
  let filesToWatch;

  const filesFilterFunction = createFilterFunction();

  filesToWatch = toList({
    filename: scriptPath,
    filter: filesFilterFunction,
    directory: process.cwd()
  }) || [];

  const wp = new Watchpack({aggregateTimeout: WATCH_AGGREGATE_TIMEOUT});
  wp.on('aggregated', changedFiles => {
    if (changedFiles.length > MAX_CHANGED_FILES_TO_LOG) {
      log(`A change was detected in ${changedFiles.length} files.`)
    }
    else {
      log(`A change was detected in the following files:`);
      asLines(changedFiles, true, false, line => log(line));
    }

    crash(childProcess);

    log('Updating watched scripts and restarting...');

    let changedFilesDepenedencies = [];

    for (const changedFile of changedFiles) {
      if (!changedFilesDepenedencies.includes(changedFile)) {
        const dependencyList = toList({
          filename: changedFile,
          filter: path => changedFiles.includes(path),
          directory: process.cwd()
        });
        changedFilesDepenedencies = union(changedFilesDepenedencies, dependencyList);
      }
    }

    filesToWatch = union(changedFilesDepenedencies, filesToWatch);

    childProcess = updateWatchedFilesAndRunScript(wp, filesToWatch, scriptPath, nodeArguments);
  });

  childProcess = updateWatchedFilesAndRunScript(wp, filesToWatch, scriptPath, nodeArguments);
}

export function updateWatchedFilesAndRunScript(wp: any, filesToWatch: string[], scriptPath: string, nodeArguments: string[]) {
  watchScriptWithDependencies(wp, filesToWatch);
  return runScript(scriptPath, nodeArguments);
}

export function watchScriptWithDependencies(wp: any, filesToWatch: string[]) {
  log(`Setting up watch on ${filesToWatch.length} files...`);
  const filesRealPath = filesToWatch.map(x => {
    try {
      return realpathSync(x);
    }
    catch (err) {
      return null;
    }
  });
  wp.watch(compact(filesRealPath), [], Date.now());
}

export function runScript(scriptPath: string,
                          nodeArguments: string[]) {
  log(`Spawning new child process with script ${scriptPath} ...`);
  const childProcess = spawn('node', nodeArguments, {stdio: 'inherit'});
  childProcess.addListener("exit", (exitCode, signal) => {
    if (!signal) {
      log(`Child process exited with code ${exitCode}.`);
      log(`Still watching for changes in all dependencies...`);
    }
  });
  return childProcess;
}

function crash(childProcess: ChildProcess) {
  log("Crashing child process...");
  childProcess.kill("SIGTERM");
}

