export type Period =
  | "day"
  | "yesterday"
  | "week"
  | "month"
  | "lastMonth"
  | "customMonth"
  | "custom"
  | "all";

export const periodsConfig: { value: Period; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mes" },
  { value: "lastMonth", label: "Mes Pasado" },
  { value: "customMonth", label: "Elegir mes" },
  { value: "all", label: "Todo el tiempo" },
  { value: "custom", label: "Elegir día" },
];
