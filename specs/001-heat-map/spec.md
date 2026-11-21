# Especificación 001 — Mapa de calor de estudio

## Contexto y objetivo

La aplicación ya muestra racha actual, mejor racha, minutos de la semana y días estudiados
del mes. Esas cifras dan una foto corta, pero no permiten ver la constancia a lo largo de
varias semanas.

El objetivo es añadir una vista visual de las últimas 12 semanas en la que cada día
represente si se estudió y con qué intensidad, de modo que cuantos más minutos se hayan
registrado, más intenso sea su color. La vista debe entenderse de un vistazo, funcionar en
móvil y no alterar los datos ya guardados.

### Definiciones

Los términos siguientes tienen el mismo significado en toda la especificación:

- **Hoy**: la fecha local del usuario (día, mes y año según su zona horaria), sin conversión
  a UTC ni cálculos con milisegundos.
- **Fecha válida**: texto con formato `AAAA-MM-DD` que corresponde a una fecha real del
  calendario: mes entre `01` y `12` y día existente en ese mes y año.
- **Fecha no futura**: fecha válida que no es posterior a hoy.
- **Minuto válido o utilizable**: número entero finito mayor que cero. Se consideran no
  utilizables los minutos ausentes, no numéricos, fraccionarios, cero o negativos.
- **Celda vacía, estado vacío o sin intensidad**: celda de un día sin sesión con fecha válida
  y no futura, o de un día posterior a hoy. Significa «sin estudio registrado en el rango».
- **Nivel 1 o intensidad mínima**: el tono más claro de la escala. Se aplica tanto a días con
  1 a 30 minutos válidos como a días con alguna sesión de fecha válida y no futura sin
  minutos utilizables.
- **Minutos totales**: suma de los minutos válidos de un día. Si el día tiene sesiones pero
  ningún minuto válido, no se muestra una cifra: se muestra la indicación que se acuerde en
  la información al explorar (ver dudas abiertas).
- **Fecha mostrada al explorar**: día, mes y año en formato `dd/mm/aaaa`, en hora local.
- **Mes etiquetado**: cada mes que aporta al menos un día al rango se etiqueta una vez, en su
  primera columna visible. Si el rango cruza un cambio de año, la etiqueta incluye el año.
- **Día estudiado**: día del rango con al menos una sesión de fecha válida y no futura, tenga
  o no minutos utilizables.

## Usuarios

- **Estudiante que registra sesiones**: quiere reconocer sus hábitos de estudio y ver
  períodos regulares o caídas sin tener que revisar la lista sesión por sesión.
- **Estudiante en móvil**: quiere consultar el mismo historial en una pantalla estrecha
  sin perder legibilidad.
- **Persona que vuelve a la aplicación tras un tiempo**: quiere recuperar contexto rápido
  sobre su actividad reciente.

## Historias de usuario

- Como estudiante, quiero ver las últimas 12 semanas de un vistazo para valorar mi
  constancia sin contar días manualmente.
- Como estudiante, quiero que el color de cada día refleje los minutos estudiados para
  distinguir una sesión breve de una jornada intensa.
- Como estudiante, quiero pasar el puntero o enfocar un día con el teclado para conocer su
  fecha y sus minutos sin buscarlos en la lista.
- Como estudiante en móvil, quiero desplazar el mapa lateralmente para verlo completo sin
  que los días queden demasiado pequeños.
- Como estudiante, quiero que el mapa use mis sesiones ya registradas sin tener que volver
  a introducirlas ni cambiar nada de lo guardado.

## Requisitos funcionales

### RF-1 — Rango temporal

**Criterios de aceptación**

- CA-1.1 El sistema debe mostrar exactamente 12 semanas, desde el lunes de la semana
  actual menos 11 semanas hasta el domingo de la semana actual.
- CA-1.2 Cuando un día del rango sea posterior a hoy, el sistema debe mostrarlo como celda
  vacía y no debe contarlo como día estudiado.
- CA-1.3 El sistema debe disponer los días en columnas de lunes a domingo, incluida la
  semana actual aunque esté incompleta.
- CA-1.4 Si el rango cruza un cambio de año, el sistema debe incluir el año en la etiqueta
  del mes para evitar ambigüedades.

### RF-2 — Minutos por día

**Criterios de aceptación**

- CA-2.1 El sistema debe sumar los minutos de todas las sesiones de un mismo día cuando la
  fecha sea válida, no futura, y los minutos sean un número finito mayor que cero.
- CA-2.2 Si un día tiene al menos una sesión con fecha válida y no futura, pero ningún
  minuto utilizable, el sistema debe asignarle el nivel 1 (intensidad mínima).
- CA-2.3 Si un día no tiene ninguna sesión con fecha válida y no futura, el sistema debe
  mostrarlo sin intensidad.
- CA-2.4 El sistema debe excluir del cálculo del mapa las sesiones con fecha futura o con
  formato inesperado, sin borrarlas ni modificarlas.
- CA-2.5 El sistema debe tratar varias sesiones del mismo día como un único día, sumando
  sus minutos válidos.

### RF-3 — Escala de intensidad

**Criterios de aceptación**

- CA-3.1 El sistema debe ofrecer cuatro niveles de intensidad además del estado vacío.
- CA-3.2 Cuando el total de minutos válidos de un día esté entre 1 y 30, el sistema debe
  aplicar el nivel 1; entre 31 y 60, el nivel 2; entre 61 y 120, el nivel 3; y 121 o más, el
  nivel 4. Un día con sesión y sin minutos válidos recibe también el nivel 1, conforme a
  CA-2.2.
- CA-3.3 El sistema debe mostrar una leyenda con el significado de la celda vacía y los
  rangos de minutos de los cuatro niveles, indicando que el nivel 1 incluye también los días
  con sesión sin minutos válidos.
- CA-3.4 El sistema debe mantener la misma escala para todos los días del rango, sin
  recalcularla según el día con más minutos.

### RF-4 — Información al explorar el mapa

**Criterios de aceptación**

- CA-4.1 El sistema debe mostrar una celda por cada día del rango, con etiquetas para los
  días de la semana y para los meses etiquetados según la definición anterior.
- CA-4.2 Cuando el puntero se sitúe sobre una celda o la celda reciba foco mediante
  teclado, el sistema debe mostrar la fecha de ese día en formato `dd/mm/aaaa` y sus minutos
  totales, o la indicación de minutos no disponibles cuando no haya ningún minuto válido.
- CA-4.3 Si el día tiene alguna sesión con fecha válida y no futura pero no hay minutos
  válidos, el sistema debe mostrar la indicación acordada en lugar de una cifra, de modo que
  no se confunda con un día sin sesiones ni con un día con cero minutos.
- CA-4.4 El sistema debe hacer accesible la misma información sin depender únicamente del
  color.
- CA-4.5 Cuando una celda reciba foco mediante teclado y esté fuera del área visible, el
  sistema debe desplazar el mapa para que la celda quede visible.

### RF-5 — Datos y actualización

**Criterios de aceptación**

- CA-5.1 El sistema debe calcular el mapa a partir de las sesiones ya existentes, sin
  crear, borrar ni modificar ningún registro.
- CA-5.2 Cuando se registre una nueva sesión o se recargue la vista, el sistema debe
  reflejar el cambio en el mapa sin exigir otra acción por parte de la persona.
- CA-5.3 El sistema debe conservar íntegramente las sesiones guardadas antes de esta
  funcionalidad.
- CA-5.4 El sistema debe mostrar el mapa vacío, sin errores, cuando no haya ninguna
  sesión registrada.
- CA-5.5 Si los datos guardados no pueden leerse o tienen una forma inesperada, el sistema
  debe mostrar el mapa vacío sin errores y no debe sobrescribirlos al usarlo.

### RF-6 — Ubicación y comportamiento en móvil

**Criterios de aceptación**

- CA-6.1 El sistema debe situar el mapa en una sección propia después de las métricas de
  semana y mes y antes del formulario de nueva sesión.
- CA-6.2 Cuando el ancho disponible sea de 375 px, el sistema debe permitir el
  desplazamiento horizontal del mapa sin reducir las celdas por debajo de 16 px de lado.
- CA-6.3 El sistema debe mantener visibles las etiquetas de días y meses mientras se
  desplaza el mapa horizontalmente.
- CA-6.4 Cuando el ancho disponible sea inferior a 375 px, en tabletas o en orientación
  horizontal, el sistema debe aplicar el mismo criterio de celdas legibles y desplazamiento
  horizontal.

## Requisitos no funcionales

- **Legibilidad**: los cuatro niveles de intensidad deben distinguirse entre sí y
  contrastar con el fondo en los temas claros y oscuros ya disponibles.
- **Accesibilidad**: cada celda debe poder recibir foco, mostrar su información mediante
  texto y no depender solo del color para transmitir el nivel.
- **Rendimiento**: el cálculo del mapa debe realizarse a partir de los datos disponibles en
  la aplicación, sin temporizadores, esperas ni operaciones asíncronas: el resultado debe
  estar disponible en cuanto termine el ciclo de actualización que lo solicita.
- **Autonomía**: la visualización debe funcionar sin conexión ni recursos externos.
- **Idioma**: todos los textos visibles, etiquetas y mensajes deben estar en español.
- **Seguridad de los datos**: ninguna sesión existente puede perderse ni alterarse como
  consecuencia de usar el mapa, incluso cuando sus fechas o minutos queden excluidos del
  cálculo.

## Casos límite

- **Día sin sesiones**: celda vacía.
- **Día con varias sesiones**: se suman los minutos válidos y se aplica un solo nivel.
- **Sesiones duplicadas exactamente**: cada registro cuenta por separado y sus minutos se
  suman; el mapa no las fusiona ni las descarta.
- **Día con minutos válidos y no válidos a la vez**: solo suman los válidos; si hay al menos
  uno, el nivel se calcula con esa suma y no se aplica el caso de minutos no disponibles.
- **Día con sesiones pero minutos ausentes, cero, negativos, no numéricos o fraccionarios**:
  nivel 1, con indicación de minutos no disponibles al explorarlo.
- **Fecha futura**: la sesión se excluye del cálculo; el día se muestra vacío aunque tenga
  registro, y el registro se conserva.
- **Fecha con formato inesperado**: la sesión se excluye del cálculo y se conserva.
- **Fecha con aspecto válido pero calendario imposible** (por ejemplo mes `13` o
  `2026-02-30`): se trata como formato inesperado; se excluye del cálculo y se conserva.
- **Sesión anterior al inicio de las 12 semanas**: queda fuera del mapa, pero no se borra ni
  se modifica.
- **Hoy sin sesión**: la celda de hoy queda vacía; esto no modifica la racha actual, que
  sigue la regla ya vigente de permitir que la racha se mantenga viva desde ayer.
- **Cambio de hora o de zona horaria**: el mapa trabaja con días locales completos, sin
  depender de diferencias entre horas ni de milisegundos. El recálculo con la aplicación
  abierta tras un cambio de zona horaria queda recogido en dudas abiertas.
- **Rango que cruza fin de año**: las etiquetas de mes indican también el año.
- **Semana actual incompleta**: los días futuros de esa semana se muestran vacíos.
- **Sin sesiones en absoluto**: el mapa se muestra vacío y la leyenda sigue visible.
- **Datos guardados ilegibles o corruptos**: el mapa se muestra vacío y sin errores, sin
  sobrescribir los datos al usarlo.
- **Tema personalizado con colores extremos**: la celda vacía y los cuatro niveles siguen
  distinguiéndose entre sí y del fondo.
- **Anchos inferiores a 375 px, tabletas y orientación horizontal**: se mantiene el
  desplazamiento horizontal y el tamaño mínimo de celda.
- **Celda enfocada con teclado fuera del área visible**: el mapa se desplaza para hacerla
  visible antes de mostrar su información.
- **Cambio de tema con la aplicación abierta**: cambia solo la apariencia; no altera los
  niveles calculados ni las sesiones.

## Fuera de alcance

- Metas diarias, objetivos configurables o comparación con un objetivo de minutos.
- Selector de periodo, cambio de semanas o navegación a meses anteriores.
- Filtrar la lista de sesiones al pulsar una celda.
- Editar, borrar o registrar sesiones desde el mapa.
- Exportar, imprimir o compartir el mapa.
- Animaciones de entrada, efectos decorativos o sonidos.
- Guardar un estado nuevo derivado del mapa.
- Comparación con otras personas o datos externos.

## Criterios de finalización

- La spec ha sido aprobada y las dudas marcadas como `[NECESITA ACLARACIÓN]` que afecten
  a la implementación quedan resueltas antes de elaborar el plan.
- Las reglas de rango, suma de minutos, niveles y manejo de datos inválidos están cubiertas
  por pruebas automatizadas incluidas en el proyecto, y todas pasan.
- La verificación en el navegador confirma que el mapa aparece tras las métricas, muestra
  12 semanas, refleja nuevas sesiones y no produce errores en la consola.
- La vista de 375 px se ha comprobado con desplazamiento horizontal y celdas legibles.
- Las sesiones guardadas con anterioridad siguen intactas después de la verificación.
- `MEMORY.md` queda actualizado con el estado y las decisiones de esta funcionalidad.

## Dudas abiertas

- [NECESITA ACLARACIÓN] ¿El mapa debe actualizarse automáticamente al cambiar de día con
  la aplicación abierta, o basta con recalcular al recargar y al guardar una sesión, como
  ocurre con las métricas actuales?
- [NECESITA ACLARACIÓN] Para un día con sesión pero minutos no disponibles, ¿qué texto
  concreto debe mostrar la información al explorarlo: «Minutos no disponibles» o
  «Sesión registrada»?
