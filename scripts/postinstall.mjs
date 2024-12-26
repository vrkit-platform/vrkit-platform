#!/usr/bin/env node

import {$, usePwsh} from "zx"

usePwsh()
await $`rm -Recurse -Force ./packages/js/*/node_modules/@3fv/*`