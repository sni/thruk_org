---
title: Download
pageClass: downloads-page
---

# Download

<div class="download-summary">

**Thruk v{{VITE_RELEASE_VERSION}}**

Released on {{VITE_RELEASE_DATE}}.

<ReleaseStatus latest="{{VITE_RELEASE_VERSION}}" />

Thruk is free of charge. Donations support development, hosting and maintenance.
To help fund this work, [support the project](/donate.html).

<div class="download-actions">

[View packages](#packages) · [Nightly builds](#nightly-development-builds) · [Release highlights](/whatsnew/index.html)

</div>
</div>

## Release plan

There is usually one stable release every 2-3 months, with optional service pack releases in between. Every day there are nightly development builds with the latest changes.

<div class="release-plan">

| [Stable](/download.html) | [Nightly](/download.html#nightly-development-builds) | [Next](https://github.com/sni/Thruk/blob/master/Changes) |
| --- | --- | --- |
| {{VITE_RELEASE_DATE}} | Every day | {{VITE_NEXT_RELEASE_DATE}} |

</div>

Read [what's new](/whatsnew/index.html) in this release.

## Repository

Using a repository is probably the easiest way to install or update Thruk.
Two repositories build packages from the same source.
New Linux distributions are sometimes available in only one repository.
The OpenSuse repository also contains Naemon and Mod-Gearman packages, which can be useful with Thruk.

<div class="repository-links">

- [OpenSuse Build Service](https://build.opensuse.org/project/show/home:naemon) (Debian, Ubuntu, RHEL, Fedora) ([howto use this repository](https://www.naemon.io/download/#fix_gpg_download_link))
- [Consol\* Labs Repository](https://labs.consol.de/repo/) (Debian, Ubuntu, RHEL)

</div>

## Packages

Naemon, Shinken and Icinga2 include the livestatus api. When you use Nagios, you must compile the livestatus module manually.

<div class="download-packages">

| System | Version | Package |
| --- | --- | --- |
| Debian | 12 bookworm | [Debian 12 packages (amd64)](https://download.opensuse.org/repositories/home:/naemon/Debian_12/amd64/) |
| Debian | 13 trixie | [thruk_{{VITE_RELEASE_VERSION}}_debian13_amd64.deb](https://download.thruk.org/pkg/v{{VITE_RELEASE_VERSION}}/debian13/amd64/) |
| RHEL | 8 | [thruk-{{VITE_RELEASE_VERSION}}.rhel8.x86_64.rpm](https://download.thruk.org/pkg/v{{VITE_RELEASE_VERSION}}/rhel8/x86_64/) |
| RHEL | 9 | [thruk-{{VITE_RELEASE_VERSION}}.rhel9.x86_64.rpm](https://download.thruk.org/pkg/v{{VITE_RELEASE_VERSION}}/rhel9/x86_64/) |
| Ubuntu | 22.04 Jammy Jellyfish | [thruk_{{VITE_RELEASE_VERSION}}_ubuntu22.04_amd64.deb](https://download.opensuse.org/repositories/home:/naemon/xUbuntu_22.04/amd64/) |
| Ubuntu | 24.04 Noble Numbat | [thruk_{{VITE_RELEASE_VERSION}}_ubuntu24.04_amd64.deb](https://download.opensuse.org/repositories/home:/naemon/xUbuntu_24.04/amd64/) |
| Source | | [thruk-{{VITE_RELEASE_VERSION}}.tar.gz](https://download.thruk.org/pkg/v{{VITE_RELEASE_VERSION}}/src/) |

</div>

## Naemon

[Naemon](https://www.naemon.io) is a fork of Nagios 4 with Thruk as its default GUI.
Its ready-to-use packages include Thruk and Livestatus.
If you upgrade your core, consider Naemon.

## OMD

OMD ([Open Monitoring Distribution](https://labs.consol.de/omd)) includes Thruk in a preconfigured monitoring setup.
It includes Naemon/Icinga, Thruk, PNP4Nagios and other addons such as Grafana.

## Nightly development builds

Look at the test results before you use a test release. Use them for tests only, not in production.

GitHub-CI: [citest](https://github.com/sni/Thruk/actions?query=workflow:citest)

- [OpenSuse daily builds repository](https://build.opensuse.org/project/show/home:naemon:daily)
- [ConSol\* Labs daily repository](https://labs.consol.de/repo/testing/)
- [Download nightly snapshots](https://download.thruk.org/nightly_builds/)

## Latest development version

[Download latest git version archive from github.com](https://github.com/sni/Thruk/archive/master.tar.gz)

## Archive

Download previous versions (v1.18 till latest) from the [pkg archive](https://download.thruk.org/pkg/). Even older versions (till 1.1.7) are available from the [old archive](https://download.thruk.org/archive/).
