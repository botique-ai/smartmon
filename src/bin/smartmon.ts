#!/usr/bin/env node
import {toList} from "dependency-tree";
import {map} from "lodash";
import {runAndWatchScript} from "../index";

const scriptToRun = process.argv[2];
const nodeArguments = process.argv.slice(2);

runAndWatchScript(scriptToRun, nodeArguments);