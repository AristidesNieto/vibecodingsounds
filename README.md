# VibeCodingSounds

Sonidos personalizados para [Claude Code](https://docs.anthropic.com/en/docs/claude-code): suena cuando Claude termina una tarea y cuando te pide permiso o espera tu respuesta.

> **Estado:** versión temprana (0.1.0). Probado en macOS. Windows y Linux están implementados pero aún no probados.

## Requisitos

- Node.js 18 o superior
- Claude Code

## Instalación

```sh
npm install -g vibecodingsounds
```

Eso instala el comando `vcsounds`.

Si además quieres el comando `/vcsounds` dentro de Claude Code, instala el plugin desde este repo:

```
/plugin marketplace add AristidesNieto/vibecodingsounds
/plugin install vibecodingsounds --marketplace AristidesNieto/vibecodingsounds
```

El plugin solo añade el comando `/vcsounds`. Sigue necesitando el CLI de arriba.

## Uso

```sh
vcsounds list                    # sonidos disponibles
vcsounds status                  # qué suena en cada evento
vcsounds set stop Glass          # sonido al terminar
vcsounds set notification Tink   # sonido cuando pide permiso o espera
vcsounds set stop none           # quitar un sonido
vcsounds off                     # quitar todos
vcsounds add ~/Music/bip.wav     # agregar tu propio audio
vcsounds preview Glass           # escuchar un sonido
```

Para configurar un solo proyecto en vez de todo tu equipo, agrega `--project` desde su carpeta:

```sh
cd mi-proyecto
vcsounds --project set stop Glass
```

### Eventos

| Evento | Cuándo suena |
|---|---|
| `stop` | Claude termina de responder |
| `notification` | Claude pide permiso o lleva un rato esperando tu respuesta |

## Sonidos propios

`vcsounds add` copia el archivo a `~/.claude/vibecodingsounds/`. Después puedes usarlo por su nombre, sin extensión.

Formatos: `.wav`, `.mp3`, `.m4a`, `.aiff`, `.caf`, `.ogg`, `.oga`.

| Sistema | Reproductor usado | Formatos |
|---|---|---|
| macOS | `afplay` (incluido) | todos los de arriba |
| Windows | PowerShell (incluido) | solo `.wav` por ahora |
| Linux | `paplay`, `pw-play` o `aplay` | depende del reproductor instalado |

## Cómo funciona

`vcsounds set` edita `~/.claude/settings.json` (o `.claude/settings.json` con `--project`) y agrega un hook que ejecuta `vcsounds play <archivo>`.

- Solo toca sus propios hooks. Los hooks que tú escribiste se conservan.
- Si el archivo de configuración no es JSON válido, no lo modifica.
- Cada comando termina en `#vibecodingsounds`. El shell lo trata como comentario, y así la herramienta reconoce sus propios hooks al cambiarlos.

## Desinstalar

```sh
vcsounds off
npm uninstall -g vibecodingsounds
```

Ejecuta `vcsounds off` antes de desinstalar. Si no, los hooks seguirán intentando ejecutar un comando que ya no existe.

## Privacidad

No hay red, ni analytics, ni cuentas. Todo se queda en tu equipo.

## Desarrollo

```sh
git clone https://github.com/AristidesNieto/vibecodingsounds
cd vibecodingsounds
npm test
```

## Licencia

MIT
