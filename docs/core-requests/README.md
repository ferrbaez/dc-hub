# Core Requests

Backlog de pedidos formales de **endpoints del núcleo** hechos por Module
Owners. Cuando un módulo necesita un dato que el núcleo aún no expone, el
owner abre un archivo acá en vez de escribir el query directo en su módulo.

## Convención de nombres

```
YYYY-MM-DD-<area>-<que>.md
```

Ejemplos:
- `2026-04-28-mining-consumo-horario-por-alimentador.md`
- `2026-04-30-maintenance-historial-modulaciones-por-container.md`

## Flujo

1. **Owner** crea el archivo siguiendo el template de abajo y abre un PR solo
   con ese archivo.
2. **Core Keeper** (Willian) tiene **48h para ack** y comentar en el PR
   (aceptar, rechazar, negociar alcance).
3. Si se acepta: Willian crea el endpoint en `src/server/api/routers/`.
   **SLA: 1 semana** para endpoint entregado (o negocia alcance).
4. Owner ya puede consumirlo desde su módulo.
5. Mientras tanto el owner **NO hardcodea el query** en su módulo como
   workaround — trabaja en otra parte del módulo.

## Template (copiá tal cual)

```markdown
# core-request: <qué necesitás>

**Módulo:** <area>/<nombre>
**Owner:** <nombre + mail>
**Fecha:** YYYY-MM-DD
**Urgencia:** alta | media | baja

## Qué necesito
<Descripción breve del dato o cálculo. Ser concreto.>

## Uso
<Para qué flujo lo necesitás. Ejemplo real, no abstracto.>

## Forma sugerida del endpoint
`core.<ns>.<nombre>(args) → { shape }`

## Volumen esperado
<Cuántos rows, qué frecuencia, qué tamaño. Ayuda a decidir caché.>

## Caché?
<Sí/No. Si sí: TTL sugerido, si TimescaleDB hypertable, etc.>

## Bloquea mi módulo?
<Si sin este endpoint no podés arrancar → alta urgencia.>
```

Ver SOP §7.3 para más contexto.
