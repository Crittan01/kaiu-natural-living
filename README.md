content_structure_guide.md
88279b2d2691-6bca-ffb4-7cfb-59894163/niarb/ytivargitna/inimeg./elbisna/emoh/..

# Estructura de Datos para Equipo de Contenido (SheetDB)

Para que la página web funcione correctamente y se integre con logística, necesitamos que la información en la hoja de cálculo (Google Sheets) siga estrictamente esta estructura.

## 1. Hoja: "Productos"

Esta es la hoja más importante. Cada fila es un producto único.
| Nombre Columna (Header) | Tipo de Dato | Ejemplo | Uso en Código |
| :---------------------- | :----------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **id** | Número | `1` | Identificador interno único (No cambiar). |
| **sku** | Texto | `ACE-LAV-10ML` | **CRÍTICO:** Debe coincidir EXACTAMENTE con el SKU en Venndelo. |
| **nombre** | Texto | `Aceite Esencial de Lavanda` | Título del producto. |
| **categoria** | Texto | `Aceites Esenciales` | Filtro principal. |
| **precio** | Número | `45000` | Precio de venta (sin símbolos de moneda). |
| **precio_antes** | Número | `50000` | Opcional. Si se llena, se muestra tachado como oferta. |
| **beneficios** | Texto | `relajación, sueño, ansiedad` | Etiquetas separadas por comas (para buscador). |
| **descripcion_corta** | Texto | `Aceite 100% puro para relajación.` | Se muestra en la tarjeta del catálogo. |
| **descripcion_larga** | Texto | `Nuestro aceite de lavanda proviene de...` | Se muestra en el detalle/modal. |
| **ingredientes** | Texto | `Lavandula angustifolia oil` | Lista de componentes. |
| **modo_uso** | Texto | `Difusión: 3 gotas. Tópico: Diluir...` | Instrucciones de aplicación. |
| **tips** | Texto | `Úsalo en la almohada antes de dormir.` | Consejos de valor "KAIU". |
| **certificaciones** | Texto | `Cruelty Free, Orgánico, Vegano` | Sellos de calidad (separados por comas). |
| **imagen_url** | URL | `https://i.imgur.com/example.jpg` | Link directo a la foto (debe terminar en .jpg/.png). |
| **variantes** | Texto | `10ml, 30ml` | Tamaños disponibles (separados por comas). |
| **stock** | Texto | `DISPONIBLE` | `DISPONIBLE` o `AGOTADO`. |

---

## 2. Hoja: "Rituales"

Contenido educativo para la sección de experiencias.
| Nombre Columna | Tipo | Ejemplo | Descripción |
| :--------------------------- | :----- | :--------------------------------- | :--------------------------------------------------- |
| **id** | Número | `101` | Identificador único. |
| **titulo** | Texto | `Ritual de Sueño Profundo` | Nombre del ritual. |
| **resumen** | Texto | `Prepara tu mente para descansar.` | Subtítulo corto. |
| **contenido** | Texto | `Paso 1: Aplica lavanda...` | Texto completo del ritual. |
| **imagen_url** | URL | `https://...` | Foto inspiracional del ritual. |
| **producto_relacionado_sku** | Texto | `ACE-LAV-10ML` | SKU del producto que se recomienda para este ritual. |

---

## 3. Hoja: "FAQ"

Preguntas frecuentes.
| Nombre Columna | Tipo | Ejemplo |
| :------------- | :----- | :---------------------------------------------- | ------------------------------------- |
| **pregunta** | Texto | `¿Los aceites se pueden ingerir?` |
| **respuesta** | Texto | `No recomendamos la ingesta sin supervisión...` |
| **orden** | Número | `1` |

---

## ⚠️ Reglas de Oro para el Equipo

1.  **NO cambiar los nombres de las columnas (Headers):** Si cambian "imagen_url" por "Foto", la página se rompe.
2.  **SKUs Idénticos:** El SKU en esta hoja debe ser idéntico al código que usen en Venndelo para el inventario. Es la llave maestra.
3.  **URLs de Imágenes:** Deben ser enlaces directos públicos. No usar enlaces de Google Drive protegidos.
