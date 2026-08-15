"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authQueryApi } from "@/lib/query/api/auth.api";
import { queryKeys } from "@/lib/query/query-keys";

export function useEmailVerificationStatusQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.emailVerification(),
    queryFn: () => authQueryApi.getEmailVerificationStatus(),
    enabled,
  });
}

export function useRequestEmailVerificationOtpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authQueryApi.requestEmailVerificationOtp(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.auth.emailVerification(),
      });
    },
  });
}

export function useVerifyEmailOtpMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => authQueryApi.verifyEmailWithOtp(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.auth.emailVerification(),
      });
    },
  });
}
