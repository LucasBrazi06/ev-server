import CreatedUpdatedProps from './CreatedUpdatedProps';
import SiteArea from './SiteArea';
import { InactivityStatus, InactivityStatusLevel } from './Transaction';
import { KeyValue } from './GlobalType';
import { OCPPProtocol, OCPPVersion, ChargePointStatus } from './ocpp/OCPPServer';

export default interface ChargingStation extends CreatedUpdatedProps {
  id?: string;
  issuer: boolean;
  siteAreaID?: string;
  chargePointSerialNumber: string;
  chargePointModel: string;
  chargeBoxSerialNumber: string;
  chargePointVendor: string;
  iccid: string;
  imsi: string;
  meterType: string;
  firmwareVersion: string;
  meterSerialNumber: string;
  endpoint: string;
  ocppVersion: OCPPVersion;
  ocppProtocol: OCPPProtocol;
  cfApplicationIDAndInstanceIndex: string;
  lastHeartBeat: Date;
  deleted: boolean;
  inactive: boolean;
  lastReboot: Date;
  chargingStationURL: string;
  maximumPower: number;
  cannotChargeInParallel: boolean;
  powerLimitUnit: PowerLimitUnits;
  coordinates: number[];
  connectors: Connector[];
  currentIPAddress?: string;
  siteArea?: SiteArea;
  capabilities?: ChargingStationCapabilities;
  ocppAdvancedCommands?: OcppAdvancedCommands[];
  ocppStandardParameters?: KeyValue[];
  ocppVendorParameters?: KeyValue[];
  currentType: ChargingStationCurrentType;
}

export enum ChargingStationCurrentType {
  AC = 'AC',
  DC = 'DC',
  AC_DC = 'AC/DC',
}

export interface OcppCommand {
  command: string;
  parameters: string[];
}

export interface OcppAdvancedCommands {
  command: string|OcppCommand;
}

export enum PowerLimitUnits {
  WATT = 'W',
  AMPERE = 'A'
}

export enum StaticLimitAmps {
  MIN_LIMIT = 8,
}

export interface Connector {
  id?: string;
  connectorId: number;
  currentConsumption: number;
  currentStateOfCharge?: number;
  totalInactivitySecs?: number;
  totalConsumption?: number;
  status: ChargePointStatus;
  errorCode?: string;
  info?: string;
  vendorErrorCode?: string;
  power: number;
  type: ConnectorType;
  voltage?: number;
  amperage?: number;
  amperageLimit?: number;
  activeTransactionID?: number;
  activeTransactionDate?: Date;
  activeTagID?: string;
  statusLastChangedOn?: Date;
  inactivityStatusLevel?: InactivityStatusLevel; // TODO: Use in the mobile app, to be removed in V1.3
  inactivityStatus?: InactivityStatus;
  numberOfConnectedPhase?: number;
  currentType?: ConnectorCurrentType;
}

export interface ConnectorCurrentLimit {
  limitAmps: number;
  limitWatts: number;
}

export enum ConnectorCurrentType {
  AC = 'AC',
  DC = 'DC'
}

export interface ChargingStationTemplate {
  id?: string;
  chargePointVendor: string;
  extraFilters: {
    chargeBoxSerialNumber?: string;
  };
  template: {
    cannotChargeInParallel: boolean;
    currentType: ChargingStationCurrentType;
    maximumPower: number;
    connectors: {
      connectorId: number;
      power: number;
      type: ConnectorType;
      currentType: ConnectorCurrentType;
      numberOfConnectedPhase: number;
      voltage: number;
      amperage: number;
    }[];
    capabilities: {
      supportedFirmwareVersions: string[];
      supportedOcppVersions: string[];
      capabilities: ChargingStationCapabilities;
    }[];
    ocppAdvancedCommands: {
      supportedFirmwareVersions: string[];
      supportedOcppVersions: string[];
      commands: OcppAdvancedCommands[];
    }[];
    ocppStandardParameters: {
      supportedOcppVersions: string[];
      parameters: object;
    }[];
    ocppVendorParameters: {
      supportedFirmwareVersions: string[];
      supportedOcppVersions: string[];
      parameters: object;
    }[];
  };
}

export enum ConnectorType {
  TYPE_2 = 'T2',
  COMBO_CCS = 'CCS',
  CHADEMO = 'C',
  TYPE_1 = 'T1',
  TYPE_3C = 'T3C',
  TYPE_1_CCS = 'T1CCS',
  DOMESTIC = 'D',
  UNKNOWN = 'U',
}

export interface ChargingStationCapabilities {
  supportStaticLimitationForChargingStation: boolean;
  supportStaticLimitationPerConnector: boolean;
  supportChargingProfiles: boolean;
}

export interface ChargingStationConfiguration {
  id: string;
  timestamp: Date;
  configuration: KeyValue[];
}

export type OCPPParams = {
  siteName: string;
  siteAreaName: string;
  chargingStationName: string;
  params: ChargingStationConfiguration;
};

export enum ChargerVendor {
  EBEE = 'Bender GmbH Co. KG',
  SCHNEIDER = 'Schneider Electric',
  ABB = 'ABB',
}
