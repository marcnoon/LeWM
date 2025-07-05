# Fix FileMode spec instantiation

The `GraphStateService` no longer requires a `ConnectionStateService` in its constructor. The FileMode unit test was still trying to instantiate `GraphStateService` with a `new ConnectionStateService()` parameter, causing mismatched constructor errors during testing.

This issue removes the unused `ConnectionStateService` import and updates the test to instantiate `GraphStateService` without parameters.

```diff
- const realGraphState = new GraphStateService(new ConnectionStateService());
+ const realGraphState = new GraphStateService();
```

Lint and build now succeed, but running tests with ChromeHeadless still fails because Chromium is not installed in the environment.
