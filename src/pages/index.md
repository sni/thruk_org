---
layout: home
hero:
  name: Thruk
  text: Monitoring web interface
  tagline: One interface for Naemon, Icinga, Shinken and Nagios
  image:
    src: /images/thruk.svg
    alt: Thruk
  actions:
    - theme: brand
      text: Download v{{VITE_RELEASE_VERSION}}
      link: /download.html
    - theme: alt
      text: Documentation
      link: /documentation/index.html
features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>'
    title: Download v{{VITE_RELEASE_VERSION}}
    details: Packages are available for Debian, Ubuntu, RHEL, Rocky, Alma and SUSE. Released {{VITE_RELEASE_DATE}}.
    link: /download.html
    linkText: Download
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/></svg>'
    title: Free and open source
    details: Thruk is free of charge and fully open source. There is no open core or community version. Support is available.
    link: /open.html
    linkText: Learn more
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></svg>'
    title: Easy to use
    details: Extend Thruk with plugins and themes. Its interface is familiar to Nagios users.
    link: /easy.html
    linkText: Learn more
---

## Release plan

<div class="release-plan">

| [Stable](/download.html) | [Nightly](/download.html#nightly-development-builds) | [Next](https://github.com/sni/Thruk/blob/master/Changes) |
| --- | --- | --- |
| {{VITE_RELEASE_DATE}} | Every day | {{VITE_NEXT_RELEASE_DATE}} |

</div>

## Introduction

Thruk is a monitoring web interface for multiple backends.
It supports Naemon, Nagios, Icinga and Shinken through the Livestatus API.
It is designed as a drop-in replacement for the classic interface and covers almost 100% of its features.
It adds features for large installations and usability improvements.

[Learn more](/documentation/introduction.html)

## Screenshots

<div class="screenshot-cards">
<figure><a href="/images/galleries/01_main.png"><img src="/images/galleries/01_main.png" alt="Main page" loading="lazy"></a><figcaption>Main page</figcaption></figure>
<figure><a href="/images/galleries/09_theme_1.png"><img src="/images/galleries/09_theme_1.png" alt="Dark theme" loading="lazy"></a><figcaption>Dark theme</figcaption></figure>
<figure><a href="/images/galleries/18_business_process.png"><img src="/images/galleries/18_business_process.png" alt="Business Process plugin" loading="lazy"></a><figcaption>Business Process</figcaption></figure>
<figure><a href="/images/galleries/dashboard.png"><img src="/images/galleries/dashboard.png" alt="Panorama dashboard" loading="lazy"></a><figcaption>Panorama dashboard</figcaption></figure>
<figure><a href="/images/galleries/mine-map1.png"><img src="/images/galleries/mine-map1.png" alt="Mine map" loading="lazy"></a><figcaption>Mine map</figcaption></figure>
<figure><a href="/images/galleries/reports3.png"><img src="/images/galleries/reports3.png" alt="SLA report PDF" loading="lazy"></a><figcaption>SLA reports</figcaption></figure>
</div>

[More screenshots](/screenshots.html)
