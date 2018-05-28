import {toList} from "dependency-tree";
import * as Watchpack from "watchpack";
import {realpathSync} from "fs";
import {ChildProcess, spawn} from "child_process";
import {asLines} from "treeify";
import chalk from "chalk";
import * as union from "lodash.union";
import * as compact from "lodash.compact";

export function log(...args) {
  console.log(chalk.yellow.bold(`[smartmon]`), chalk.yellow(...args));
}

export function runAndWatchScript(scriptPath: string, nodeArguments: string[]) {
  log("Initializing dependency tree watch and running script... ");
  let childProcess: ChildProcess;
  let filesToWatch;

  const wp = new Watchpack();
  wp.on('aggregated', changedFiles => {
    log(`A change was detected in the following files:`);
    asLines(changedFiles, true, false, line => log(line));

    crash(childProcess);

    log('Updating watched scripts and restarting...');

    let changedFilesDepenedencies = [];

    for (const changedFile of changedFiles) {
      if (!changedFilesDepenedencies.includes(changedFile)) {
        const dependencyList = toList({
          filename: changedFile,
          directory: process.cwd()
        });
        changedFilesDepenedencies = union(changedFilesDepenedencies, dependencyList);
      }
    }

    filesToWatch = union(changedFilesDepenedencies, filesToWatch);

    childProcess = updateWatchedFilesAndRunScript(wp, filesToWatch, scriptPath, nodeArguments);
  });

  filesToWatch = toList({
    filename: scriptPath,
    directory: process.cwd()
  }) || [];

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

