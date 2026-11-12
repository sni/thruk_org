---
title: Naglint
---

# Format monitoring configuration with naglint

Thruk includes `naglint` for Nagios, Icinga, Shinken and Naemon configuration files.
The tool can:

- Clean whitespace and indentation.
- Remove deprecated attributes.
- Detect duplicate or invalid attributes.
- Split long command lines.
- Sort attributes in a natural order.

The standalone script is usually `/usr/bin/naglint`. Packages have included it since version 1.56.
It can also process directories recursively with `-r`.

## Run locally

This static website does not accept configuration uploads.
Run the tool locally to keep passwords and other private configuration on your own machine.

To see the available options, run:

```sh
naglint --help
```

Choose a new output filename. Shell redirection replaces an existing file.
To write a formatted copy, run:

```sh
naglint objects.cfg > beauty.cfg
```

Review the output before using it in your monitoring core.

::: warning In-place changes
The `-i` option overwrites the input file. Back up the file before using it.
:::

```sh
naglint -i objects.cfg
```

See the [source and command help](https://github.com/sni/Thruk/blob/master/script/naglint) for more details.
