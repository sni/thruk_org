import DefaultTheme from 'vitepress/theme'
import ReleaseStatus from './ReleaseStatus.vue'
import RestEndpointsFilter from './RestEndpointsFilter.vue'
import { h } from 'vue'
import Breadcrumbs from './Breadcrumbs.vue'
import ImagePreview from './ImagePreview.vue'
import NavDropdown from './NavDropdown.vue'
import './thruk.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-before': () => h(Breadcrumbs),
    'layout-bottom': () => h(ImagePreview)
  }),
  enhanceApp({ app }) {
    app.component('ReleaseStatus', ReleaseStatus)
    app.component('RestFilter', RestEndpointsFilter)
    app.component('NavDropdown', NavDropdown)
  },
}
