#!/usr/bin/env bash

set -Eeuo pipefail

APPLY=false
BACKUP=""
for argument in "$@"; do
  case "$argument" in
    --apply)
      APPLY=true
      ;;
    --help|-h)
      printf 'Uso: %s BACKUP [--apply]\n' "$0"
      exit 0
      ;;
    *)
      if [[ -n "$BACKUP" ]]; then
        printf 'Error: argumento desconocido o backup duplicado: %s\n' "$argument" >&2
        exit 1
      fi
      BACKUP="$argument"
      ;;
  esac
done

if [[ -z "$BACKUP" ]]; then
  printf 'Uso: %s BACKUP [--apply]\n' "$0" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  printf 'Error: se necesita rsync para restaurar el entorno.\n' >&2
  exit 1
fi

BACKUP="$(realpath -- "$BACKUP")"
if [[ ! -d "$BACKUP" ]]; then
  printf 'Error: el backup no es un directorio: %s\n' "$BACKUP" >&2
  exit 1
fi

for required in MIGRATION-MANIFEST.md project global manifests; do
  if [[ ! -e "$BACKUP/$required" ]]; then
    printf 'Error: falta un elemento requerido del backup: %s\n' "$required" >&2
    exit 1
  fi
done

SUSPICIOUS="$(find "$BACKUP" \( \
  -type f \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' \
    -o -name 'id_*' -o -iname 'credentials*' -o -iname '*secret*' \
    -o -iname '*token*' \) \
  -o -type d -name 'sessions' \
\) -print -quit)"
if [[ -n "$SUSPICIOUS" ]]; then
  printf 'Error: el backup contiene un nombre de archivo prohibido.\n' >&2
  exit 1
fi

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

count_files() {
  local source="$1"
  find "$source" \( -type f -o -type l \) -print | wc -l | tr -d ' '
}

next_backup_path() {
  local path="$1"
  local candidate="${path}.backup.$(date +%Y%m%d-%H%M%S)"
  local suffix=1
  while [[ -e "$candidate" || -L "$candidate" ]]; do
    candidate="${path}.backup.$(date +%Y%m%d-%H%M%S)-$suffix"
    suffix=$((suffix + 1))
  done
  printf '%s' "$candidate"
}

prepare_destination() {
  local destination="$1"
  if [[ -e "$destination" || -L "$destination" ]]; then
    local backup_path
    backup_path="$(next_backup_path "$destination")"
    mv -- "$destination" "$backup_path"
    printf 'Backup creado: %s\n' "$backup_path"
  fi
  mkdir -p -- "$destination"
}

restore_tree() {
  local source="$1"
  local destination="$2"
  if [[ ! -d "$source" ]]; then
    return 0
  fi
  local count
  count="$(count_files "$source")"
  if [[ "$APPLY" != true ]]; then
    printf 'SIMULAR: copiar %s archivos a %s\n' "$count" "$destination"
    return 0
  fi
  prepare_destination "$destination"
  rsync -a --links "${RSYNC_EXCLUDES[@]}" "$source/" "$destination/"
  printf 'Restaurado: %s\n' "$destination"
}

restore_file() {
  local source="$1"
  local destination="$2"
  if [[ ! -f "$source" ]]; then
    return 0
  fi
  if [[ "$APPLY" != true ]]; then
    printf 'SIMULAR: copiar configuracion segura a %s\n' "$destination"
    return 0
  fi
  mkdir -p -- "$(dirname -- "$destination")"
  if [[ -e "$destination" || -L "$destination" ]]; then
    local backup_path
    backup_path="$(next_backup_path "$destination")"
    mv -- "$destination" "$backup_path"
    printf 'Backup creado: %s\n' "$backup_path"
  fi
  rsync -a --links "$source" "$destination"
  printf 'Restaurado: %s\n' "$destination"
}

restore_file "$BACKUP/global/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"
restore_tree "$BACKUP/global/agents" "$HOME/.config/opencode/agents"
restore_tree "$BACKUP/global/skills" "$HOME/.config/opencode/skills"
restore_tree "$BACKUP/global/claude-skills" "$HOME/.claude/skills"

printf '\nInventarios disponibles para revision manual:\n'
for inventory in "$BACKUP"/manifests/*.txt; do
  [[ -e "$inventory" ]] || continue
  printf -- '- %s\n' "$(basename "$inventory")"
done
printf 'Revisa equivalencias entre paquetes Arch/AUR y apt o Flatpak; no se ejecuta ningun inventario.\n'

if [[ "$APPLY" == true ]]; then
  printf 'Restauracion aplicada. Reinicia OpenCode para detectar la configuracion.\n'
else
  printf 'Simulacion terminada. Usa --apply para aplicar los cambios.\n'
fi
