#!/usr/bin/env bash

# Smoke test to ensure that the CLI actually works as a CLI. Otherwise, it might run in Jest but fail
# when executed from Node (e.g. because of a missing ".js" in an import, which is required for ESM).

set -e
set -x

for TRANSFORM in $(ls ./tests/fixtures); do
  for DIR in $(ls "tests/fixtures/${TRANSFORM}"); do
    mkdir -p "/tmp/lwc-codemod-tests/${TRANSFORM}"
    cp -R "./tests/fixtures/${TRANSFORM}/${DIR}" "/tmp/lwc-codemod-tests/${TRANSFORM}/${DIR}"

    node ./transforms/cli.js "${TRANSFORM}" "/tmp/lwc-codemod-tests/${TRANSFORM}/${DIR}"
  done
done

rm -fr /tmp/lwc-codemod-tests
