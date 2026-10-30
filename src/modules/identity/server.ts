// Parte del contrato del módulo identity que solo puede usarse en el servidor.
export { setupNewUser, recordPrivacyConsent, hasCurrentPrivacyConsent, PRIVACY_VERSION } from "./application/setup";
export {
  getProfile,
  updateProfile,
  completeOnboarding,
  setUnitsDuringOnboarding,
  isOnboardingDone,
  getTheme,
  deleteOwnAccount,
} from "./application/profile";
