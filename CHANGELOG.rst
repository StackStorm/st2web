Changelog
========================================================================

in development
--------------


Added
~~~~~
* Added feature for disabling button for synchronous responses. Button gets disabled onClick on `Connect` and `Submit` in st2-login and st2-history module respectively.

  Contributed by @ParthS007

* Added new Hotkey Shortcuts for Workflow Designer: Save (ctrl/cmd + s), Open (ctrl/cmd + o),
  Undo/Redo (ctrl/cmd + z, shift + z), Copy/Cut/Paste (ctrl/cmd + c/x/v). #963, #991

  Contributed by @Jappzy and @cded from @Bitovi

* Added the search rule criteria in the UI with the possibility of multiple patterns. #992, #964, #492

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


v2.4.3
------
