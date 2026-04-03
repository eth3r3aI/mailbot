import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import type { User, UserProfile } from "@prisma/client";
import { requireCurrentUser } from "@/lib/current-user";
import { getDefaultProfileValues } from "@/lib/default-profile";
import { prisma } from "@/lib/prisma";

export const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  currentTitle: z.string().min(1, "Current title is required."),
  company: z.string().min(1, "Company is required."),
  shortBio: z.string().min(1, "Short bio is required."),
  educationSummary: z.string().min(1, "Education summary is required."),
  backgroundSummary: z.string().min(1, "Background summary is required."),
  experienceHighlights: z.string().min(1, "Experience highlights are required."),
  expertiseAreas: z.string().min(1, "Expertise areas are required."),
  targetAudience: z.string().min(1, "Target audience is required."),
  tonePreference: z.string().min(1, "Tone preference is required."),
  ctaPreference: z.string().min(1, "CTA preference is required."),
  aboutText: z.string().min(1, "About text is required.")
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type StoredResume = {
  fileName: string;
  mimeType: string;
};

function mapProfileValues(user: User & { profile?: UserProfile | null }) {
  const defaults = getDefaultProfileValues();

  return {
    values: {
      fullName: user.fullName ?? defaults.fullName,
      currentTitle: user.profile?.currentTitle ?? defaults.currentTitle,
      company: user.profile?.company ?? defaults.company,
      shortBio: user.profile?.shortBio ?? defaults.shortBio,
      educationSummary: user.profile?.educationSummary ?? defaults.educationSummary,
      backgroundSummary: user.profile?.backgroundSummary ?? defaults.backgroundSummary,
      experienceHighlights:
        user.profile?.experienceHighlights ?? defaults.experienceHighlights,
      expertiseAreas: user.profile?.expertiseAreas ?? defaults.expertiseAreas,
      targetAudience: user.profile?.targetAudience ?? defaults.targetAudience,
      tonePreference: user.profile?.tonePreference ?? defaults.tonePreference,
      ctaPreference: user.profile?.ctaPreference ?? defaults.ctaPreference,
      aboutText: user.profile?.aboutText ?? defaults.aboutText
    }
  };
}

export async function getCurrentUserProfile() {
  noStore();

  const user = await requireCurrentUser();

  return {
    userId: user.id,
    resume:
      user.profile?.resumeFileName && user.profile?.resumeMimeType
        ? {
            fileName: user.profile.resumeFileName,
            mimeType: user.profile.resumeMimeType
          }
        : null,
    ...mapProfileValues(user)
  };
}

export async function getProfileForUser(user: User & { profile?: UserProfile | null }) {
  noStore();

  return {
    userId: user.id,
    resume:
      user.profile?.resumeFileName && user.profile?.resumeMimeType
        ? {
            fileName: user.profile.resumeFileName,
            mimeType: user.profile.resumeMimeType
          }
        : null,
    ...mapProfileValues(user)
  };
}

export async function saveProfileForUser(userId: string, input: ProfileInput) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: input.fullName
    }
  });

  return prisma.userProfile.upsert({
    where: {
      userId
    },
    update: {
      currentTitle: input.currentTitle,
      company: input.company,
      shortBio: input.shortBio,
      educationSummary: input.educationSummary,
      backgroundSummary: input.backgroundSummary,
      experienceHighlights: input.experienceHighlights,
      expertiseAreas: input.expertiseAreas,
      targetAudience: input.targetAudience,
      tonePreference: input.tonePreference,
      ctaPreference: input.ctaPreference,
      aboutText: input.aboutText
    },
    create: {
      userId,
      currentTitle: input.currentTitle,
      company: input.company,
      shortBio: input.shortBio,
      educationSummary: input.educationSummary,
      backgroundSummary: input.backgroundSummary,
      experienceHighlights: input.experienceHighlights,
      expertiseAreas: input.expertiseAreas,
      targetAudience: input.targetAudience,
      tonePreference: input.tonePreference,
      ctaPreference: input.ctaPreference,
      aboutText: input.aboutText
    }
  });
}

export async function saveCurrentUserProfile(input: ProfileInput) {
  const user = await requireCurrentUser();

  return saveProfileForUser(user.id, input);
}

export async function saveResumeForUser(args: {
  userId: string;
  fileName: string;
  mimeType: string;
  dataBase64: string;
}) {
  return prisma.userProfile.upsert({
    where: {
      userId: args.userId
    },
    update: {
      resumeFileName: args.fileName,
      resumeMimeType: args.mimeType,
      resumeDataBase64: args.dataBase64
    },
    create: {
      userId: args.userId,
      resumeFileName: args.fileName,
      resumeMimeType: args.mimeType,
      resumeDataBase64: args.dataBase64
    }
  });
}
