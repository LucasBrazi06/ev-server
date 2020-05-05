import { PricingSetting, PricingSettingsType } from '../../types/Setting';

import ConvergentChargingPricingIntegration from './export-convergent-charging';
import DummyPricingIntegration from './DummyPricingIntegration';
import PricingIntegration from './PricingIntegration';
import SettingStorage from '../../storage/mongodb/SettingStorage';
import SimplePricingIntegration from './simple-pricing/SimplePricingIntegration';
import Tenant from '../../types/Tenant';
import TenantComponents from '../../types/TenantComponents';
import TenantStorage from '../../storage/mongodb/TenantStorage';
import Utils from '../../utils/Utils';

export default class PricingFactory {
  static async getPricingImpl(tenantID: string): Promise<PricingIntegration<PricingSetting>> {
    // Get the tenant
    const tenant: Tenant = await TenantStorage.getTenant(tenantID);
    // Check if the pricing is active
    if (Utils.isTenantComponentActive(tenant, TenantComponents.PRICING)) {
      // Get the pricing's settings
      const pricingSetting = await SettingStorage.getPricingSettings(tenantID);
      // Check
      if (pricingSetting) {
        // SAP Convergent Charging
        if (pricingSetting.type === PricingSettingsType.CONVERGENT_CHARGING) {
          const ConvergentChargingPricingIntegrationImpl = new ConvergentChargingPricingIntegration(tenantID, pricingSetting.convergentCharging);
          if (ConvergentChargingPricingIntegrationImpl instanceof DummyPricingIntegration) {
            return null;
          }
          // Return the CC implementation
          return ConvergentChargingPricingIntegrationImpl;
        // Simple Pricing
        } else if (pricingSetting.type === PricingSettingsType.SIMPLE) {
          // Return the Simple Pricing implementation
          return new SimplePricingIntegration(tenantID, pricingSetting.simple);
        }
      }
    }
    // Pricing is not active
    return null;
  }
}

