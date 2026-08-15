import { hydrateApiAuthFromStorage } from "@/services/auth-session";
import {
  fetchEmailVerificationStatus,
  requestEmailVerificationOtp,
  verifyEmailWithOtp,
} from "@/services/auth.service";

function ensureAuth() {
  hydrateApiAuthFromStorage();
}

export const authQueryApi = {
  getEmailVerificationStatus: async () => {
    ensureAuth();
    return fetchEmailVerificationStatus();
  },

  requestEmailVerificationOtp: async () => {
    ensureAuth();
    return requestEmailVerificationOtp();
  },

  verifyEmailWithOtp: async (code: string) => {
    ensureAuth();
    return verifyEmailWithOtp(code);
  },
};
