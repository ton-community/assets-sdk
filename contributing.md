# Contributing

This agreement is for collaboration, it may not be detailed enough, if it is not clear how to do what you want, this is a normal situation, just ask your colleagues

## Main flow

### Step 1 — get code

```shell
git clone git@github.com:ton-community/assets-sdk.git
cd assets-sdk
git checkout -b name-of-feature origin/main
```

### Step 2 — write code

Coding and testing local

> Git history: work log vs recipe https://www.bitsnbites.eu/git-history-work-log-vs-recipe/

Use [Conventional Commits](https://www.conventionalcommits.org/)

```shell
git commit --message "feat: paypal payment for different users"
```

or

```shell
git commit --message "fix: hide password display when searching for a user"
```

### Step 3 — make fork

Follow by link for make fork:
https://github.com/ton-community/assets-sdk/fork

Setup your remote

```bash
git remote add self url_your_fork
```

### Step 4 — make pull requests

Push and create pull requests

```shell
git push --set-upstream self name-of-feature
```

Follow by link:

```shell
https://github.com/ton-community/assets-sdk/pull/new/name-of-feature
```

### Step 5 — update branch from main

This step may be necessary in case your colleagues suggest additional changes after reviewing the code.

> [!NOTE]
> A tidy, linear Git history  https://www.bitsnbites.eu/a-tidy-linear-git-history/

Get the latest upstream changes and update the working branch:

```shell
git fetch --prune origin
git rebase --autostash --ignore-date origin/main
```
> [!WARNING]
> Please note that you get the current state of the main branch from the **origin** remote for doing push to **self**

During the rebase, there may be conflicts, they need to be resolved and after the decision to continue the rebase:

```shell
git rebase --continue
```

Upload the updated working branch to the repository, given that we changed the history, this should be done with the force option:

```shell
git push --force --set-upstream self name-of-feature
```

More details can be found in the tutorial: [git rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)
