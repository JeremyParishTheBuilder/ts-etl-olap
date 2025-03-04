export enum TraceType {
  IBC = "ibc",
  IBC_CW20 = "ibc-cw20",
  IBC_BRIDGE = "ibc-bridge",
  BRIDGE = "bridge",
  WRAPPED = "wrapped",
  LIQUID_STAKE = "liquid-stake",
  SYNTHETIC = "synthetic",
  ADDITIONAL_MINTAGE = "additional-mintage",
  TEST_MINTAGE = "test-mintage",
  LEGACY_MINTAGE = "legacy-mintage"
}

export const allTraceTypes = [
  TraceType.IBC,
  TraceType.IBC_CW20,
  TraceType.IBC_BRIDGE,
  TraceType.BRIDGE,
  TraceType.WRAPPED,
  TraceType.LIQUID_STAKE,
  TraceType.SYNTHETIC,
  TraceType.ADDITIONAL_MINTAGE,
  TraceType.TEST_MINTAGE,
  TraceType.LEGACY_MINTAGE
];

export const nonIbcTransition = [
  TraceType.BRIDGE,
  TraceType.WRAPPED,
  TraceType.LIQUID_STAKE,
  TraceType.SYNTHETIC,
  TraceType.ADDITIONAL_MINTAGE,
  TraceType.TEST_MINTAGE,
  TraceType.LEGACY_MINTAGE
];

export const ibcTraceTypes = [
  TraceType.IBC,
  TraceType.IBC_CW20
];