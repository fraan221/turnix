# Kit de migracion de entorno

Este kit exporta las skills y la configuracion segura de OpenCode junto con
inventarios del entorno Arch/Omarchy para facilitar la migracion a Kubuntu.

## Requisitos

- Bash.
- `rsync`.
- Git.
- Permisos de escritura en el destino del backup.

`pacman` y `flatpak` son opcionales. Solo se consultan para generar inventarios
y nunca se ejecutan comandos de instalacion.

## Uso

Desde la raiz del repositorio:

```bash
bash scripts/migration/export-environment.sh /media/backup/turnix
```

Si no se indica un destino, se crea un directorio hermano del repositorio:

```bash
bash scripts/migration/export-environment.sh
```

Primero simular la restauracion:

```bash
bash scripts/migration/restore-kubuntu.sh /media/backup/turnix-migration-YYYY-MM-DD-HHMMSS
```

Aplicarla explicitamente:

```bash
bash scripts/migration/restore-kubuntu.sh /media/backup/turnix-migration-YYYY-MM-DD-HHMMSS --apply
```

La restauracion crea una copia fechada antes de reemplazar configuracion global
existente. No usa `sudo`, no instala paquetes y no ejecuta comandos incluidos en
los inventarios.

## Que se exporta

- Skills y agentes del proyecto.
- Skills y agentes globales de OpenCode y Claude Code.
- Configuracion global de OpenCode solo cuando pasa la inspeccion de seguridad.
- Versiones de herramientas de desarrollo.
- Inventarios de paquetes Arch/AUR y aplicaciones Flatpak, cuando los comandos
  estan disponibles.

Los inventarios son una referencia para reinstalar manualmente en Kubuntu. Hay
que decidir cada equivalente usando `apt`, Flatpak o el instalador oficial.

## Que no se exporta

No se copian claves SSH/GPG, tokens, API keys, archivos `.env`, sesiones,
caches, bases de datos locales ni configuraciones activas de Hyprland, Waybar,
Walker o Mako. Las configuraciones de Omarchy deben conservarse aparte como
referencia si se necesita reconstruir alguna preferencia en KDE Plasma.

## Verificacion

Ejecutar las pruebas aisladas del kit:

```bash
bash scripts/migration/test-migration.sh
```

La prueba usa un `HOME` temporal y no modifica el home real.

## Procedimiento de migracion

1. Ejecutar la exportacion en un disco externo.
2. Revisar `MIGRATION-MANIFEST.md` y buscar secretos manualmente.
3. Instalar Kubuntu y las herramientas base por separado.
4. Clonar `turnix` y ejecutar la restauracion en modo simulacion.
5. Ejecutar la restauracion con `--apply`.
6. Reponer credenciales desde el gestor de secretos.
7. Reiniciar OpenCode y validar skills y MCP.
