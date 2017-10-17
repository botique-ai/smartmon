import {toList} from "dependency-tree";
import * as Watchpack from "watchpack";
import {realpathSync} from "fs";
import {ChildProcess, spawn} from "child_process";
import {asLines} from "treeify";
import {bgCyan, yellow} from "chalk";

export function log(...args) {
  console.log(yellow.bold(`[smartmon]`), yellow(...args));
}

export function runAndWatchScript(scriptPath: string, nodeArguments: string[]) {
  let childProcess: ChildProcess;

  const wp = new Watchpack();
  wp.on('aggregated', changedFiles => {
    log(`A change was detected in the following files:`);
    asLines(changedFiles, true, false, line => log(line));
    log('Updating watched scripts and restarting...');
    watchScriptWithDependencies(wp, scriptPath);
    crash(childProcess);
    childProcess = runScript(scriptPath, nodeArguments);
  });

  watchScriptWithDependencies(wp, scriptPath);
  childProcess = runScript(scriptPath, nodeArguments);
}

export function watchScriptWithDependencies(wp: any, scriptPath: string) {
  const filesToWatch = toList({
    filename: scriptPath,
    directory: process.cwd()
  }) || [];

  const filesRealPath = filesToWatch.map(x => realpathSync(x));
  wp.watch(filesRealPath, [], Date.now());
}

export function runScript(scriptPath: string,
                          nodeArguments: string[]) {
  log(`Spawning new child process with script ${scriptPath} ...`);
  const childProcess = spawn('node', [scriptPath, ...nodeArguments], {stdio: 'inherit'});
  childProcess.addListener("exit", exitCode => {
    log(`Child process exited with code ${exitCode}.`);
    log(`Still watching for changes in all dependencies...`);
  });
  return childProcess;
}

function crash(childProcess: ChildProcess) {
  log("Crashing child process...");
  childProcess.kill("SIGTERM");
}

