"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FollowButton } from "./FollowButton";
import { ProfilePanel } from "./ProfilePanel";
import type { CurrentUser, Profile } from "./types";

type ProfileOverviewProps = {
    profile: Profile;
    isOwner: boolean;
    currentUser: CurrentUser | null;
    isFollowing: boolean;
};

export function ProfileOverview({
    profile: initialProfile,
    isOwner,
    currentUser,
    isFollowing,
}: ProfileOverviewProps) {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile>(initialProfile);

    useEffect(() => {
        setProfile(initialProfile);
    }, [initialProfile]);

    return (
        <ProfilePanel
            currentUser={isOwner ? currentUser : null}
            profile={profile}
            canEdit={isOwner}
            onProfileSaved={(updatedProfile) => {
                setProfile(updatedProfile);
                if (
                    updatedProfile.username &&
                    updatedProfile.username !== initialProfile.username
                ) {
                    router.push(`/profile/${updatedProfile.username}`);
                } else {
                    router.refresh();
                }
            }}
            actions={
                !isOwner ? (
                    <FollowButton
                        targetUserId={profile.userId}
                        targetUsername={profile.username}
                        initialFollowing={isFollowing}
                        initialFollowers={profile.followers?.length || 0}
                    />
                ) : null
            }
        />
    );
}
