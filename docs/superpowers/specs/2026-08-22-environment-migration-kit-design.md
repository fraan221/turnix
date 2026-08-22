# Kit de migracion de entorno

## Contexto

El entorno actual combina skills de OpenCode, configuracion del proyecto,
herramientas de desarrollo y personalizaciones de Omarchy sobre Arch Linux.
El sistema operativo destino sera Kubuntu. El objetivo es exportar lo
portable y reconstruir el entorno sin copiar configuraciones incompatibles,
caches ni secretos.

El kit vivira dentro del repositorio `turnix`, pero sus respaldos generados se
escribiran fuera del repositorio por defecto.

## Objetivos

- Exportar skills y configuracion declarativa de OpenCode.
- Exportar inventarios de paquetes y herramientas para reinstalacion manual.
- Documentar los elementos especificos de Omarchy sin activarlos en Kubuntu.
- Restaurar los elementos portables con un modo seguro de simulacion.
- Evitar que credenciales, tokens o datos personales entren al respaldo.
- Permitir validar el respaldo antes de usarlo en Kubuntu.

## Fuera de alcance

- Instalar paquetes automaticamente en Kubuntu.
- Migrar sesiones de navegador, bases de datos locales o caches.
- Copiar claves SSH, GPG, tokens, API keys o archivos `.env`.
- Convertir automaticamente configuraciones de Hyprland, Waybar, Walker,
  Mako o cualquier otro componente de Omarchy a KDE Plasma.
- Gestionar el backup completo del directorio home.

## Estructura propuesta

```text
scripts/migration/
|- export-environment.sh
|- restore-kubuntu.sh
`- README.md
```

El directorio generado por la exportacion tendra esta forma:

```text
turnix-migration-YYYY-MM-DD/
|- project/
|  |- AGENTS.md
|  |- opencode.json
|  |- skills-lock.json
|  |- .agents/
|  `- .opencode/
|- global/
|  |- opencode/
|  |- agents/
|  |- skills/
|  `- claude-skills/
|- manifests/
|  |- arch-packages.txt
|  |- aur-packages.txt
|  |- flatpak-apps.txt
|  `- development-tools.txt
`- MIGRATION-MANIFEST.md
```

Los directorios opcionales que no existan se registraran como ausentes en el
manifiesto, sin hacer fallar toda la exportacion.

## Exportacion

`export-environment.sh [destination]` recibira un destino opcional. Si no se
indica, usara un directorio hermano del repositorio con fecha y hora.

La exportacion:

- Copiara archivos del proyecto que ya son parte del repositorio o necesarios
  para que OpenCode descubra sus skills.
- Copiara las skills y agentes globales desde las rutas soportadas por OpenCode,
  preservando enlaces simbolicos cuando sea posible.
- Guardara inventarios de paquetes Arch, AUR, Flatpak y herramientas de
  desarrollo detectables.
- Generara un manifiesto con fecha, hostname opcionalmente anonimizado, rutas
  incluidas, rutas ausentes y exclusiones aplicadas.
- No modificara el repositorio ni escribira el backup dentro de el por defecto.
- Fallara de forma explicita ante errores de copia de elementos requeridos y
  continuara con advertencias para elementos opcionales.

Las rutas de secretos y estado personal se excluiran por nombre y patron,
incluyendo `.env`, `.env.*`, claves privadas, archivos de credenciales y
directorios de sesiones.

## Restauracion

`restore-kubuntu.sh [backup]` tendra dos modos:

- Por defecto ejecutara una simulacion y mostrara las operaciones planeadas.
- `--apply` aplicara la restauracion despues de validar la estructura del
  backup.

La restauracion:

- Copiara skills y agentes globales a sus rutas correspondientes.
- Restaurara solo configuracion segura de OpenCode.
- No sobrescribira un archivo existente sin crear primero una copia con fecha.
- No usara `sudo`, no instalara paquetes y no ejecutara comandos del manifiesto.
- Mostrara instrucciones para mapear paquetes Arch/AUR a `apt`, Flatpak o
  herramientas instaladas por el usuario.
- Validara que no haya archivos prohibidos en el backup antes de aplicar cambios.
- Informara que OpenCode debe reiniciarse para detectar cambios de configuracion.

## Seguridad

- El `.gitignore` del kit excluira directorios de backups generados y archivos
  de inventario local si alguna vez se crean accidentalmente en el repositorio.
- Los scripts no imprimiran contenido de archivos de configuracion, solo rutas,
  conteos y estados.
- No se incluiran secretos mediante comodines amplios como copiar todo
  `~/.config` o todo el home.
- El manifiesto no incluira valores de variables de entorno.
- El usuario debera migrar credenciales mediante su gestor de secretos o un
  procedimiento manual separado.

## Verificacion

El kit se validara con:

- `bash -n` sobre ambos scripts.
- Ejecucion de exportacion en un directorio temporal.
- Verificacion de que el backup contiene skills y manifiesto.
- Verificacion de que archivos prohibidos no fueron exportados.
- Ejecucion de restauracion en modo simulacion.
- Ejecucion de restauracion aplicada sobre un `HOME` temporal, sin tocar el
  home real.
- Revision del diff para confirmar que solo se agregan los archivos previstos.

## Criterio de aceptacion

Una instalacion limpia de Kubuntu debe poder recuperar las skills y la
configuracion declarativa de OpenCode desde el backup usando el script de
restauracion, sin secretos, sin comandos privilegiados y sin depender de
Omarchy.
