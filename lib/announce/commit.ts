import type { GitHubCommit } from "./github";

export type CommitCategory =
    | "feature"
    | "fix"
    | "improvement"
    | "docs"
    | "test"
    | "other";

export type CategorizedCommit = GitHubCommit & {
    category: CommitCategory;
};

export function categorizeCommit(
    commit: GitHubCommit
): CategorizedCommit {
    const match = commit.message.match(
        /^(feat|fix|perf|refactor|docs|test|chore)(\(.+\))?:\s*(.+)$/i
    );

    if (!match) {
        return {
            ...commit,
            category: "other",
        };
    }

    const type = match[1].toLowerCase();

    let category: CommitCategory;

    switch (type) {
        case "feat":
            category = "feature";
            break;

        case "fix":
            category = "fix";
            break;

        case "perf":
        case "refactor":
            category = "improvement";
            break;

        case "docs":
            category = "docs";
            break;

        case "test":
            category = "test";
            break;

        default:
            category = "other";
            break;
    }

    return {
        ...commit,
        category,
    };
}

export function createAnnouncement(
    commits: CategorizedCommit[]
): string {
    const groups: Record<CommitCategory, string[]> = {
        feature: [],
        fix: [],
        improvement: [],
        docs: [],
        test: [],
        other: [],
    };

    for (const commit of commits) {
        const message = cleanCommitMessage(commit.message);

        groups[commit.category].push(`・${message}`);
    }

    const sections: string[] = [];

    if (groups.feature.length > 0) {
        sections.push(
            `【新機能】\n${groups.feature.join("\n")}`
        );
    }

    if (groups.fix.length > 0) {
        sections.push(
            `【修正】\n${groups.fix.join("\n")}`
        );
    }

    if (groups.improvement.length > 0) {
        sections.push(
            `【改善】\n${groups.improvement.join("\n")}`
        );
    }

    if (groups.docs.length > 0) {
        sections.push(
            `【ドキュメント】\n${groups.docs.join("\n")}`
        );
    }

    if (groups.test.length > 0) {
        sections.push(
            `【テスト】\n${groups.test.join("\n")}`
        );
    }

    if (groups.other.length > 0) {
        sections.push(
            `【その他】\n${groups.other.join("\n")}`
        );
    }

    return [
        "🚀 Production Deploy",
        "",
        ...sections,
    ].join("\n");
}

function cleanCommitMessage(message: string): string {
    const firstLine = message.split("\n")[0];

    return firstLine.replace(
        /^(feat|fix|perf|refactor|docs|test|chore)(\(.+\))?:\s*/i,
        ""
    );
}