"use client";

import { useRouter } from "next/navigation";
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
    profile,
    isOwner,
    currentUser,
    isFollowing,
}: ProfileOverviewProps) {
    const router = useRouter();

    return (
        <ProfilePanel
            currentUser={isOwner ? currentUser : null}
            profile={profile}
            canEdit={isOwner}
            onProfileSaved={() => {
                router.refresh();
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
