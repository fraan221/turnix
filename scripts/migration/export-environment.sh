#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(git -C "$SCRIPT_DIR/../.." rev-parse --show-toplevel)"
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
BASE_DEST="${1:-$(dirname "$REPO_ROOT")}"

if ! command -v rsync >/dev/null 2>&1; then
  printf 'Error: se necesita rsync para exportar el entorno.\n' >&2
  exit 1
fi

BASE_DEST="$(realpath -m -- "$BASE_DEST")"
REPO_ROOT="$(realpath -- "$REPO_ROOT")"
OUTPUT_DIR="$BASE_DEST/turnix-migration-$TIMESTAMP"

if [[ "$BASE_DEST" == "$REPO_ROOT" || "$BASE_DEST" == "$REPO_ROOT"/* ]]; then
  printf 'Error: el destino debe estar fuera del repositorio.\n' >&2
  exit 1
fi

declare -a STATUSES=()
declare -a WARNINGS=()
readonly -a RSYNC_EXCLUDES=(
  '--exclude=.env'
  '--exclude=.env.*'
  '--exclude=*.pem'
  '--exclude=*.key'
  '--exclude=id_*'
  '--exclude=credentials*'
  '--exclude=*secret*'
  '--exclude=*token*'
  '--exclude=sessions/'
  '--exclude=cache/'
  '--exclude=caches/'
)

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

warn() {
  WARNINGS+=("$1")
  printf 'Advertencia: %s\n' "$1" >&2
}

record_status() {
  STATUSES+=("$1|$2")
}

copy_path() {
  local source="$1"
  local destination="$2"
  local required="$3"
  local label="$4"

  if [[ ! -e "$source" && ! -L "$source" ]]; then
    if [[ "$required" == true ]]; then
      die "no existe la ruta requerida: $source"
    fi
    warn "ruta opcional ausente: $source"
    record_status "$label" "ausente"
    return 0
  fi

  mkdir -p "$(dirname -- "$destination")"
  if [[ -d "$source" ]]; then
    mkdir -p "$destination"
    rsync -a --links "${RSYNC_EXCLUDES[@]}" "$source/" "$destination/"
  else
    rsync -a --links "${RSYNC_EXCLUDES[@]}" "$source" "$destination"
  fi
  record_status "$label" "copiado"
}

copy_global_json() {
  local source="$HOME/.config/opencode/opencode.json"
  local destination="$OUTPUT_DIR/global/opencode/opencode.json"

  if [[ ! -f "$source" ]]; then
    warn "configuracion global de OpenCode ausente"
    record_status "global/opencode/opencode.json" "ausente"
    return 0
  fi

  if grep -Eiq 'key|secret|token|password|credential|auth' "$source"; then
    warn "configuracion global de OpenCode omitida por nombres sensibles"
    record_status "global/opencode/opencode.json" "omitido por seguridad"
    return 0
  fi

  mkdir -p "$(dirname -- "$destination")"
  rsync -a --links "$source" "$destination"
  record_status "global/opencode/opencode.json" "copiado"
}

write_inventory() {
  local output="$1"
  local label="$2"
  shift 2

  if "$@" >"$output" 2>/dev/null; then
    record_status "$label" "disponible"
  else
    printf '# Inventario no disponible en este sistema.\n' >"$output"
    warn "no se pudo generar $label"
    record_status "$label" "no disponible"
  fi
}

write_tool_versions() {
  local output="$OUTPUT_DIR/manifests/development-tools.txt"
  : >"$output"
  local tool version
  for tool in bash git node pnpm opencode docker podman flatpak; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      printf '%s: no disponible\n' "$tool" >>"$output"
      continue
    fi
    version="$($tool --version 2>/dev/null | { IFS= read -r line || true; printf '%s' "$line"; })"
    printf '%s: %s\n' "$tool" "${version:-version no informada}" >>"$output"
  done
  record_status "manifests/development-tools.txt" "disponible"
}

write_manifest() {
  local status
  {
    printf '# Manifiesto de migracion\n\n'
    printf -- '- Fecha: %s\n' "$(date --iso-8601=seconds)"
    printf -- '- Repositorio: %s\n\n' "$(basename "$REPO_ROOT")"
    printf '## Elementos\n\n'
    for status in "${STATUSES[@]}"; do
      printf -- '- %s: %s\n' "${status%%|*}" "${status#*|}"
    done
    printf '\n## Advertencias\n\n'
    if ((${#WARNINGS[@]} == 0)); then
      printf -- '- Ninguna.\n'
    else
      for status in "${WARNINGS[@]}"; do
        printf -- '- %s\n' "$status"
      done
    fi
    printf '\n## Exclusiones aplicadas\n\n'
    printf -- '- `.env` y `.env.*`\n- `*.pem` y `*.key`\n- `id_*`\n'
    printf -- '- nombres que contienen `credentials`, `secret` o `token`\n'
    printf -- '- `sessions/`, `cache/` y `caches/`\n'
    printf -- '- configuracion global de OpenCode con nombres sensibles\n'
  } >"$OUTPUT_DIR/MIGRATION-MANIFEST.md"
}

mkdir -p "$OUTPUT_DIR/project" "$OUTPUT_DIR/global" "$OUTPUT_DIR/manifests"

copy_path "$REPO_ROOT/AGENTS.md" "$OUTPUT_DIR/project/AGENTS.md" true "project/AGENTS.md"
copy_path "$REPO_ROOT/opencode.json" "$OUTPUT_DIR/project/opencode.json" true "project/opencode.json"
copy_path "$REPO_ROOT/skills-lock.json" "$OUTPUT_DIR/project/skills-lock.json" true "project/skills-lock.json"
copy_path "$REPO_ROOT/.agents" "$OUTPUT_DIR/project/.agents" true "project/.agents"
copy_path "$REPO_ROOT/.opencode" "$OUTPUT_DIR/project/.opencode" false "project/.opencode"
copy_path "$REPO_ROOT/.gitignore" "$OUTPUT_DIR/project/.gitignore" true "project/.gitignore"

copy_global_json
copy_path "$HOME/.config/opencode/agent" "$OUTPUT_DIR/global/agents" false "global/agents from opencode/agent"
copy_path "$HOME/.config/opencode/agents" "$OUTPUT_DIR/global/agents" false "global/agents from opencode/agents"
copy_path "$HOME/.config/opencode/skill" "$OUTPUT_DIR/global/skills" false "global/skills from opencode/skill"
copy_path "$HOME/.config/opencode/skills" "$OUTPUT_DIR/global/skills" false "global/skills from opencode/skills"
copy_path "$HOME/.agents/skills" "$OUTPUT_DIR/global/skills" false "global/skills from .agents"
copy_path "$HOME/.claude/skills" "$OUTPUT_DIR/global/claude-skills" false "global/claude-skills"

write_tool_versions
if command -v pacman >/dev/null 2>&1; then
  write_inventory "$OUTPUT_DIR/manifests/arch-packages.txt" "manifests/arch-packages.txt" pacman -Qqe
  write_inventory "$OUTPUT_DIR/manifests/aur-packages.txt" "manifests/aur-packages.txt" pacman -Qqm
else
  printf '# pacman no esta disponible en este sistema.\n' >"$OUTPUT_DIR/manifests/arch-packages.txt"
  printf '# pacman no esta disponible en este sistema.\n' >"$OUTPUT_DIR/manifests/aur-packages.txt"
  record_status "manifests/arch-packages.txt" "no disponible"
  record_status "manifests/aur-packages.txt" "no disponible"
fi
if command -v flatpak >/dev/null 2>&1; then
  write_inventory "$OUTPUT_DIR/manifests/flatpak-apps.txt" "manifests/flatpak-apps.txt" flatpak list --app --columns=application,version
else
  printf '# flatpak no esta disponible en este sistema.\n' >"$OUTPUT_DIR/manifests/flatpak-apps.txt"
  record_status "manifests/flatpak-apps.txt" "no disponible"
fi

write_manifest
printf 'Exportacion creada en: %s\n' "$OUTPUT_DIR"
