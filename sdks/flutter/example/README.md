# theme_studio example

This demo app switches between the two demo clients, **Acme** (`pk_demo_acme`) and **Globex** (`pk_demo_globex`), at runtime.

```sh
flutter run -d chrome                                            # API at http://localhost:8787
flutter run -d chrome --dart-define=DTS_ENDPOINT=http://10.0.2.2:8787
```

App bar actions, from left to right:

1. Switch client.
2. Toggle the offline demo, which serves the bundled fixtures with no server.
3. Switch between light and dark.
4. Refresh the theme.

Screens:

* **Dashboard:** cards and the theme status.
* **Orders:** a list that opens a detail page with the theme's page transition.
* **Form:** filled and outlined inputs with validation.
* **Components:** buttons, chips, badges, a dialog, semantic colors and elevation.

Resize the window to see the navigation pattern change with each breakpoint.
