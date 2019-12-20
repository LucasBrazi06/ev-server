import Connector from './Connector';
import CreatedUpdatedProps from './CreatedUpdatedProps';
import SiteArea from './SiteArea';

export default interface ChargingStation extends CreatedUpdatedProps {
  id?: string;
  siteAreaID: string;
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
  ocppVersion: string;
  ocppProtocol: string;
  cfApplicationIDAndInstanceIndex: string;
  lastHeartBeat: Date;
  deleted: boolean;
  inactive: boolean;
  lastReboot: Date;
  chargingStationURL: string;
  numberOfConnectedPhase: number;
  maximumPower: number;
  cannotChargeInParallel: boolean;
  powerLimitUnit: PowerLimitUnits;
  coordinates: number[];
  connectors: Connector[];
  errorCode?: string;
  currentIPAddress?: string;
  siteArea?: SiteArea;
  capabilities?: ChargingStationCapabilities;
}

export enum PowerLimitUnits {
  WATT = 'W',
  AMPERE = 'A'
}

export interface ChargingStationTemplate {
  id?: string;
  chargePointVendor: string;
  extraFilters: {
    chargeBoxSerialNumber?: string;
  };
  template: Partial<ChargingStation>;
}

export interface ChargingStationCapabilities {
  supportStaticLimitationForChargingStation: boolean;
  supportStaticLimitationPerConnector: boolean;
  supportChargePointMaxProfile: boolean;
  supportTxDefaultProfile: boolean;
  supportTxProfile: boolean;
}
