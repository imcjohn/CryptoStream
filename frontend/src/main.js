import Vue from 'vue'
import App from './App.vue'
import './quasar'
Vue.config.productionTip = false
import VueApexCharts from 'vue-apexcharts'
Vue.use(VueApexCharts);

Vue.component('apexchart', VueApexCharts)
new Vue({
  render: h => h(App),
}).$mount('#app')
