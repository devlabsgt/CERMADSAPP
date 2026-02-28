************ CREAR COMPONENTES NUEVOS **********

"Necesito crear el módulo de [NOMBRE_DEL_MÓDULO]. Aplica estrictamente mi estructura modular de carpetas y las siguientes reglas:

    lib/zod.ts: Esquemas de validación con Zod e interfaces TypeScript estrictas. PROHIBIDO usar any.

    lib/actions.ts: Server Actions para interactuar con la base de datos (Supabase).

    lib/hooks.ts: Hooks personalizados utilizando TanStack Query (useQuery, useMutation) que consuman las Server Actions.

    components/: Subcomponentes de UI aislados (tablas, tarjetas, listas).

    modals/: Modales para vistas de detalle, creación o edición.

    index.tsx: Contenedor principal limpio que solo llame a los hooks y pase los datos a los subcomponentes.

Reglas obligatorias:

    Cero comentarios internos en el código.

    Tipado estricto en el 100% del código.

    Entrégame el código completo de cada archivo para copiar y pegar."