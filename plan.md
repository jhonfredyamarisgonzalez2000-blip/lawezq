# Plan de implementación — TrazaArte

## Producto

TrazaArte es una app móvil en español para dibujar con el dedo, generar una imagen desde una descripción en español con IA y conservar una galería de obras para volver a abrirlas, editarlas o borrarlas. La primera versión usará el starter Expo/React Native/TypeScript instalado, con sus servicios administrados; no cambiará de stack ni pedirá una clave externa al usuario.

## Diseño

Tres direcciones posibles, sin preferencias visuales indicadas por la persona usuaria:

- Cuaderno botánico de fantasía (0,08): papel marfil, verde esmeralda, rosa suave y detalles dorados.
- Estudio editorial monocromo (0,06): carbón, blanco cálido, retícula discreta y controles técnicos.
- Taller pop de color (0,04): contrastes eléctricos, formas gráficas y energía juvenil.

Dirección elegida: **Cuaderno botánico de fantasía**.

- **Movimiento:** cuaderno de ilustración editorial con ornamentos botánicos discretos.
- **Principios:** lienzo prioritario; controles táctiles cómodos; contraste legible; guardar debe ser claro y confiable.
- **Filosofía de color:** marfil como papel, tinta carbón para lectura, esmeralda como acción principal, rosa viejo para calidez y oro para pequeños destellos; el selector de dibujo ofrecerá una paleta completa, no restringida al tema.
- **Paradigma de layout:** espacio de trabajo a pantalla completa; barra de herramientas inferior y accesos breves; galería en una lista visual desplazable; generación de IA como flujo de creación separado.
- **Motivos:** trazo curvo tipo pincel, pequeñas hojas lineales y destellos geométricos.
- **Interacción:** botones grandes, acciones principales al alcance del pulgar, controles sensibles al contexto y confirmación antes de limpiar o borrar obras.
- **Animación:** transiciones breves y suaves; indicador de carga visible en generación; evitar movimiento ornamental que compita con el dibujo.
- **Tipografía:** sistema nativo sans serif para etiquetas y lectura; titulares con peso alto y jerarquía corta; no depender de tipografía decorativa para controles.
- **Esencia de marca:** taller de bolsillo para dibujar, imaginar con IA y retomar obras; personalidad creativa, serena y accesible.
- **Voz:** cálida, breve y alentadora. Ejemplos: “Empieza con un trazo.” / “Tu próxima idea puede tomar forma aquí.”
- **Marca:** símbolo original de plumilla/pincel con una curva verde y destellos, sin texto incrustado.
- **Color distintivo:** verde esmeralda intenso.

## Implementación

- Mantener Expo Router y construir una pantalla de lienzo táctil con SVG y trazos vectoriales; proporcionar pincel, borrador, color, grosor y opacidad, deshacer, rehacer y limpiar con confirmación.
- Guardar localmente las obras para que la biblioteca sobreviva al cierre de la app. Las obras tendrán título, miniatura/representación visual y fecha de modificación; desde la galería se podrán abrir, continuar editando y eliminar con confirmación.
- Añadir un flujo “Crear con IA”: descripción en español, petición al ImageService de Manus desde el servidor, vista previa y acción explícita para guardar o incorporar el resultado. Reutilizar el helper `server/_core/imageGeneration.ts`, que almacena la imagen y devuelve su dirección estable. La web conserva `/manus-storage/...` para el resolver de Preview/publicación; Expo Go usa el origen API público inyectado por el entorno. No enviar credenciales privadas al cliente.
- Para persistencia móvil, serializar trazos y metadatos con AsyncStorage (ya instalado); mantener los resultados de IA como direcciones persistentes devueltas por el helper. No se ofrecerá sincronización entre dispositivos ni cuenta en esta primera versión.
- Usar rutas Expo Router para Lienzo, Crear con IA y Mis obras; componentes compartidos en `components/`, estado/persistencia en `hooks/` o `lib/` y un procedimiento de IA con validación Zod en `server/`.
- Mantener los puertos fijados por el starter (Metro 8081 y API 3000), los identificadores nativos de `app.config.ts` y el uso del storage/AI administrados del proyecto.

## Estructura de proyecto prevista

- `app/(tabs)/index.tsx`: entrada de la pestaña de dibujo y lienzo táctil.
- `app/(tabs)/ai.tsx`: descripción, generación y vista previa del arte con IA.
- `app/(tabs)/gallery.tsx`: biblioteca local, abrir/editar y eliminar.
- `app/(tabs)/_layout.tsx`: navegación en español y estilo de pestañas.
- `components/drawing-workspace.tsx`: controles, historial y guardado del lienzo.
- `components/drawing-canvas.tsx` y `components/artwork-preview.tsx`: renderizado táctil y miniaturas SVG.
- `hooks/use-artworks.ts`: carga/guardado local y estado de la biblioteca.
- `lib/artwork-storage.ts` y `lib/artwork-assets.ts`: persistencia AsyncStorage y resolución de direcciones de imagen web/nativas.
- `server/routers.ts`: procedimiento público de generación con validación Zod de la descripción.
- `server/_core/imageGeneration.ts`: servicio existente de generación/almacenamiento de imágenes.
- `assets/images/*`: identidad visual cuadrada para launcher, Android y splash.
