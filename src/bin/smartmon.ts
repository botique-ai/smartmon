#!/usr/bin/env node
import {toList} from "dependency-tree";
import {runAndWatchScript} from "../index";
import * as minimist from "minimist";

const nodeCLIOptionsNames = [
  'v', 'version',
  'h', 'help',
  'e', 'eval',
  'p', 'print',
  'c', 'check',
  'i', 'interactive',
  'r', 'require',
  'inspect', 'inspect-brk','inspect-port',
  'no-deprecation',
  'trace-deprecation',
  'throw-deprecation',
  'pending-deprecation',
  'no-warnings',
  'expose-http2',
  'abort-on-uncaught-exception',
  'trace-warnings',
  'redirect-warnings',
  'trace-sync-io',
  'trace-events-enabled',
  'trace-event-categories',
  'zero-fill-buffers',
  'preserve-symlinks',
  'track-heap-objects',
  'prof-process',
  'v8-options',
  'tls-cipher-list',
  'enable-fips',
  'force-fips',
  'openssl-config',
  'use-openssl-ca', 'use-bundled-ca',
  'icu-data-dir'
];

// Make minimist treat all node cli options as boolean, to easily find the running script name
const argv = minimist(process.argv.slice(2), {boolean: nodeCLIOptionsNames});

const scriptToRun = argv._[0] === 'debug' || argv._[0] === 'inspect' ? argv._[1] : argv._[0];
const nodeArguments = process.argv.slice(2);

runAndWatchScript(scriptToRun, nodeArguments);