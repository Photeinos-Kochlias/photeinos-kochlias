const githubToken = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;

export type GitHubCommit = {
    sha: string;
    message: string;
};

type GitHubApiCommit = {
    sha: string;
    commit: {
        message: string;
    };
};

async function githubFetch<T>(
    url: string
): Promise<T> {
    if (!githubToken) {
        throw new Error("GITHUB_TOKEN is not set");
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${githubToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `GitHub API failed: ${response.status} ${errorText}`
        );
    }

    return response.json();
}

export async function getCommit(
    sha: string
): Promise<GitHubCommit> {
    if (!repository) {
        throw new Error("GITHUB_REPOSITORY is not set");
    }

    const commit =
        await githubFetch<GitHubApiCommit>(
            `https://api.github.com/repos/${repository}/commits/${sha}`
        );

    return {
        sha: commit.sha,
        message: commit.commit.message,
    };
}

export async function getCommitsBetween(
    baseSha: string,
    headSha: string
): Promise<GitHubCommit[]> {
    if (!repository) {
        throw new Error("GITHUB_REPOSITORY is not set");
    }

    const result = await githubFetch<{
        commits: GitHubApiCommit[];
    }>(
        `https://api.github.com/repos/${repository}/compare/${baseSha}...${headSha}`
    );

    return result.commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
    }));
}