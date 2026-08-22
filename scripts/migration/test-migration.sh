#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel)"
EXPORTER="$REPO_ROOT/scripts/migration/export-environment.sh"
RESTORER="$REPO_ROOT/scripts/migration/restore-kubuntu.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf -- "$TEST_ROOT"' EXIT

fail() {
  printf 'Test failed: %s\n' "$1" >&2
  exit 1
}

assert_file() {
  [[ -f "$1" ]] || fail "falta el archivo esperado: $1"
}

assert_dir_absent() {
  [[ ! -e "$1" ]] || fail "la simulacion modifico: $1"
}

assert_dir() {
  [[ -d "$1" ]] || fail "falta el directorio esperado: $1"
}

assert_contains() {
  grep -Fq -- "$1" "$2" || fail "no se encontro el texto esperado"
}

assert_not_contains_recursive() {
  if grep -R -Fq -- "$1" "$2"; then
    fail "se encontro contenido sensible en el backup"
  fi
}

if ! command -v rsync >/dev/null 2>&1; then
  fail 'rsync no esta instalado'
fi

FIXTURE_HOME="$TEST_ROOT/home"
BACKUP_PARENT="$TEST_ROOT/backups"
RESTORE_HOME="$TEST_ROOT/restore-home"
mkdir -p "$FIXTURE_HOME/.agents/skills/example" "$FIXTURE_HOME/.claude/skills/example" "$FIXTURE_HOME/.config/opencode" "$BACKUP_PARENT" "$RESTORE_HOME"
printf '# Skill fixture\n' >"$FIXTURE_HOME/.agents/skills/example/SKILL.md"
printf '# Claude skill fixture\n' >"$FIXTURE_HOME/.claude/skills/example/SKILL.md"
printf 'fixture-secret\n' >"$FIXTURE_HOME/.agents/skills/example/token.txt"
printf 'fixture-secret\n' >"$FIXTURE_HOME/.agents/skills/example/.env"
printf '{"apiToken":"fixture-secret"}\n' >"$FIXTURE_HOME/.config/opencode/opencode.json"

EXPORT_OUTPUT="$TEST_ROOT/export-output.txt"
(cd /tmp && HOME="$FIXTURE_HOME" bash "$EXPORTER" "$BACKUP_PARENT") >"$EXPORT_OUTPUT"
BACKUP="$(find "$BACKUP_PARENT" -mindepth 1 -maxdepth 1 -type d -name 'turnix-migration-*' -print -quit)"
[[ -n "$BACKUP" ]] || fail 'no se genero el directorio de backup'

assert_file "$BACKUP/MIGRATION-MANIFEST.md"
assert_file "$BACKUP/project/opencode.json"
assert_file "$BACKUP/project/.agents/skills/ui-ux-pro-max/SKILL.md"
assert_file "$BACKUP/manifests/development-tools.txt"
assert_file "$BACKUP/manifests/arch-packages.txt"
assert_file "$BACKUP/manifests/aur-packages.txt"
assert_file "$BACKUP/manifests/flatpak-apps.txt"
assert_not_contains_recursive 'fixture-secret' "$BACKUP"

SIMULATION_OUTPUT="$TEST_ROOT/simulation-output.txt"
(cd /tmp && HOME="$RESTORE_HOME" bash "$RESTORER" "$BACKUP") >"$SIMULATION_OUTPUT"
assert_contains 'SIMULAR' "$SIMULATION_OUTPUT"
assert_not_contains_recursive 'fixture-secret' "$SIMULATION_OUTPUT"
assert_dir_absent "$RESTORE_HOME/.config/opencode/skills"
assert_dir_absent "$RESTORE_HOME/.claude/skills"

HOME="$RESTORE_HOME" bash "$RESTORER" "$BACKUP" --apply >"$TEST_ROOT/apply-output.txt"
assert_file "$RESTORE_HOME/.config/opencode/skills/example/SKILL.md"
assert_dir "$RESTORE_HOME/.claude/skills"
HOME="$RESTORE_HOME" bash "$RESTORER" "$BACKUP" --apply >"$TEST_ROOT/apply-again-output.txt"
BACKUP_COUNT="$(find "$RESTORE_HOME" -name '*.backup.*' -print | wc -l | tr -d ' ')"
((BACKUP_COUNT > 0)) || fail 'no se creo backup antes de sobrescribir'

printf 'Migration tests passed.\n'
