# Contributing

Welcome, user!  
As you might know Google Contacts Events Notifier is an open source project: any
kind of help or contribution is therefore warmly welcomed.  
When I started working on this project I just wanted to solve a problem that I
was experiencing with Google Calendar, but it all went much further than I could
expect: people liked the idea and helped making it even better.  
If you now want to be part of this group and give your own contribution this
page contains useful information.

<!-- TOC -->

- [Contributing](#contributing)
  - [Where to start](#where-to-start)
  - [Code of conduct](#code-of-conduct)
  - [Issues](#issues)
  - [Coding guidelines](#coding-guidelines)
  - [Testing](#testing)
  - [PR management](#pr-management)
  - [Git guide](#git-guide)

<!-- /TOC -->

## Where to start

First of all make sure you have read the [Code of conduct][Code of conduct]: it
does not contain any extremely bizarre or revolutionary rules. Following common
sense and being nice to other users will create no problem for you at all.

Now let the fun begin! There are many ways you can contribute to this project:

- Are there [unsolved issues][Unsolved issues page]? Look around: there might be
  some you can solve or help closing;
- Have you thought of a feature which would improve this project but don't know
  how (or don't have time) to code it? You can create an issue with a feature
  request detailing what you thought and your proposal will be evaluated by the
  developers;
- Are you a developer yourself? You can fork the project and then create a Pull
  Request with your edited code. Just make sure you follow the [coding
  guidelines][Coding guidelines];
- Do you speak a language other than English? You can [contribute][Contribute
  with translation] by submitting a new translation in the form of a Pull
  Request or by creating an issue if you don't know how to create Pull
  Requests;
- If you wish to contribute by way of Pull Requests and have never used git
  before (or never used it as part of a typical Github workflow) the
  [git guide][Git guide] might help you.

## Code of conduct

This project adheres to the [Contributor Covenant Code of Conduct][Code of
conduct]: it's a simple set of rules that greatly help collaborating, making the
project easier to maintain.

## Issues

[Issues][Project issue page] are a powerful tool provided by GitHub to report
problems, ask questions and more generally letting users interact with the
developers of a project: they, however, are only useful as long as they are used
correctly.  
This project has a few rules regarding issues:

- Help requests in the issues are accepted as long as you first read the [setup
  and installation guide][Setup and installation guide] and nothing you have
  tried works;
- When reporting an issue please follow the [template provided][Issue template
  file];
- Unresponsive help request issues are closed following [this
  procedure][Unresponsive issues];

## Coding guidelines

Code consistency is what makes a project maintainable and accessible to
everyone. To maintain consistency please make sure that your code submitted via
Pull Requests complies with these rules:

- PRs should be based against the `development` branch (or another feature
  branch if appropriate), but not against the `master` branch;
- If contributing translation strings you just need to ensure they are correctly
  formatted (see the first point below under [Testing](#testing)), and you can
  ignore all the other guidelines/testing instructions;
- The code must be in English (variable names, comments, documentation...);
- The code in `.gs` files must be formatted following the [Javascript
  Semistandard Style][Javascript semistandard];
- The text in `.md` files must be formatted following the [Markdown CommonMark
  specification][Commonmark specification];
  - Deviations from default rules can be found in the [.markdownlint.json
    file][Markdown linter config]
  - Additionally, links should be in the reference format, not in the in-text
    format
- Each function and class must have associated [JSDoc][JSDoc] comments, with the
  fields and description in Markdown format;
  - Deviations from default rules can be found in the [.jsdoc-conf.json
    file][JSDoc config]

## Testing

Before submitting a PR:

- If you've updated translation strings, please check that you have used the same
  format as the other entries, for example:

  ```javascript
  'You can find the latest one here': 'Puoi trovare l\'ultima qui',
  ```

  - Both the "from" and "to" parts of each entry are surrounded by single-quotes
    (`'aa'`)
  - Any single-quotes within the "from" or "to" are escaped with a backslash
    (`'a\'a'`)
  - There is a colon and space between the "from" and "to" (`'aa': 'bb'`)
  - Each entry has a trailing comma (`... : 'bb',`)
- If you've made updates to the javascript code in any `.gs` files:
  - To lint for syntax errors [this semistandard linter][Javascript semistandard]
    is one of the options available as a plugin for many editors and can also be
    run as a commandline tool using (for example, on a Unix-like system):
    ```sh
    npm install -g "semistandard" "snazzy" # if not yet installed
    semistandard --verbose `find . -name "*.gs"` | snazzy
    # "snazzy" is an optional pretty-printer
    ```
  - To check for semantic errors:
    - Please verify that your code passes all the tests. To do
      that either create a new script-file for `tests.gs` within the same
      project in the Google script-editor, or append the content of
      `tests.gs` to that of the `code.gs` script-file, then `run->unitTests()`.
    - It is good to also `run->test()` from `code.gs` with `settings.debug.testDate`
      set to a date with some contact-anniversaries on it (or create some fake ones
      on that date) to provide real-world testing too.
    - For exhaustive real-world testing there is also `testSelectedPeriod()`. Beware
      that this test *might* hit an execution timeout limit.
    - If there are any other new global functions in the [tests file][Tests file]
      you can run them too.
- If you've made updates to any Markdown files:
  - To lint for syntax errors [this Markdown linter][Markdown linter] is one of the
    options available as a plugin for many editors and can also be run from a
    commandline tool using (for example, on a Unix-like system):
    ```sh
    npm install -g "markdownlint-cli" # if not yet installed
    find . -name "*.md" -exec markdownlint --config ".markdownlint.json" {} \;
    ```
  - To preview the output to check for semantic errors:
    - The simplest way before opening a PR is - after pushing the changes to the
      feature-branch on your Github fork - to browse to that file at that branch
      on Github to see if it auto-renders correctly.
    - If you've already opened a PR and want to preview additional changes
      *before* pushing them to the branch (where the changes would otherwise appear
      on the PR before you can fix mistakes) you can process and preview them
      locally using (for example, on a Debian-based Unix-like system, avoiding
      generation of intermediate files):
      ```sh
      apt-get install "python-markdown" "lynx" # if not yet installed
      for x in `find . -name "*.md"`; do markdown_py "${x}" | lynx -stdin; done
      ```
      or to just generate temporary `.html` files next to the `.md` ones:
      ```sh
      for x in `find . -name "*.md"`; do markdown_py "${x}" >"${x%.md}.html"; done
      ```
- If you've made updates to any JSDoc comments:
  - To lint for syntax errors, many editors have JSDoc plugins for
    auto-previewing the output, or you can manually run [this jsdoc
    processor][JSDoc processor] from the commandline (for example, on a Unix-like
    system):
    ```sh
    npm install -g "jsdoc" # if not yet installed
    jsdoc . --pedantic --verbose --recurse --configure ".jsdoc-conf.json" && \
      echo "* Successful" || echo "* Failed"
    ```
  - To preview the output to check for semantic errors you can just navigate around
    in the `jsdoc` output with a browser (for example, on a Debian-based Unix-like
    system):
    ```sh
    apt-get install "lynx" # if not yet installed
    lynx "jsdoc-out/index.html"
    ```
  - The `jsdoc-out/` directory is included in `.gitignore` and as default directory
    in `.jsdoc-conf.json` so unless you used
    `jsdoc --destination "other-directory"` it will output to `jsdoc-out/`, and
    will not interfere with `git status`.
- For advanced git/shell users the added benefit of the commandline tools is that
  you can edit `.git/hooks/pre-commit` to automate the above (possibly even the
  script's own tests, via Google REST API calls) before committing, and a failed
  test or a `Ctrl-C` can exit with non-zero, which aborts the commit. Gurus could
  even add a `.git/hook/post-commit` to automate pushing the new version to
  Google Apps by REST API (after updating any customized var-settings with a tool
  like `sed`).

## PR management

This is the optimal workflow that should be followed when managing a new PR:

1. The submitter (a collaborator or an external user) submits the PR;
2. A collaborator of the project assigns some other collaborators (or his/herself)
  to the PR;
3. The assigned user adds the correct tags/milestones to the PR;
4. The assigned user performs a general evaluation of the PR: if he finds any big
  problem (exceptionally bad code, the feature added by the PR is not wanted in the
  project or something along these lines) he can simply refuse the PR by closing
  it (stating the problem clearly in a comment and discussing it with the submitter);
5. If no big problem is found the assigned user starts a review of the code by adding
  one or more reviewers (other collaborators or him/herself) to the PR;
6. The reviewers should check the code for errors, problems, possible optimizations,
  incompatibilities with the current code base or with planned future developments,
  wrong code style and typos/spelling errors and running the tests, then leave a
  review accepting it if everything is OK or requesting changes otherwise;
7. If the submitter is asked by the reviewer(s) to implement some changes in the
  code he should do it before the process can continue any further.  
  As a general rule reviewers should refrain from pushing commits to the PR branch
  without asking explicit consent from the submitter beforehand.  
  Note: it's perfectly OK for both the reviewers and the submitter to use `git rebase`
  while working on PRs since nobody should fork a branch from an unmerged PR;
8. If any changes have been pushed to the PR in step 7 step 6 must be repeated;
9. Once all the reviewers have accepted the PR they can ask the submitter to rebase,
  squash or tidy up the PR branch before merging (For example, this should be done
  if the review/correction cycle was repeated multiple times generating lots of
  unwanted commits that can be squashed);
10. Once the PR is finally ready to be merged the assigned user should merge it
  following these rules of thumb:
    - If the PR consists of just one or two commits it could be merged via a fast-
      forward merge (`merge --ff`, must be performed manually since GitHub does not
      offer this functionality in the web interface to perform it):
    - If the PR consists of just one or two commits, but cannot be merged via a
      fast-forward merge, a "rebase merge" can be used (this can be performed
      both manually and via the GitHub interface);
    - If the PR consists of more than two commits a non-fast-forward merge should
      be considered (`merge --no-ff`, it can be performed both manually and via
      the GitHub interface);
    - In any case these rules must not be taken at absolute value: exceptions may
      arise which could require these rules to be broken or bent. If you have any
      doubts regarding the best route to take just ask and some collaborator will
      help you;
11. If any issues remain open which would be auto-closed by the PR when its
    target-branch finally gets merged to the default-branch (`master`), and it
    will be a noticeable length of time before that will happen, then either the
    `solved` or `wontfix` label should be added to those issues to make it clear
    at a glance that nothing else needs doing for them in order for them to
    auto-close.

## Git guide

If you want to contribute to this project extensively you must learn to use git:
it's not extremely difficult and amazingly useful, moreover @rowanthorpe, one of
the contributors of this project has written an amazing introductory guide to git,
which you can find [here][Git guide].

[Code of conduct]: CODE_OF_CONDUCT.md
[Project issue page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/issues
[Unsolved issues page]: https://github.com/GioBonvi/GoogleContactsEventsNotifier/issues?q=is%3Aissue%20is%3Aopen%20-label%3Asolved%20-label%3Awontfix%20-label%3Aunresponsive%20no%3Aassignee
[Coding guidelines]: #coding-guidelines
[Contribute with translation]: ../docs/translation-guide.md
[Issue template file]: ISSUE_TEMPLATE.md
[Unresponsive issues]: https://giobonvi.github.io/GoogleContactsEventsNotifier/#unresponsive-help-requests
[Javascript semistandard]: https://github.com/Flet/semistandard
[Commonmark specification]: http://commonmark.org
[Markdown linter config]: ../.markdownlint.json
[JSDoc]: http://usejsdoc.org
[JSDoc config]: ../.jsdoc-conf.json
[Tests file]: ../tests.gs
[Markdown linter]: https://github.com/DavidAnson/markdownlint
[JSDoc processor]: https://github.com/jsdoc3/jsdoc
[Git guide]: ../docs/git-guide.md
[Setup and installation guide]: ../docs/install-and-setup.md
