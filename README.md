# SisDoc QR – Sistema de Validación Documental con Código QR

## Descripción

Plataforma web que permite a usuarios autorizados registrar documentos PDF, generar un código QR único para cada documento e insertar dicho QR dentro del PDF. Cualquier persona puede escanear el QR para verificar públicamente si el documento es **vigente**, **revocado** o **cancelado**, sin necesidad de iniciar sesión.

## Tecnologías utilizadas

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend | Node.js + Express | Ligero, amplio ecosistema, ideal para APIs y manejo de archivos |
| Plantillas | EJS | Renderizado del lado del servidor, sencillo de integrar con Express |
| Base de datos | MySQL 8 | Relacional, confiable, soporta bien el modelo de documentos y auditoría |
| Manipulación PDF | pdf-lib | Librería JS pura, inserta imágenes en PDFs sin binarios externos |
| Generación QR | qrcode | Genera PNG de alta calidad en buffer, sin dependencias nativas |
| Contenedores | Docker Compose | Orquesta los servicios de forma reproducible en cualquier máquina |
| UI | Bootstrap 5 + Bootstrap Icons | Diseño responsivo profesional con mínimo esfuerzo |

## Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `app` | 3000 | Aplicación Node.js/Express |
| `database` | 3306 | MySQL 8 |
| `phpmyadmin` | 8080 | Interfaz visual para la base de datos |

## Instrucciones de instalación

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Entrar a la carpeta del proyecto
cd EXTRA

# 3. Levantar los contenedores
docker compose up -d --build

# 4. Esperar ~20 segundos a que MySQL inicialice (solo la primera vez)
#    Puedes verificar los logs con:
docker compose logs -f app
```

### 5. Acceder al sistema

| Recurso | URL |
|---------|-----|
| Aplicación | http://localhost:3000 |
| phpMyAdmin | http://localhost:8080 |

### Credenciales de prueba

| Campo | Valor |
|-------|-------|
| Email | `admin@sistema.com` |
| Contraseña | `admin123` |

> El usuario administrador se crea automáticamente al primer inicio.

## Flujo del sistema

1. El usuario inicia sesión en `/login`.
2. Accede al panel principal con estadísticas de documentos.
3. Sube un PDF con título, tipo, área emisora y posición del QR.
4. El sistema genera un **folio único** (`DOC-YYYYMMDD-XXXXXX`).
5. Se genera un código QR con la URL de validación pública.
6. El QR se incrusta automáticamente en el PDF en la posición elegida.
7. Ambos PDFs (original y con QR) quedan disponibles para descarga.
8. Una persona escanea el QR → el sistema muestra el estado del documento.

## Estructura del proyecto

```
EXTRA/
├── docker-compose.yml
├── database/
│   └── init.sql           ← Esquema de tablas
└── app/
    ├── Dockerfile
    ├── server.js           ← Entrada principal
    ├── config/db.js        ← Pool MySQL con reintentos
    ├── middleware/         ← Autenticación
    ├── helpers/            ← folio, qr, pdf
    ├── routes/             ← auth, dashboard, documents, validation
    ├── views/              ← Plantillas EJS
    └── public/             ← CSS estático
```

## Detener el sistema

```bash
docker compose down
# Para eliminar también la base de datos:
docker compose down -v
```
