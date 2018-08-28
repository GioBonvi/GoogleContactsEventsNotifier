# Git mini-tutorial

Before starting the tutorial, it is important to clarify definitions of the
following for beginners:

- git commandline tool
  - for running "git commands"
- Git SCM (source code management) format
  - git repositories are directories of this format
- Github
  - projects are hosted at this publicly accessible collaboration platform which
    is built around Git repositories

This is a "just the steps" mini-tutorial. It is aimed at first-time users of
Git, or relatively new users wanting to know the steps this project uses in the
context of Github. If any step is confusing it should be easy to find details &
explanations by searching Github documentation, or googling the command and
especially looking at stackoverflow answers that come up for it. The
instructions below are for the example-case of a first-time contributor adding a
language to the translation-table.

Text with preceding `##` is either for you to replace, for example:

```sh
a_variable=## Replace this with your favourite food
```

becomes:

```sh
a_variable=banana
```

or instructions to follow, for example:

```sh
echo "silly command"
## Repeat the above 3 times
```

becomes:

```sh
echo "silly command"
echo "silly command"
echo "silly command"
```

1. Ensure you have the [git][Git] commandline tool installed and usable in a
   shell. If on Windows and you haven't already installed a "POSIX compatible"
   shell ("command line"), the simplest thing is to install
   [the bundled git package][Git windows bundle] which includes its own shell.
2. In your browser, logged into Github, in the top-right corner of
   [this repo][Project main page], click the `Fork` icon which will create your
   own fork.
3. In the shell do the following. Setting the variables at the beginning is just
   to make this tutorial more readable, you can obviously enter the text
   directly each time instead of using variables if you prefer:
    ```sh
    common_dir=## Replace this with a common directory to hold your repositories
    user=## Replace this with your github username
    lang=## Replace this with your translation language

    mkdir -p "${common_dir}"
    cd "${common_dir}"
    ```
4. In the shell clone your fork to a local directory. For the simpler https
   method (but which requires you to enter your password whenever you do remote
   actions), do:
    ```sh
    git clone https://github.com/${user}/GoogleContactsEventsNotifier.git
    ```
    If you **optionally** want to be more advanced and use ssh instead of https
    then do the documented steps for
    [adding your ssh public-key to your github account][Add ssh key] if you
    haven't already, and then do:
    ```sh
    git clone git@github.com:${user}/GoogleContactsEventsNotifier.git
    ```
5. In the shell do the following to create the new branch with your changes. You
   will need to know which existing upstream branch it should be based on.
   Although basing it on the upstream `master` branch is usually what you want,
   sometimes you may need to base it on an "upstream feature/fix branch" which
   the maintainers will later merge to their `master` branch (if in doubt ask
   the maintainers):
    ```sh
    upstream_branch=## Replace this with the upstream branch

    cd GoogleContactsEventsNotifier
    git checkout -b ${lang}-translations ${upstream_branch}
    ## Edit code.gs in text editor, find the commented text at the bottom of the
    ## translation-table, create the translations as per the instructions there,
    ## then save & exit.
    git add code.gs
    git commit -m "${lang} translations"
    git push origin ${lang}-translations
    ```
6. In your browser, logged into Github, visit your forked repo at
   `https://github.com/${user}/GoogleContactsEventsNotifier`, and there will be
   a notification about a recently added branch, asking if you wish to open it
   as a Pull Request. Do that, remembering that if the Pull Request is based on
   an upstream branch other than the default `master`, then you should select
   that while opening it.

----

Below are other steps you **might** need to take sometimes. Don't worry though,
if any of them are too intimidating the upstream maintainers can usually make
the changes to your branch for you on request - when they have time! - and you
will still retain "authorship" of your commits:

- If upstream's copy of `${upstream_branch}` has been modified or had new
  commits added since you created your commits the maintainers may ask you to
  rebase your branch on it to update your PR (so they can merge it cleanly).
  This means if you haven't already added the upstream repo as a "remote" you'd
  first need to do:
    ```sh
    git remote add upstream https://github.com/GioBonvi/GoogleContactsEventsNotifier.git
    ```
    then either way you'd need to do:
    ```sh
    git checkout ${upstream_branch}
    git pull upstream ${upstream_branch}
    git checkout ${lang}-translations
    git rebase ${upstream_branch}
    git push --force origin ${lang}-translations
    ```
- If the upstream maintainers ask you to fix a commit (e.g. for a typo), if your
  PR has only one commit you can do the following:
    ```sh
    git checkout ${lang}-translations
    ## Edit code.gs in text editor, save & exit.
    git add code.gs
    git commit --amend
    git push --force origin ${lang}-translations
    ```
    If your PR includes more than one commit (usually never, if just
    translations for a basic lookup table) then instead of the above you need to
    do:
    ```sh
    git checkout ${lang}-translations
    git fetch upstream ${upstream_branch}
    git rebase -i ${upstream_branch}
    ## For any commit that needs editing change the beginning of the line from
    ## "pick" to "edit", then save & exit.
    ## -- loop starts here --
    ## Edit code.gs in text editor, save & exit
    git add code.gs
    git commit --amend
    git rebase --continue
    ## -- loop ends here --
    ## Do the above loop until the rebase finishes.
    git push --force origin ${lang}-translations
    ```
- If the upstream maintainers ask you to squash several commits into one, then
  do:
    ```sh
    git checkout ${lang}-translations
    git fetch upstream ${upstream_branch}
    git rebase -i ${upstream_branch}
    ## For any commit which should be included into its previous commit, change
    ## the beginning of the line from "pick" to "squash" - or to "fixup" if you
    ## just want to use the first commit-message in the log - then save & exit.
    ## If you used "squash" you'll be asked to edit the combined commit-message.
    git push --force origin ${lang}-translations
    ```

In the above steps:

- The `git push --force` is because you are rewriting history which is usually a
  big no-no for a "real public-facing branch", but this is just a temporary
  PR-branch, so no-one should be relying on its history anyway.
- In the unlikely event that you ever have a "merge conflict" during
  `git rebase` (either because you've made conflicting changes to your own
  earlier commits during `git rebase -i` or if you encounter conflicting changes
  during `git rebase` against an upstream branch), then you need to edit
  `code.gs` again to cleanup wherever there are lines that look like:
    ```text
    <<<<<<< XXXXX:branch-name
    # First conflicting updated line(s)...
    =======
    # Second conflicting updated line(s)...
    >>>>>>> YYYYY:branch-name
    ```
    to replace them with a single correct version (whether replacing with one of
    them or a manually edited combination of both) removing the `<<<<<<<`,
    `>>>>>>>`, and `=======` lines too, and then do:
    ```sh
    git add code.gs
    git rebase --continue
    ```
    This is quite complicated though, so if you ever need to do it you can ask
    for help or google for instructions first.

There are **many** more aspects to git for the adventurous, but they are out of
scope for this intro.

[Git]: https://git-scm.com
[Git windows bundle]: https://git-for-windows.github.io
[Project main page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier
[Add ssh key]: https://help.github.com/articles/connecting-to-github-with-ssh