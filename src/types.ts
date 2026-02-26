export type Encoding =
  | "auto"
  | "rfc3339"
  | "iso8601"
  | "unix"
  | "unixms"
  | "ntp"
  | "httpdate"
  | "emaildate"
  | "gps"
  | "tai"
  | "jd"
  | "mjd"
  | "excel1900"
  | "excel1904"
  | "weekdate"
  | "ordinal"
  | "doy";

export type ValidationProfile =
  | "rfc3339"
  | "iso8601"
  | "iso8601:strict"
  | "iso8601:extended"
  | "iso8601:basic";
export type ValidationMode = "strict" | "lenient";

export type Diagnostic = {
  code: string;
  message: string;
  at?: number;
};

export type ParsedParts = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  fraction?: string;
  offset?: string;
};

export type ValidationResult = {
  valid: boolean;
  profile: ValidationProfile;
  mode: ValidationMode;
  canonical: string | null;
  parsed?: ParsedParts;
  errors: Diagnostic[];
  warnings: Diagnostic[];
};

export type Instant = {
  unixMs: number;
  nsRemainder: number;
  excel1900LeapBug?: boolean;
};

export type ConversionResult = {
  in: Encoding;
  out: Exclude<Encoding, "auto">;
  value_in: string;
  value_out: string;
  tz: string | null;
  precision: number | null;
  instant: {
    rfc3339z: string;
    unix: number;
    unixms: number;
  };
  notes: string[];
  candidates?: Exclude<Encoding, "auto">[];
};

export type LeapSecondEntry = {
  effective: string;
  taiMinusUtc: number;
};
