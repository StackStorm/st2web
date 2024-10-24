Changelog
========================================================================

in development
--------------

Changed
~~~~~~~
* Updated various dependencies (security). #1009, #1020

  Contributed by @enykeev

* Updated NodeJS to v20 current (security). #1010

  Contributed by @enykeev

* Add support for EL9. Removed support for bionic and el7. #1027
  Contributed by @amanda11

Fixed
~~~~~
* Fixed CircleCI tests by pinning lerna@6.0.0. #1008

  Contributed by @guzzijones


st2 v3.8.0
------

Added
~~~~~
* Added feature for disabling button for synchronous responses. Button gets disabled onClick on `Connect` and `Submit` in st2-login and st2-history module respectively.

  Contributed by @ParthS007

* Added new Hotkey Shortcuts for Workflow Designer: Save (ctrl/cmd + s), Open (ctrl/cmd + o),
  Undo/Redo (ctrl/cmd + z, shift + z), Copy/Cut/Paste (ctrl/cmd + c/x/v). #963, #991

  Contributed by @Jappzy and @cded from @Bitovi

* Added the search rule criteria in the UI with the possibility of multiple patterns. #992, #964, #492

  Contributed by @Jappzy and @cded from @Bitovi

* Added an optional auto-save capability in the workflow composer. #965, #993

  Contributed by @Jappzy and @cded from @Bitovi

Changed
~~~~~~~
* Updated nodejs from `14.16.1` to `14.20.1`, fixing the local build under ARM processor architecture. #880
    
  Reported by @cded from @Bitovi

Fixed
~~~~~
* Fixed CircleCI tests

  Contributed by @amanda11

* Handle cases where content-type is not only application/json

  Contributed by @luislobo

* Escaped text in notifications. #990

  Contributed by @cded from @Bitovi
