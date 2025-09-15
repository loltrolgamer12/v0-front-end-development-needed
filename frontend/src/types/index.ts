export interface InspectionData {
  FECHA: string;
  CONDUCTOR: string;
  '¿Ha dormido al menos 7 horas en las últimas 24 horas?': string;
  '¿Se encuentra libre de síntomas de fatiga (Somnolencia, dolor de cabeza, irritabilidad)?': string;
  '¿Se siente en condiciones físicas y mentales para conducir?': string;
  '¿Ha consumido medicamentos o sustancias que afecten su estado de alerta?*': string;
}

export interface FatigueData {
  fecha: string;
  conductor: string;
  horasSueno: boolean;
  sinSintomas: boolean;
  condicionesOptimas: boolean;
  sinSustancias: boolean;
  esFalla: boolean;
}

export interface DriverStats {
  conductor: string;
  totalInspecciones: number;
  fallos: number;
  tasaCumplimiento: number;
}

export interface TrendData {
  fecha: string;
  total: number;
  fallos: number;
  cumplimiento: number;
}