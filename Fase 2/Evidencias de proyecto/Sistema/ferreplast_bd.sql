-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.usuario (
  nom_user character varying,
  rut_user character varying,
  create_user timestamp with time zone DEFAULT now(),
  direc_user character varying,
  phone_user text,
  id_comuna bigint,
  est_user boolean NOT NULL DEFAULT false,
  rol_user smallint DEFAULT '0'::smallint,
  id_user uuid NOT NULL,
  deshabilitacion_solicitada_en timestamp with time zone,
  CONSTRAINT usuario_pkey PRIMARY KEY (id_user),
  CONSTRAINT usuario_rol_user_fkey FOREIGN KEY (rol_user) REFERENCES public.rol_user(id_rol),
  CONSTRAINT usuario_id_comuna_fkey FOREIGN KEY (id_comuna) REFERENCES public.comuna(id_comuna),
  CONSTRAINT usuario_id_user_fkey FOREIGN KEY (id_user) REFERENCES auth.users(id)
);
CREATE TABLE public.region (
  id_reg bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_reg character varying UNIQUE,
  CONSTRAINT region_pkey PRIMARY KEY (id_reg)
);
CREATE TABLE public.comuna (
  id_comuna bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_comuna character varying,
  id_reg bigint,
  CONSTRAINT comuna_pkey PRIMARY KEY (id_comuna),
  CONSTRAINT comuna_id_reg_fkey FOREIGN KEY (id_reg) REFERENCES public.region(id_reg)
);
CREATE TABLE public.familia (
  id_familia smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_familia character varying,
  CONSTRAINT familia_pkey PRIMARY KEY (id_familia)
);
CREATE TABLE public.carrito (
  id_cart bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_prod bigint NOT NULL,
  cant_cart integer,
  creado_cart timestamp with time zone DEFAULT now(),
  id_user uuid NOT NULL,
  CONSTRAINT carrito_pkey PRIMARY KEY (id_cart),
  CONSTRAINT carrito_id_prod_fkey FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod),
  CONSTRAINT carrito_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.usuario(id_user)
);
CREATE TABLE public.producto (
  id_prod bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_prod character varying NOT NULL,
  desc_prod character varying NOT NULL,
  precio_prod integer NOT NULL,
  imagen_url text,
  created_prod timestamp with time zone DEFAULT now(),
  est_prod smallint NOT NULL DEFAULT '1'::smallint,
  precio_act integer NOT NULL,
  id_und_medida smallint NOT NULL,
  peso_prod numeric,
  id_subcategoria integer NOT NULL,
  color_prod character varying,
  detalle_prod character varying,
  id_marca smallint,
  ultima_act_prod timestamp with time zone DEFAULT now(),
  stock_prod numeric NOT NULL DEFAULT '0'::numeric,
  categoria_ml text,
  etiquetas_ml text,
  CONSTRAINT producto_pkey PRIMARY KEY (id_prod),
  CONSTRAINT producto_id_und_medida_fkey FOREIGN KEY (id_und_medida) REFERENCES public.unidad_medida(id_und_medida),
  CONSTRAINT producto_id_marca_fkey FOREIGN KEY (id_marca) REFERENCES public.marca_producto(id_marca),
  CONSTRAINT producto_id_subcategoria_fkey FOREIGN KEY (id_subcategoria) REFERENCES public.subcategoria(id_subcategoria),
  CONSTRAINT producto_est_prod_fkey FOREIGN KEY (est_prod) REFERENCES public.estado_producto(id_est_prod)
);
CREATE TABLE public.pedido (
  id_pedido bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  fecha_predido timestamp with time zone NOT NULL,
  total_pedido integer NOT NULL,
  id_estado smallint NOT NULL,
  id_user uuid,
  es_factura boolean NOT NULL,
  registrado_erp boolean DEFAULT false,
  id_bodeguero uuid,
  folio_pedido character varying,
  comprobante_path text,
  identidad_cliente jsonb,
  identidad_bodeguero jsonb,
  observacion text,
  CONSTRAINT pedido_pkey PRIMARY KEY (id_pedido),
  CONSTRAINT pedido_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES public.estado_pedido(id_estado),
  CONSTRAINT pedido_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.usuario(id_user),
  CONSTRAINT pedido_id_bodeguero_fkey FOREIGN KEY (id_bodeguero) REFERENCES public.usuario(id_user)
);
CREATE TABLE public.detalle_pedido (
  id_detalle bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pedido bigint NOT NULL,
  id_prod bigint NOT NULL,
  cantidad smallint NOT NULL,
  precio_unitario integer NOT NULL,
  nom_prod character varying,
  CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id_detalle),
  CONSTRAINT detalle_pedido_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido),
  CONSTRAINT detalle_pedido_id_prod_fkey FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod)
);
CREATE TABLE public.pago (
  id_pago bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pedido bigint NOT NULL,
  metodo_pago smallint NOT NULL,
  fecha_pago timestamp with time zone,
  id_estado_pago smallint NOT NULL DEFAULT 0,
  buy_order character varying,
  monto_pago integer NOT NULL CHECK (monto_pago IS NULL OR monto_pago > 0),
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  folio_pago character varying,
  CONSTRAINT pago_pkey PRIMARY KEY (id_pago),
  CONSTRAINT pago_estado_pago_fk FOREIGN KEY (id_estado_pago) REFERENCES public.estado_pago(id_estado_pago),
  CONSTRAINT pago_metodo_pago_fkey FOREIGN KEY (metodo_pago) REFERENCES public.metodo_pago(id_metodo_pago),
  CONSTRAINT pago_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido)
);
CREATE TABLE public.estado_pedido (
  id_estado smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_estado character varying NOT NULL,
  codigo character varying NOT NULL,
  CONSTRAINT estado_pedido_pkey PRIMARY KEY (id_estado)
);
CREATE TABLE public.rol_user (
  id_rol smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_rol character varying NOT NULL,
  CONSTRAINT rol_user_pkey PRIMARY KEY (id_rol)
);
CREATE TABLE public.estado_producto (
  id_est_prod smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_est_prod character varying NOT NULL,
  CONSTRAINT estado_producto_pkey PRIMARY KEY (id_est_prod)
);
CREATE TABLE public.subcategoria (
  id_subcategoria integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_subcategoria character varying NOT NULL DEFAULT now(),
  id_familia smallint NOT NULL,
  CONSTRAINT subcategoria_pkey PRIMARY KEY (id_subcategoria),
  CONSTRAINT subcategoria_id_familia_fkey FOREIGN KEY (id_familia) REFERENCES public.familia(id_familia)
);
CREATE TABLE public.producto_documento (
  id_documento bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_prod bigint NOT NULL,
  nombre_documento character varying NOT NULL,
  tipo_documento character varying NOT NULL DEFAULT 'otro'::character varying CHECK (tipo_documento::text = ANY (ARRAY['ficha_tecnica'::character varying, 'hoja_seguridad'::character varying, 'certificado'::character varying, 'manual'::character varying, 'otro'::character varying]::text[])),
  archivo_path text NOT NULL,
  est_documento boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ultima_act_doc timestamp with time zone,
  CONSTRAINT producto_documento_pkey PRIMARY KEY (id_documento),
  CONSTRAINT fk_producto_documento_producto FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod)
);
CREATE TABLE public.marca_producto (
  id_marca smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_marca character varying NOT NULL,
  marca_destacar boolean DEFAULT false,
  logo_url text,
  est_marca boolean NOT NULL DEFAULT false,
  id_estado_marca smallint NOT NULL DEFAULT 1,
  CONSTRAINT marca_producto_pkey PRIMARY KEY (id_marca),
  CONSTRAINT marca_producto_id_estado_marca_fkey FOREIGN KEY (id_estado_marca) REFERENCES public.estado_marca(id_estado_marca)
);
CREATE TABLE public.cotizacion (
  id_cotizacion bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_user uuid,
  fecha_cot timestamp with time zone NOT NULL DEFAULT now(),
  id_medio_cont smallint NOT NULL,
  comentario character varying,
  id_estado_cot smallint NOT NULL,
  fecha_emision date,
  fecha_validez date,
  dias_validez_aplicados smallint CHECK (dias_validez_aplicados IS NULL OR dias_validez_aplicados >= 1 AND dias_validez_aplicados <= 365),
  tasa_iva_aplicada numeric CHECK (tasa_iva_aplicada IS NULL OR tasa_iva_aplicada >= 0::numeric AND tasa_iva_aplicada <= 100::numeric),
  subtotal_neto bigint,
  monto_iva bigint,
  total_bruto bigint,
  notas_cotizacion text CHECK (notas_cotizacion IS NULL OR length(notas_cotizacion) <= 1000),
  folio_cotizacion character varying NOT NULL UNIQUE,
  fecha_resolucion timestamp with time zone,
  identidad_cliente jsonb,
  CONSTRAINT cotizacion_pkey PRIMARY KEY (id_cotizacion),
  CONSTRAINT cotizacion_id_medio_cont_fkey FOREIGN KEY (id_medio_cont) REFERENCES public.medio_contacto(id_medio_cont),
  CONSTRAINT cotizacion_id_estado_cot_fkey FOREIGN KEY (id_estado_cot) REFERENCES public.estado_cotizacion(id_estado_cot),
  CONSTRAINT cotizacion_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.usuario(id_user)
);
CREATE TABLE public.detalle_cotizacion (
  id_detalle_cot bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_cotizacion bigint NOT NULL,
  es_producto_catalogo boolean NOT NULL DEFAULT true,
  id_prod bigint,
  nom_producto_solicitado character varying,
  cantidad integer NOT NULL DEFAULT 1,
  marca_producto_solicitado character varying,
  valor_bruto bigint,
  es_cotizable boolean NOT NULL DEFAULT true,
  CONSTRAINT detalle_cotizacion_pkey PRIMARY KEY (id_detalle_cot),
  CONSTRAINT detalle_cotizacion_id_prod_fkey FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod),
  CONSTRAINT detalle_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(id_cotizacion)
);
CREATE TABLE public.estado_cotizacion (
  id_estado_cot smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_estado character varying NOT NULL,
  CONSTRAINT estado_cotizacion_pkey PRIMARY KEY (id_estado_cot)
);
CREATE TABLE public.medio_contacto (
  id_medio_cont smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_medio character varying NOT NULL,
  CONSTRAINT medio_contacto_pkey PRIMARY KEY (id_medio_cont)
);
CREATE TABLE public.unidad_medida (
  id_und_medida smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_und_medida character varying NOT NULL,
  CONSTRAINT unidad_medida_pkey PRIMARY KEY (id_und_medida)
);
CREATE TABLE public.producto_cambio (
  id_cambio bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_prod bigint NOT NULL,
  id_user uuid,
  fecha_cambio timestamp with time zone NOT NULL DEFAULT now(),
  tipo_accion character varying NOT NULL,
  campos_modificados jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado_anterior smallint,
  estado_nuevo smallint,
  revisado boolean NOT NULL DEFAULT false,
  comentario text,
  id_user_historico uuid,
  CONSTRAINT producto_cambio_pkey PRIMARY KEY (id_cambio),
  CONSTRAINT producto_cambio_id_prod_fkey FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod),
  CONSTRAINT producto_cambio_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.usuario(id_user)
);
CREATE TABLE public.despacho (
  id_despacho bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  transportista character varying,
  num_seguimiento character varying,
  fecha_despacho timestamp with time zone,
  costo_envio integer NOT NULL,
  id_pedido bigint NOT NULL,
  id_tipo_despacho smallint NOT NULL,
  direccion_despacho character varying,
  comuna_despacho character varying,
  requiere_coordinacion boolean NOT NULL DEFAULT false,
  CONSTRAINT despacho_pkey PRIMARY KEY (id_despacho),
  CONSTRAINT despacho_id_tipo_despacho_fkey FOREIGN KEY (id_tipo_despacho) REFERENCES public.tipo_despacho(id_tipo_despacho),
  CONSTRAINT despacho_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido)
);
CREATE TABLE public.tipo_despacho (
  id_tipo_despacho smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_tipo_despacho character varying NOT NULL,
  costo integer NOT NULL DEFAULT 0 CHECK (costo >= 0),
  est_tipo boolean NOT NULL DEFAULT true,
  requiere_coordinacion boolean NOT NULL DEFAULT false,
  CONSTRAINT tipo_despacho_pkey PRIMARY KEY (id_tipo_despacho)
);
CREATE TABLE public.detalle_factura (
  id_detalle_factura bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pedido bigint NOT NULL UNIQUE,
  rut_empresa character varying NOT NULL,
  razon_social character varying NOT NULL,
  giro character varying NOT NULL,
  direccion_factura character varying NOT NULL,
  id_comuna integer NOT NULL,
  telefono character varying,
  correo character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT detalle_factura_pkey PRIMARY KEY (id_detalle_factura),
  CONSTRAINT detalle_factura_id_comuna_fkey FOREIGN KEY (id_comuna) REFERENCES public.comuna(id_comuna),
  CONSTRAINT detalle_factura_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido)
);
CREATE TABLE public.tipo_peligrosidad (
  id_peligrosidad smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nom_peligrosidad character varying NOT NULL UNIQUE,
  CONSTRAINT tipo_peligrosidad_pkey PRIMARY KEY (id_peligrosidad)
);
CREATE TABLE public.producto_peligrosidad (
  id_prod bigint NOT NULL,
  id_peligrosidad smallint NOT NULL,
  CONSTRAINT producto_peligrosidad_pkey PRIMARY KEY (id_prod, id_peligrosidad),
  CONSTRAINT producto_peligrosidad_id_prod_fkey FOREIGN KEY (id_prod) REFERENCES public.producto(id_prod),
  CONSTRAINT producto_peligrosidad_id_peligrosidad_fkey FOREIGN KEY (id_peligrosidad) REFERENCES public.tipo_peligrosidad(id_peligrosidad)
);
CREATE TABLE public.estado_pago (
  id_estado_pago smallint NOT NULL,
  codigo character varying NOT NULL UNIQUE,
  nom_estado_pago character varying NOT NULL,
  es_final boolean NOT NULL DEFAULT false,
  CONSTRAINT estado_pago_pkey PRIMARY KEY (id_estado_pago)
);
CREATE TABLE public.configuracion_cotizacion (
  id_configuracion smallint NOT NULL DEFAULT 1 CHECK (id_configuracion = 1),
  dias_validez smallint NOT NULL DEFAULT 15 CHECK (dias_validez >= 1 AND dias_validez <= 365),
  actualizado_por uuid,
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  tasa_iva numeric NOT NULL DEFAULT 19.00 CHECK (tasa_iva >= 0::numeric AND tasa_iva <= 100::numeric),
  id_plantilla_activa bigint NOT NULL,
  CONSTRAINT configuracion_cotizacion_pkey PRIMARY KEY (id_configuracion),
  CONSTRAINT configuracion_cotizacion_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES auth.users(id),
  CONSTRAINT configuracion_cotizacion_plantilla_activa_fk FOREIGN KEY (id_plantilla_activa) REFERENCES public.plantilla_cotizacion(id_plantilla)
);
CREATE TABLE public.plantilla_cotizacion (
  id_plantilla bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre_plantilla character varying NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM nombre_plantilla)) > 0),
  razon_social character varying NOT NULL CHECK (length(TRIM(BOTH FROM razon_social)) > 0),
  rut_empresa character varying NOT NULL CHECK (length(TRIM(BOTH FROM rut_empresa)) > 0),
  actividad_comercial character varying NOT NULL CHECK (length(TRIM(BOTH FROM actividad_comercial)) > 0),
  direccion_empresa character varying NOT NULL CHECK (length(TRIM(BOTH FROM direccion_empresa)) > 0),
  telefono_empresa character varying,
  correo_empresa character varying,
  departamento_emisor character varying NOT NULL DEFAULT 'DEPTO. VENTAS'::character varying CHECK (length(TRIM(BOTH FROM departamento_emisor)) > 0),
  forma_pago_predeterminada character varying NOT NULL DEFAULT 'TRANSFERENCIA'::character varying CHECK (length(TRIM(BOTH FROM forma_pago_predeterminada)) > 0),
  nombre_elaborador character varying,
  cargo_elaborador character varying DEFAULT 'VENTAS'::character varying,
  nombre_autorizador character varying,
  cargo_autorizador character varying DEFAULT 'GERENCIA COMERCIAL'::character varying,
  texto_pie_pagina character varying,
  correo_pie_pagina character varying,
  logo_storage_path text,
  firma_elaborador_storage_path text,
  firma_autorizador_storage_path text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_por uuid,
  CONSTRAINT plantilla_cotizacion_pkey PRIMARY KEY (id_plantilla),
  CONSTRAINT plantilla_cotizacion_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES auth.users(id)
);
CREATE TABLE public.documento_cotizacion (
  id_documento bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_cotizacion bigint NOT NULL UNIQUE,
  id_plantilla bigint NOT NULL,
  version smallint NOT NULL DEFAULT 1 CHECK (version > 0),
  storage_path text NOT NULL UNIQUE CHECK (length(TRIM(BOTH FROM storage_path)) > 0),
  nombre_archivo character varying NOT NULL CHECK (length(TRIM(BOTH FROM nombre_archivo)) > 0),
  datos_documento jsonb NOT NULL CHECK (jsonb_typeof(datos_documento) = 'object'::text),
  tamano_bytes bigint CHECK (tamano_bytes IS NULL OR tamano_bytes > 0),
  generado_por uuid,
  generado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT documento_cotizacion_pkey PRIMARY KEY (id_documento),
  CONSTRAINT documento_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(id_cotizacion),
  CONSTRAINT documento_cotizacion_id_plantilla_fkey FOREIGN KEY (id_plantilla) REFERENCES public.plantilla_cotizacion(id_plantilla),
  CONSTRAINT documento_cotizacion_generado_por_fkey FOREIGN KEY (generado_por) REFERENCES auth.users(id)
);
CREATE TABLE public.metodo_pago (
  id_metodo_pago smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre character varying NOT NULL,
  codigo character varying NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT false,
  orden smallint NOT NULL DEFAULT 0,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT metodo_pago_pkey PRIMARY KEY (id_metodo_pago)
);
CREATE TABLE public.pago_detalle (
  id_detalle bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_pago bigint NOT NULL UNIQUE,
  referencia_externa character varying,
  datos_proveedor jsonb NOT NULL DEFAULT '{}'::jsonb,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pago_detalle_pkey PRIMARY KEY (id_detalle),
  CONSTRAINT pago_detalle_id_pago_fkey FOREIGN KEY (id_pago) REFERENCES public.pago(id_pago)
);
CREATE TABLE public.contador_folio_cotizacion (
  fecha_folio date NOT NULL,
  ultimo_numero integer NOT NULL CHECK (ultimo_numero > 0),
  CONSTRAINT contador_folio_cotizacion_pkey PRIMARY KEY (fecha_folio)
);
CREATE TABLE public.estado_marca (
  id_estado_marca smallint NOT NULL CHECK (id_estado_marca >= 1 AND id_estado_marca <= 3),
  nom_estado_marca character varying NOT NULL UNIQUE CHECK (char_length(TRIM(BOTH FROM nom_estado_marca)) >= 3),
  CONSTRAINT estado_marca_pkey PRIMARY KEY (id_estado_marca)
);
CREATE TABLE public.contador_folio_pedido (
  fecha_folio date NOT NULL,
  ultimo_numero integer NOT NULL CHECK (ultimo_numero > 0),
  CONSTRAINT contador_folio_pedido_pkey PRIMARY KEY (fecha_folio)
);
CREATE TABLE public.contador_folio_pago (
  fecha_folio date NOT NULL,
  ultimo_numero integer NOT NULL CHECK (ultimo_numero > 0),
  CONSTRAINT contador_folio_pago_pkey PRIMARY KEY (fecha_folio)
);
CREATE TABLE public.notificacion_cotizacion (
  id_cotizacion bigint NOT NULL,
  destino text NOT NULL CHECK (destino = ANY (ARRAY['cliente'::text, 'administrador'::text, 'cotizacion_pdf_cliente'::text])),
  estado text NOT NULL CHECK (estado = ANY (ARRAY['procesando'::text, 'aceptado'::text, 'fallido'::text, 'incierto'::text])),
  clave uuid NOT NULL,
  intentos smallint NOT NULL DEFAULT 1 CHECK (intentos >= 1 AND intentos <= 3),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notificacion_cotizacion_pkey PRIMARY KEY (id_cotizacion, destino),
  CONSTRAINT notificacion_cotizacion_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(id_cotizacion)
);
CREATE TABLE public.busqueda_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  consulta text NOT NULL,
  categoria_predicha text,
  probabilidad real,
  resultados integer,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT busqueda_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.registro_eliminacion_cuentas (
  id_usuario uuid NOT NULL,
  eliminado_en timestamp with time zone,
  preparado_en timestamp with time zone,
  revisado_en timestamp with time zone,
  CONSTRAINT registro_eliminacion_cuentas_pkey PRIMARY KEY (id_usuario)
);
CREATE TABLE public.aceptacion_privacidad (
  id_usuario uuid NOT NULL,
  version_politica text NOT NULL CHECK (version_politica = btrim(version_politica) AND char_length(version_politica) >= 1 AND char_length(version_politica) <= 40),
  aceptado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aceptacion_privacidad_pkey PRIMARY KEY (id_usuario, version_politica),
  CONSTRAINT aceptacion_privacidad_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES auth.users(id),
  CONSTRAINT aceptacion_privacidad_version_fkey FOREIGN KEY (version_politica) REFERENCES public.version_politicas(version_politica)
);
CREATE TABLE public.version_politicas (
  version_politica text NOT NULL CHECK (version_politica = btrim(version_politica) AND char_length(version_politica) >= 1 AND char_length(version_politica) <= 40),
  fecha_documento date NOT NULL,
  ruta_documento text NOT NULL CHECK (ruta_documento = btrim(ruta_documento) AND char_length(ruta_documento) > 0),
  vigente boolean NOT NULL DEFAULT false,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT version_politicas_pkey PRIMARY KEY (version_politica)
);