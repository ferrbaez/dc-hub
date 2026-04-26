# Bienvenido a DC Hub — guía rápida para owners

Este documento te explica **qué es DC Hub, qué vas a hacer vos acá, y cómo es tu día a día** sin meterte en detalles técnicos. Si después querés bucear más profundo, andá a `MODULAR_SOP.md`. Esto es lo mínimo para empezar.

---

## 1. ¿Qué es DC Hub?

Una plataforma interna de Penguin Digital donde se centraliza todo lo que tiene que ver con la operación del Data Center: minería, mantenimiento, redes, automatización, instalaciones, etc.

La plataforma corre en un servidor de la empresa (`172.16.10.113`) y se accede desde cualquier laptop dentro de la red corporativa apuntando a `http://172.16.10.113:3000`.

DC Hub **lee** datos de tres lugares:

- **ICS** (Postgres): mineros, hashrate, contenedores, energía.
- **SCADA** (SQL Server, AVEVA Edge): mediciones eléctricas, salud de trafos, temperaturas, alarmas.
- **Revenue DBs** (3 Postgres): facturación de cada cliente JV.

DC Hub **nunca escribe** en ICS ni en SCADA. Esos sistemas son sagrados — sólo se leen. Lo único que escribe es su propia base local (TimescaleDB, en el mismo server).

Encima de esos datos, cada área del Departamento de Operaciones construye **módulos** que resuelven problemas concretos: dashboard de rentabilidad, alertas de cooling, reportes de turnos, panel de subestación, lo que sea. Cada módulo tiene **un dueño** (vos, si estás leyendo esto).

---

## 2. ¿Qué área tenés vos y qué significa?

Cuando Willian te creó tu usuario, te asignó una o más **áreas**. Las áreas son las grandes ramas del organigrama:

`maintenance`, `substation`, `mining`, `networking`, `microelectronics`, `automation`, `facilities`, `safety`, y `core` (este último es de Willian).

**Lo que controla tu área:**

- **Qué ves en la sidebar** del hub: solo aparecen los módulos de tus áreas.
- **A qué endpoints podés llamar**: si un módulo es de `mining` y vos sos de `maintenance`, llamarlo te devuelve un error.
- **Qué módulos podés crear**: solo en tus propias áreas.

Si sos un **Head** (Marcelo, Allan, Katherine), tenés varias áreas (porque supervisás varios Leaders). Si sos un **Leader o Técnico**, tenés solo la tuya.

Si necesitás ver algo fuera de tu área, hablalo con Willian — no inventes accesos.

---

## 3. ¿Cómo es tu entorno?

Tenés tres "lugares" donde existe el hub:

```
                         GitHub (repo privado)
                         ferrbaez/dc-hub
                                  │
                                  │ git push / pull
                                  ▼
       Tu laptop  ─────────────────────────►  Server prod (172.16.10.113)
       (desarrollás acá)                     (donde lo usan los humanos)
       
       - clon del repo                       - clon del repo en /opt/dc-hub
       - tu Postgres en Docker               - su propio Postgres en Docker
       - VPN para leer ICS/SCADA              - VPN siempre arriba
       - Claude Code para asistencia         - el script ~/deploy-hub.sh actualiza el código
```

**En tu laptop necesitás (una sola vez):**

1. Node 20 + pnpm (`brew install node@20 pnpm`).
2. Docker Desktop corriendo.
3. VPN corporativa activa.
4. Claude Code CLI instalado y logueado.
5. Acceso al repo en GitHub.
6. Un archivo `.env.local` que te pasa Willian con las credenciales de lectura.

Después corrés `pnpm install`, `docker compose up -d`, `pnpm db:push`, `pnpm dev`, y entrás a `http://localhost:3000`. Todo el detalle paso a paso está en `MODULAR_SOP.md §6`.

**El servidor de producción** lo maneja Willian. Vos no tocás SSH ahí — solamente mergeás a `main` en GitHub y Willian (o el script de deploy) lo lleva al server.

---

## 4. Tu día a día: del pedido al deploy

El flujo siempre es el mismo, sin importar qué tan grande sea el módulo. La regla es **trabajar en una rama, abrir un PR, mergear**. Nunca tocás `main` directo (el repo te lo bloquea).

### Paso 1 — Te llega un pedido (vos o tu Head)

Ejemplo: "Necesitamos un panel que muestre la temperatura de agua de los containers de Mara cada 5 minutos, con alerta si pasa de 45°C".

Antes de tocar código, llená el `README.md` del módulo (plantilla en `MODULAR_SOP.md §4`): qué resuelve, quién lo usa, qué datos necesita, qué quieres mostrar. Es media carilla. Si no podés escribirlo, el módulo no está claro todavía.

### Paso 2 — Creás la rama y el módulo

```bash
git checkout main && git pull
git checkout -b feat/cooling-mara-temp

pnpm new:module mining/cooling-mara-temp
```

Ese `pnpm new:module` es un comando que ya viene listo — te genera la carpeta del módulo con todos los archivos en su lugar (`README.md`, `router.ts`, `routes.tsx`, etc.) y te conecta automáticamente al hub. Tu módulo ya existe y se ve en `http://localhost:3000/m/mining/cooling-mara-temp` aunque todavía no haga nada.

### Paso 3 — Programás con Claude

Abrís Claude Code en la carpeta del repo y le decís qué querés hacer. Claude tiene contexto de todos los datos disponibles (lee los docs de `docs/` automáticamente).

**La regla de oro:** tu módulo **nunca** habla con la base de datos directamente. Siempre llama a endpoints `core.*` (los que provee el núcleo). Si necesitás un dato que el núcleo no expone, **pedís un nuevo endpoint** (ver Paso 4 alternativo).

Ejemplo de un dato que ya está disponible:

```ts
const { data } = trpc.core.site.cooling.useQuery();
// data tiene la temperatura de agua de todos los containers
```

### Paso 4 — ¿Te falta un dato? Abrís un "core-request"

Si Claude te dice "necesitamos un endpoint nuevo en el núcleo", no inventes un atajo. Creás un archivo en `docs/core-requests/YYYY-MM-DD-tu-modulo-que-necesitas.md` siguiendo la plantilla, lo commiteás, y Willian te lo crea. Plazo máximo: **48h ack, 1 semana entrega** (si es razonable).

Mientras esperás, trabajás en otra parte de tu módulo.

### Paso 5 — Probás localmente

Levantás `pnpm dev`, te logueás con tu usuario, navegás a `/m/<area>/<modulo>` y comprobás que funciona.

### Paso 6 — Abrís el PR

```bash
pnpm typecheck && pnpm lint
git add . && git commit -m "feat(cooling-mara-temp): primer panel"
git push -u origin feat/cooling-mara-temp
gh pr create --base main --assignee ferrbaez
```

Cuando hagas `git commit`, automáticamente corren chequeos (typecheck, lint, reglas de aislamiento). Si fallan, te lo dice y no commitea — corregís y volvés a intentar.

Cuando hagas `gh pr create`, GitHub corre el mismo CI y le manda mail a Willian para que revise.

### Paso 7 — Review y merge

Willian mira tu PR. Si todo está OK → "approve + merge". Si hay algo, te deja comentarios.

**Merge a `main`** dispara, eventualmente, el deploy a producción. Willian corre `~/deploy-hub.sh` en el server cuando hay cambios para subir (manualmente, una o dos veces por día). En unos minutos tu módulo está vivo en `172.16.10.113:3000` y tu equipo lo puede usar.

---

## 5. Reglas innegociables

Estas las enforce el sistema (no son sugerencias). Si las rompés, el commit se cancela o el CI se pone rojo:

1. **No abrás conexiones a ICS/SCADA/Revenue desde un módulo.** Solo el núcleo lo hace. Vos consumís `core.*`.
2. **No importes desde otro módulo.** Si `mining/reporting` quiere usar algo de `maintenance/tickets`, hay que mover esa lógica al núcleo (vía core-request).
3. **No pushees a `main` directo.** GitHub te lo va a rechazar. Siempre PR.
4. **No commitees secrets.** El `.env.local` está en `.gitignore`. Las credenciales nunca van al repo.
5. **No tocás los archivos del núcleo sin pasar por Willian.** Cualquier cambio en `src/server/`, `src/lib/db/`, `src/schema/`, `docs/` requiere que Willian apruebe el PR explícitamente (CODEOWNERS lo fuerza).

---

## 6. Cuándo y cómo pedir ayuda

| Situación | Qué hacer |
|---|---|
| No sé cómo modelar el módulo | Hablá con Willian antes de codear, **siempre** |
| Me falta un endpoint del núcleo | Abrir core-request en `docs/core-requests/` |
| Encontré un bug en el núcleo | Comentario en el PR o mensaje a Willian — **no lo arregles vos** |
| Mi PR está bloqueado, no entiendo por qué | Mirá los logs del CI en GitHub; si no es claro, preguntá |
| Rompí algo en producción | Avisar a Willian YA. Hay rollback en 30 segundos. No intentes arreglar solo. |
| Tengo dudas sobre la lógica del negocio (qué cuenta como downtime, etc.) | Preguntá antes de codear, no después |

---

## 7. Cadencia

- **Lunes 08:00–10:00**: sesión semanal de pair programming. Willian + el owner de turno. Salimos con un módulo v1 mergeado y deployado. Si vos sos el de la semana, llegás con tu `README.md` lleno y un mockup en papel.
- **Async durante la semana**: trabajás en tu módulo cuando puedas, abrís PRs cuando estén listos. Willian responde PRs en 24h.
- **1:1 con Willian**: 20 min semanales para destrabar arquitectura. Si no necesitás, lo cancelás.
- **Retro mensual**: 30 min, equipo completo. Qué rompió, qué endpoint pedimos más, qué módulo morimos por falta de uso.

---

## 8. Lo que NO tenés que hacer

Para que no te angusties pensando en cosas que no son tu problema:

- ❌ **No te ocupes del deploy a producción.** Eso lo hace Willian.
- ❌ **No te ocupes de la base de datos local de prod.** Willian.
- ❌ **No te ocupes de los certificados, dominios, nginx, firewalls.** Willian.
- ❌ **No te ocupes de los users de los demás.** Willian crea cada usuario con `pnpm user:create`.
- ❌ **No tenés que escribir tests** (por ahora). Cuando duela la falta, los agregamos.
- ❌ **No tenés que entender SCADA en profundidad** — el núcleo te da queries seguras pre-armadas.

Tu única responsabilidad es **construir y mantener tu(s) módulo(s)**.

---

## 9. Glosario rápido

| Palabra | Qué significa |
|---|---|
| **Núcleo / core** | El código que mantiene Willian. Te da datos via tRPC. No lo tocás. |
| **Módulo** | Tu carpeta en `src/modules/<area>/<nombre>/`. Tu trabajo vive ahí. |
| **Área** | Una "rama" del organigrama (mining, maintenance, …). Define qué ves y qué podés crear. |
| **tRPC** | La forma en que tu UI le pide datos al núcleo. Como una API pero con tipos compartidos. No necesitás entender la teoría — vos llamás `trpc.core.x.y.useQuery()` y listo. |
| **Drizzle** | La forma en que el núcleo habla con Postgres. **Vos no la tocás.** |
| **PR** | Pull Request — la ceremonia de "miren mi cambio antes de mergear". |
| **CODEOWNERS** | Lista de archivos que requieren aprobación de Willian. Si tu PR los toca, GitHub se lo manda automáticamente. |
| **CI** | Los chequeos automáticos que corre GitHub en cada PR (typecheck, lint, reglas de módulo). Tienen que estar verdes para mergear. |
| **lefthook** | Lo mismo que CI pero corre en tu laptop antes de hacer commit. Falla rápido = corregís rápido. |
| **core-request** | El procedimiento formal para pedir un endpoint nuevo. Archivo en `docs/core-requests/`. |
| **rollback** | Volver a una versión anterior de producción. Lo hace Willian en 30 segundos. |

---

## 10. Tu primera tarea

Para arrancar con confianza, antes de la sesión del lunes:

1. Instalá lo del Paso 3 (Node, pnpm, Docker, VPN, Claude Code).
2. Cloná el repo y hacé `pnpm install`.
3. Abrí `docs/MODULAR_SOP.md` y leelo entero (15 min). Es más técnico que esto pero te da el panorama completo.
4. Logueate al hub con el usuario que te dió Willian: `http://172.16.10.113:3000/login`. Mirá tu sidebar — solo deberías ver lo de tu(s) área(s).
5. Llená el `README.md` de tu primer módulo (plantilla en `MODULAR_SOP.md §4`). Llegá el lunes con eso listo. Vamos a codear, no a diseñar.

Bienvenido. Cualquier duda — Willian.
