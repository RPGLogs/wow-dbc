Extract data from the DBC files for World of Warcraft. This is built on the CSV exports of said files from [wago.tools](https://wago.tools/).

## Usage

The main entrypoint for consumers of this library is the `loadAll` method, which will load data for all spells. The list of spells can be supplied manually, or it can also be generated from the DBC using a helper like `retailSpellList`.

This library is **not** intended for usage in the browser.

## Loading Additional Information

Library consumers can load additional information by implementing *hydraters* to collect the additional info from the DBC. A hydrater is an object that defines
how to retrieve data from the dbc to populate some output fields. Hydraters can be composed to produce complete spell objects.

The hydrater for `name` is a good, simple reference to get a handle on the basics. `passive` and `gcd` provide progressively more complex example hydraters.

## TODOs

- Don't tie this to spells by name. Technically any `{ id: number; }`-like object should work if you pass it to different hydraters.
- A better way of defining `SpellMisc` masks / flags.
