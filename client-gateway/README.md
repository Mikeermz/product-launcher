# Clien Gateway 

El gateway es el puno de comunicacion entre nuestros clientes y nuestros servicios.
Es el encargado de recibir las peticiones, encarlas a los servicios corresponidentes y devolver la respuesta al cliente.

## Dev

1. Clonar repo.
2. Instalar devs.
3. Crear archivo `.env` basado en el `env.template`
4. Tener levantados los MS a consumir
5. Levantar proyecto con `npm run start:dev`

## Nats

```
docker run -d --name nats-main -p 4222:4222 -p 8222:8222 nats
```
