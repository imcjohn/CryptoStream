<template>
  <div id="q-app">
    <div class="q-pa-md">
      <q-layout view="hHh Lpr lff">
        <q-header elevated class="bg-blue-grey-9">
          <q-toolbar>
            <q-btn flat @click="leftDrawerOpen = !leftDrawerOpen" round dense icon="menu" ></q-btn>
            <q-toolbar-title>CryptoStream</q-toolbar-title>
            <q-tabs v-model="tab" shrink>
              <q-tab name="info" label="Info" ></q-tab>
              <q-tab name="graph" label="Live Charts" ></q-tab>
              <q-tab name="data" label="Historical Trades" ></q-tab>
            </q-tabs>
            <q-btn-dropdown flat round dense icon="settings" >
              <q-list>
                <q-item>
                  <q-toggle
                        @input="toggleDark()"
                        v-model="darkMode"
                        label="Dark Mode"
                ></q-toggle>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-toolbar>
        </q-header>

        <q-drawer
                v-model="leftDrawerOpen"
                show-if-above
                :width="400"
                :breakpoint="500"
                bordered
                content-class="bg-grey-3"
        >
          <TradingStream :key="darkMode"></TradingStream>
        </q-drawer>

        <q-page-container>
          <q-page padding>
            <q-tab-panels v-model="tab">
              <q-tab-panel name="info">
                <h2 class="text-primary text-center text-weight-bold">Cryptostream Overview</h2>
                <h6 class="text-secondary">Cryptostream is a project designed by two MIT Students
                  (Ian McJohn and Sebastian Mendez), in order to make the high-volume trading data available to
                  automated/quant crypto trading software useful to more casual traders as well. It provides a
                  variety of features that allow traders to access this data in a format which can be useful for
                  manual executions. Cryptostream intends to be a platform that provides useful data for a variety of applications,
                  ranging from more serious day trading to someone who simply wants to buy or sell some crypto and would
                  like data that can help them determine which exchange will get them fair market value.
                  <br>
                  <br>
                  A good place to start is with the trading stream, which is accessible through the drawer icon in the upper left,
                  and from there you can filter current executions by exchange, cryptocurrency type, and more. From there,
                  the more advanced features are available in the upper right tabs, and if you want to customize the
                  interface to your liking, be sure to check out the settings pane! If you have any questions, comments,
                  or feedback on the design, feel free to reach out at <a href="mailto:cryptostream@mit.edu" class="text-info">cryptostream@mit.edu</a>
                  </h6>
              </q-tab-panel>
              <q-tab-panel name="graph">
                <LiveCharts :key="darkMode"></LiveCharts>
              </q-tab-panel>
              <q-tab-panel name="data">
                <HistoricalData :key="darkMode"></HistoricalData>
              </q-tab-panel>
            </q-tab-panels>
          </q-page>
        </q-page-container>
      </q-layout>
    </div>
  </div>
</template>

<script>
import HistoricalData from './components/HistoricalData.vue'
import TradingStream from './components/TradingStream.vue'
import LiveCharts from './components/LiveCharts.vue'

export default {

  name: 'LayoutDefault',

  components: {
    HistoricalData,
    TradingStream,
    LiveCharts
  },

  data () {
    return {
      leftDrawerOpen: false,
      tab: 'info',
      darkMode: localStorage.getItem('notDarkMode') !== 'true' // we do it backwards so default is dark mode
    }
  },

  created(){
    this.$q.dark.set(this.darkMode);
  },

  methods: {
    toggleDark: function(){
      localStorage.setItem('notDarkMode',String(!this.darkMode));
      this.$q.dark.set(this.darkMode);
    }
  }
}
</script>

<style lang="scss">
  @import "../node_modules/ag-grid-community/dist/styles/ag-grid.css";
  @import "../node_modules/ag-grid-community/dist/styles/ag-theme-balham-dark.css";
  @import "../node_modules/ag-grid-community/dist/styles/ag-theme-balham.css";
</style>
