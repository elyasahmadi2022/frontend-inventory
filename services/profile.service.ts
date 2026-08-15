import { ApiError, apiRequest } from "@/lib/api";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";

type ApiEnvelope<TData> = {
  success: boolean;
  message: string;
  status: number;
  data?: TData;
};

function jsonHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  return headers;
}

export type UpdateProfileBody = {
  name?: string;
  phone?: string;
  bio?: string;
  profilePhoto?: File | null;
  coverPhoto?: File | null;
};

/**
 * PATCH `/api/auth/me` — JSON for text fields, multipart when uploading photos.
 */
export async function updateProfile(body: UpdateProfileBody): Promise<AuthUser> {
  const hasFiles = Boolean(body.profilePhoto || body.coverPhoto);

  if (hasFiles) {
    const form = new FormData();
    if (body.name) form.set("fullName", body.name);
    if (body.profilePhoto) form.append("profileImage", body.profilePhoto);

    await apiRequest<ApiEnvelope<unknown>>("/api/auth/me", {
      method: "PATCH",
      body: form,
    });
  } else {
    await apiRequest<ApiEnvelope<unknown>>("/api/auth/me", {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({
        fullName: body.name,
      }),
    });
  }

  return getCurrentUser();
}

/** Upload only profile and/or cover photos (owner dashboard hero). */
export async function uploadProfilePhotos(body: {
  profilePhoto?: File | null;
  coverPhoto?: File | null;
}): Promise<AuthUser> {
  if (!body.profilePhoto && !body.coverPhoto) {
    throw new ApiError("Choose a photo to upload.", { status: 400 });
  }

  return updateProfile(body);
}

/** Owner resubmits Jawaz documents for admin verification review. */
export async function submitVerificationRequest(body: {
  jawazNumber: string;
  jawazImages: File[];
}): Promise<AuthUser> {
  if (body.jawazImages.length < 2) {
    throw new ApiError("Upload at least two Jawaz document images.", {
      status: 400,
    });
  }

  const form = new FormData();
  form.set("jawaz_number", body.jawazNumber.trim());
  for (const file of body.jawazImages) {
    form.append("jawazImages", file);
  }

  await apiRequest<ApiEnvelope<unknown>>("/api/v1/auth/me/verification", {
    method: "POST",
    body: form,
  });

  return getCurrentUser();
}

export type UpgradeOwnerRequest = {
  phone: string;
  bio?: string;
  jawazNumber: string;
  jawazImages: File[];
  profilePhoto?: File | null;
  coverPhoto?: File | null;
};

/** Submit owner application for a logged-in buyer account. */
export async function upgradeToOwner(body: UpgradeOwnerRequest): Promise<AuthUser> {
  if (body.jawazImages.length < 2) {
    throw new ApiError("Upload at least two Jawaz document images.", {
      status: 400,
    });
  }

  const form = new FormData();
  form.set("phone", body.phone);
  if (body.bio) form.set("bio", body.bio);
  form.set("jawaz_number", body.jawazNumber);
  for (const file of body.jawazImages) {
    form.append("jawazImages", file);
  }
  if (body.profilePhoto) form.append("profilePhoto", body.profilePhoto);
  if (body.coverPhoto) form.append("coverPhoto", body.coverPhoto);

  await apiRequest<ApiEnvelope<unknown>>("/api/v1/auth/me/upgrade-owner", {
    method: "POST",
    body: form,
  });

  return getCurrentUser();
}

/** Permanently delete the authenticated account. */
export async function deleteAccount(body: {
  password: string;
  confirmation: string;
}): Promise<void> {
  await apiRequest<ApiEnvelope<unknown>>("/api/v1/auth/me", {
    method: "DELETE",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
}

/** Matches Postman v4: `POST .../auth/change-password` with camelCase JSON. */
export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Logged-in change password (cookie session). Backend: `POST /api/v1/auth/change-password`.
 */
export async function changePassword(body: ChangePasswordBody): Promise<void> {
  const paths = [
    "/api/auth/me/password",
  ];
  for (const path of paths) {
    try {
      await apiRequest<ApiEnvelope<unknown>>(path, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify(body),
      });
      return;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) continue;
      throw e;
    }
  }
  throw new ApiError(
    "Change-password API is not available. Expected PATCH /api/auth/me/password with JSON { currentPassword, newPassword }.",
    { status: 404 },
  );
}
