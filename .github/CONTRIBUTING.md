# Contributing

Welcome, user!  
As you might know Google Contacts Events Notifier is an open source project: any
kind of help or contribution is therefore warmly welcomed.  
When I started working on this project I just wanted to solve a problem that I
was experiencing with Google Calendar, but it all went much further than I could
expect: people liked the idea and helped making it even better.  
If you now want to be part of this group and give your own contribution this
page contains useful information.

## Where to start

First of all make sure you have read the [Code of conduct][Code of conduct]: it
does not contain any extremely bizarre or revolutionary rules. Following common
sense and being nice to other users will create you no problem at all.

Now let the fun begin! There are many ways you can contribute to this project:

- are there [unsolved issues][Project issue page]? Look around: there might be
  some you can solve or help closing;
- have you thought of a feature which would improve this project but don't know
  how to code it? You can create an issue with a feature request detailing what
  you thought and your proposal will be evaluated by the developers;
- are you a developer yourself? You can fork the project and then create a Pull
  Request with your edited code. Just make sure you follow the [coding
  guidelines][Coding guidelines];
- do you speak a foreign language? You can [contribute][contribute with
  translation] by submitting a new translation in the form of a Pull Request or
  by creating an issue if you don't know how to create Pull Requests;
- if you wish to contribute by way of Pull Requests and have never used git
  before (or never used it as part of a typical Github workflow) the
  [git mini-tutorial][Git mini tutorial] might help you.

## Code of conduct

This project adheres to the [Contributor Covenant Code of Conduct][Code of
conduct]: it's a simple set of rules that greatly help collaborating, making the
project easier to maintain.

## Issues

[Issues][Project issue page] are a powerful tool provided by GitHub to report
problems, ask questions and more generally letting users interact with the
developers of a project: they, however, are only useful as long as they are used
correctly.  
This project has few rules regarding issues:

- help requests in the issues are accepted as long as you first read everything
  else and nothing you have tried works;
- when reporting an issue please follow the [template provided][Issue template
  file];
- unresponsive help request issues are closed following [this
  procedure][Unresponsive issues];

## Coding guidelines

Code consistency is what makes a project maintainable and accessible to
everyone. To maintain consistency please make sure that your code submitted via
Pull Requests complies with these rules:

- the code must be in english (variable names, comments, documentation...);
- the code in `.gs` files must be formatted following the [Javascript
  Semistandard Style][Javascript semistandard];
- the text in `.md` files must be formatted using to [this Markdown
  Linter][Markdown linter] (available as a plugin for many editors);
  - deviations from default rules can be found in the [.markdownlint.json
    file][Markdown linter config]
  - additionally, links should be in the reference format, not in the in-text format

## Git mini-tutorial

Before starting the tutorial, it is important to clarify definitions of the
following for beginners:

- git commandline tool
  - for running "git commands" with
- Git SCM (source code management) format
  - Git repositories are directories of this format
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
1. In your browser, logged into Github, in the top-right corner of
   [this repo][Project main page], click the `Fork` icon which will create your
   own fork.
1. In the shell do the following. Setting the variables at the beginning is just
   to make this tutorial more readable, you can obviously enter the text
   directly each time instead of using variables if you prefer:
    ```sh
    common_dir=## Replace this with a common directory to hold your repositories
    user=## Replace this with your github username
    lang=## Replace this with your translation language

    mkdir -p "${common_dir}"
    cd "${common_dir}"
    ```
1. In the shell clone your fork to a local directory. For the simpler https
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
1. In the shell do the following to create the new branch with your changes. You
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
1. In your browser, logged into Github, visit your forked repo at
   `https://github.com/${user}/GoogleContactsEventsNotifier`, and there will be
   a notification about a recently added branch, asking if you wish to open it
   as a Pull Request. Do that, remembering that if the Pull Request is based on
   an upstream branch other than the default `master`, then you should select
   that while opening it.

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

[Project main page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier
[Project documentation]: https://giobonvi.github.io/GoogleContactsEventsNotifier
[Project issue page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/issues
[Project contributors page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/graphs/contributors
[Contribute with translation]: ../README.md#bonus-translation
[Git mini tutorial]: #git-mini-tutorial
[Git]: https://git-scm.com
[Git windows bundle]: https://git-for-windows.github.io
[Add ssh key]: https://help.github.com/articles/connecting-to-github-with-ssh
[Unresponsive issues]: ../README.md#unresponsive-help-requests
[Code of conduct]: CODE_OF_CONDUCT.md
[Coding guidelines]: #coding-guidelines
[Issue template file]: ISSUE_TEMPLATE.md
[Javascript semistandard]: https://github.com/Flet/semistandard
[Markdown linter]: https://github.com/DavidAnson/markdownlint
[Markdown linter config]: ../.markdownlint.json