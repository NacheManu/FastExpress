# FastExpress

Cotizador de envíos y gestión de órdenes. El backend aplica las reglas de negocio y expone una API REST; el frontend es una aplicación web con arquitectura MVVM y diseño Material You, pensada para escritorio y móvil.

| Carpeta     | Tecnología                                        | Puerto |
| ----------- | ------------------------------------------------- | ------ |
| `backend/`  | Node.js, Express 5, TypeScript, Zod, Vitest       | 3000   |
| `frontend/` | React 19, TypeScript, Tailwind CSS 4, Vite, Vitest | 5173   |

## Puesta en marcha

Requiere Node.js 22.9 o superior.

```bash
npm install      # instala ambos workspaces
npm run dev      # levanta la API (:3000) y la web (:5173) a la vez
```

Abre <http://localhost:5173>. En desarrollo, Vite redirige `/api` al backend, así que no hace falta configurar CORS.

| Script              | Qué hace                                            |
| ------------------- | --------------------------------------------------- |
| `npm test`          | Tests de backend y frontend                         |
| `npm run coverage`  | Tests con cobertura de ambos proyectos (falla por debajo del 85 %) |
| `npm run typecheck` | Comprobación de tipos de ambos proyectos            |
| `npm run build`     | Compila el backend (`backend/dist`) y la web (`frontend/dist`) |

Cada workspace también se puede usar por separado, p. ej. `npm run dev -w backend`.

### Variables de entorno

| Variable           | Proyecto | Por defecto             | Descripción                                        |
| ------------------ | -------- | ----------------------- | -------------------------------------------------- |
| `PORT`             | backend  | `3000`                  | Puerto de la API                                   |
| `CORS_ORIGINS`     | backend  | `http://localhost:5173` | Orígenes permitidos, separados por comas           |
| `API_PROXY_TARGET` | frontend | `http://localhost:3000` | Destino del proxy `/api` de Vite                   |
| `VITE_API_URL`     | frontend | _(vacío)_               | URL del backend si la web se sirve desde otro dominio |

El backend lee `backend/.env` si existe (ver `backend/.env.example`).

## Reglas de negocio

| Regla | Descripción |
| ----- | ----------- |
| BR-01 | Toda orden tiene un costo base de **$5.00 USD**. |
| BR-02 | Peso de 0.01 a 5.00 kg: **$2.00/kg**. De 5.01 a 20.00 kg: **$4.00/kg**. Más de 20.00 kg: **envío rechazado**. |
| BR-03 | Descuento por tipo de cliente: `NUEVO` 0 %, `FRECUENTE` 10 %, `VIP` 20 %. |
| BR-04 | Recargo por tipo de envío: `ESTANDAR` 0 %, `EXPRESS` +25 % sobre el subtotal. |

El cálculo está en [`backend/src/domain/pricing/calculate-shipping-cost.ts`](backend/src/domain/pricing/calculate-shipping-cost.ts):

```
subtotal  = tarifa base + peso × tarifa del tramo
descuento = subtotal × % del tipo de cliente
recargo   = subtotal × % del tipo de envío
total     = subtotal − descuento + recargo
```

Ejemplo: 10 kg, cliente VIP, envío EXPRESS → subtotal $45.00 (5 + 10 × 4), descuento −$9.00, recargo +$11.25, **total $47.25**.

### Interpretaciones

El enunciado deja algunos puntos abiertos; estas son las decisiones tomadas:

- **Tramo completo, no progresivo.** Todo el peso se cobra a la tarifa del tramo en que cae (10 kg → 10 × $4.00), no los primeros 5 kg a $2.00 y el resto a $4.00.
- **Descuento y recargo sobre el mismo subtotal.** BR-04 indica que el recargo se calcula "sobre la tarifa subtotal"; el descuento se aplica sobre esa misma base. Así el orden de aplicación no altera el resultado.
- **Peso con 2 decimales como máximo.** Los tramos están definidos al centésimo (5.00 / 5.01), así que un peso como 2.555 kg se rechaza por inválido. El mínimo es 0.01 kg.
- **Importes en centavos.** El dominio calcula con enteros para evitar errores de coma flotante y redondea cada porcentaje al centavo más cercano.
- **Rechazo como error de negocio.** Un envío de más de 20 kg responde `422 Unprocessable Entity` (datos bien formados que incumplen una regla), mientras que un dato mal formado responde `400`.

Todas las tarifas están en un único lugar ([`pricing-rules.ts`](backend/src/domain/pricing/pricing-rules.ts)) y el frontend las obtiene de la API, por lo que no hay valores duplicados.

## API REST

Base: `/api/v1`. Peticiones y respuestas en JSON.

| Método | Ruta                | Descripción                                    | Respuestas          |
| ------ | ------------------- | ---------------------------------------------- | ------------------- |
| `GET`  | `/api/health`       | Estado del servicio                            | 200                 |
| `GET`  | `/pricing/rules`    | Tarifas vigentes (BR-01 a BR-04)               | 200                 |
| `POST` | `/pricing/quote`    | Calcula la tarifa de un envío sin guardarlo    | 200, 400, 422       |
| `POST` | `/orders`           | Crea una orden con la tarifa calculada         | 201, 400, 422       |
| `GET`  | `/orders`           | Lista las órdenes, de la más reciente a la más antigua | 200         |
| `GET`  | `/orders/:id`       | Obtiene una orden                              | 200, 404            |

**Cotizar un envío**

```bash
curl -X POST http://localhost:3000/api/v1/pricing/quote \
  -H 'Content-Type: application/json' \
  -d '{"weightKg": 10, "customerType": "VIP", "shippingType": "EXPRESS"}'
```

```json
{
  "shipment": { "weightKg": 10, "customerType": "VIP", "shippingType": "EXPRESS" },
  "currency": "USD",
  "breakdown": {
    "baseFee": 5,
    "weightTier": { "minKg": 5.01, "maxKg": 20, "ratePerKg": 4 },
    "weightCharge": 40,
    "subtotal": 45,
    "discountPercent": 20,
    "discount": 9,
    "surchargePercent": 25,
    "surcharge": 11.25,
    "total": 47.25
  }
}
```

**Crear una orden**: mismo cuerpo que la cotización más `customerName` (obligatorio, máximo 100 caracteres). Devuelve `201` con la cabecera `Location` y la orden (`id`, `customerName`, `createdAt`, `shipment`, `currency`, `breakdown`). `GET /orders` devuelve `{ "data": [...] }`.

**Errores**: siempre con el mismo formato.

```json
{
  "error": {
    "code": "WEIGHT_LIMIT_EXCEEDED",
    "message": "Envío rechazado: el peso (25 kg) supera el límite permitido de 20.00 kg."
  }
}
```

| Código                  | HTTP | Cuándo                                                    |
| ----------------------- | ---- | --------------------------------------------------------- |
| `VALIDATION_ERROR`      | 400  | Campos ausentes o con tipo/valor no permitido (`details`) |
| `INVALID_WEIGHT`        | 400  | Peso por debajo de 0.01 kg o con más de 2 decimales       |
| `BAD_REQUEST`           | 400  | JSON mal formado                                          |
| `BAD_REQUEST`           | 413  | Cuerpo de la petición de más de 10 KB                     |
| `WEIGHT_LIMIT_EXCEEDED` | 422  | Peso superior a 20 kg (BR-02)                             |
| `ORDER_NOT_FOUND`       | 404  | La orden no existe                                        |
| `NOT_FOUND`             | 404  | La ruta no existe                                         |
| `INTERNAL_ERROR`        | 500  | Error inesperado (el detalle solo se registra en el servidor) |

> Las órdenes se guardan **en memoria**: se pierden al reiniciar el backend. Para persistirlas basta con implementar el puerto `OrderRepository` con una base de datos.

## Arquitectura

### Backend: capas

```
backend/src/
├── domain/          Reglas de negocio puras, sin dependencias de framework
│   ├── pricing/     Tipos de envío, tarifas (BR-01..04) y algoritmo de cálculo
│   └── order/       Entidad Order
├── application/     Casos de uso (ShippingService) y puertos (OrderRepository)
├── infrastructure/  Implementaciones de los puertos (repositorio en memoria)
├── api/             Express: rutas, validación con Zod, presentadores y errores HTTP
├── config.ts        Variables de entorno (puerto y orígenes CORS)
└── server.ts        Composición de dependencias y arranque
```

Las dependencias apuntan hacia el dominio: la API conoce la aplicación y la aplicación conoce el dominio, nunca al revés.

### Frontend: MVVM

```
frontend/src/
├── models/       Model: tipos y vocabulario del dominio (envío, tarifa, orden)
├── services/     Model: acceso a la API (cliente HTTP, PricingService, OrderService)
├── viewmodels/   ViewModel: hooks con el estado y los comandos de cada pantalla
├── views/        View: páginas y componentes que solo pintan el ViewModel
├── ui/           Componentes Material 3 reutilizables (botones, campos, navegación…)
├── core/         Tema dinámico, avisos (snackbar), formato (es-US) y hooks transversales
├── app/          Enrutado y estructura de la aplicación
└── test/         Configuración y datos compartidos de las pruebas
```

- **View → ViewModel**: cada página crea su ViewModel (`useQuoteViewModel`, `useOrdersViewModel`…) y le pasa datos y callbacks a componentes de presentación.
- **ViewModel → Model**: los ViewModels reciben los servicios por parámetro (con la implementación real por defecto), así que se prueban con dobles sin tocar la red.
- El cotizador recalcula mientras se escribe, con *debounce* y cancelando las peticiones obsoletas (`AbortController`).

### Diseño Material You

- **Color dinámico**: la paleta completa (roles `primary`, `surface-container-*`, etc.) se genera en tiempo de ejecución desde un color semilla con [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) y se expone como colores de Tailwind (`bg-primary-container`, `text-on-surface-variant`…).
- **Personalización**: el botón de paleta permite elegir el color semilla y el modo claro, oscuro o automático. La preferencia se guarda en el navegador.
- **Diseño adaptable** según las clases de ventana de M3: barra de navegación inferior en móvil (< 600 px), riel de navegación a partir de 600 px y resumen lateral fijo a partir de 840 px.
- Tipografía Roboto Flex, iconos Material Symbols, escala de formas, elevación y capas de estado de M3.

## Tests

| Proyecto | Pruebas | Líneas | Ramas |
| -------- | ------- | ------ | ----- |
| Backend  | 97      | 100 %  | 100 % |
| Frontend | 111     | 99.5 % | 97.2 % |

- **Backend**: caja negra contra la API real (`tests/black-box/`: particiones de equivalencia y valores límite del peso y del monto, tabla de decisión cliente × envío), caja blanca por caminos independientes del cálculo (`tests/white-box/`), unitarias del dominio y pruebas de todos los endpoints con Supertest.
- **Frontend**: ViewModels con servicios simulados, cliente HTTP, tema, componentes Material 3, navegación y páginas completas con Testing Library, incluido el flujo de crear una orden.

Ambos proyectos exigen un mínimo de 85 % de líneas, ramas, funciones y sentencias. El informe HTML queda en `backend/coverage/` y `frontend/coverage/`.

## Documentación de calidad

[`docs/Informe_Calidad_Software_FastExpress.docx`](docs/Informe_Calidad_Software_FastExpress.docx) es el informe técnico de pruebas:

1. **Caja negra**: particiones de equivalencia y valores límite del peso y del monto, y tabla de decisión tipo de cliente × tipo de envío.
2. **Caja blanca**: grafo de flujo de control del cálculo de la tarifa, complejidad ciclomática (V(G) = 8) y caminos independientes.
3. **Cobertura**: capturas y análisis de la cobertura de backend y frontend frente al mínimo de 85 %.

Cada caso del informe tiene su prueba automatizada con el mismo identificador (por ejemplo `BVA-P-06` o `C7`).
