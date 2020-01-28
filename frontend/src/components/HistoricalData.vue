<template>
  <q-page>
    <ag-grid-vue style="width: 100%; height: 1000px;" :class="gridClass"
               :rowData="rowData"
               :columnDefs="columnDefs"
               :gridOptions="gridOptions"
               :modules="modules"
               @grid-ready="onGridReady">
   </ag-grid-vue>

    <q-dialog v-model="loadPopup">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Import Data</div>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section>
          <div class="text-primary">Select Symbol</div>
          <q-select filled v-model="symbolType" :options="options" label="Select Symbol Type" @input="onTypeChange"></q-select>
          <q-select
                  filled
                  v-model="exchange"
                  use-input
                  input-debounce="0"
                  label="Select Exchange"
                  :options="visibleExchanges"
                  @filter="filterExchanges"
                  @input="onExchangeChange"
                  behavior="menu"
          ></q-select>
          <q-select
                  filled
                  v-model="symbol"
                  use-input
                  input-debounce="0"
                  label="Select Symbol"
                  :options="visibleSymbols"
                  @filter="filterSymbols"
                  behavior="menu"
          ></q-select>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section>
          <div class="text-primary">Select Date Range</div>
          <q-input filled label="Start Date (UTC)" v-model="startDate">
            <template v-slot:prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="startDate" mask="YYYY-MM-DD HH:mm" ></q-date>
                </q-popup-proxy>
              </q-icon>
            </template>

            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-time v-model="startDate" mask="YYYY-MM-DD HH:mm" format24h ></q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input filled label="End Date (UTC)" v-model="endDate">
            <template v-slot:prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date v-model="endDate" mask="YYYY-MM-DD HH:mm" ></q-date>
                </q-popup-proxy>
              </q-icon>
            </template>

            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-time v-model="endDate" mask="YYYY-MM-DD HH:mm" format24h ></q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-section>
          <div class="text-primary">Max Number of Trades to Import</div>
          <q-input filled label="Max Import Quantity" v-model.number="maxTrades"></q-input>
        </q-card-section>
        <q-separator></q-separator>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" @click="loadPopup = false" ></q-btn>
          <q-btn flat label="Load Data" @click="loadPopup = false; loadData();" ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<style>
</style>

<script>
// eslint-disable-next-line no-unused-vars
import {AgGridVue} from "@ag-grid-community/vue";
// eslint-disable-next-line no-unused-vars
import {AllModules} from "@ag-grid-enterprise/all-modules";
import {LicenseManager} from "@ag-grid-enterprise/core";
LicenseManager.setLicenseKey('Evaluation_License_Not_For_Production_10_February_2020__MTU4MTI5MjgwMDAwMA==c397c8c505c24acd78f7f762944752d8');
export default {
  name: 'HistoricalData',
  data() {
    let self = this;
    return {
      gridOptions: {animateRows: true,
        suppressHorizontalScroll: true,
        defaultColDef : { filterParams: { newRowsAction: 'keep'}},
        floatingFilter : true,
        statusBar: {
          statusPanels: [
            { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
            { statusPanel: 'agTotalRowCountComponent', align: 'center' },
          ]
        },
        overlayNoRowsTemplate: 'There is currently no data loaded. Right click to import historical data from the exchange(s) of your choosing',
        // eslint-disable-next-line no-unused-vars
        getContextMenuItems: function(params){
          let result = [
            {
              // custom item
              icon: '&#65291;\n',
              name: 'Import Data',
              action: function() {
                self.loadPopup = true;
              },
            },
            {
              // custom item
              name: 'Autosize Columns',
              action: function() {
                self.gridApi.sizeColumnsToFit();
              },
            },
            {
              // custom item
              name: 'Clear Data',
              action: function() {
                self.gridApi.setRowData([]);
              },
            },
            'separator',
            'copy',
            'copyWithHeaders',
            'export'
          ];
          return result;
        }
      },
      loadPopup: false,
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      modules: AllModules,
      gridClass: this.$q.dark.isActive? 'ag-theme-balham-dark':'ag-theme-balham',
      // below are the variables for the form
      startDate: '2019-02-01 12:44',
      endDate: '2019-02-01 12:44',
      maxQuantity: 100,
      symbolType: '',
      exchange: '',
      symbol: '',
      // semi-constant variables for form
      options: ['SPOT','FUTURES','OPTION','PERPETUAL','INDEX'],
      exchanges: [],
      visibleExchanges: [],
      symbols: [],
      visibleSymbols: [],
      maxTrades: 0
    }
  },
  created() {
    this.rowData = [];
    this.columnDefs = Object.freeze([
      {headerName: 'Exchange', field: 'exchange', filter : 'agTextColumnFilter'},
      {headerName: 'Trade Type', field: 'type', filter : 'agTextColumnFilter'},
      {headerName: 'Trade Pair', field: 'pair', filter : 'agTextColumnFilter'},
      {headerName: 'Time of Trade', field: 'date', filter : 'agDateColumnFilter'},
      {headerName: 'Quantity', field: 'size', filter : 'agNumberColumnFilter'},
      {headerName: 'Price', field: 'price', filter : 'agNumberColumnFilter'}
    ]);
  },
  methods :{
    onGridReady(params){
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
      this.gridApi.sizeColumnsToFit();
      // eslint-disable-next-line no-console
    },
    apiQuery(link,callback){
      let httpRequest = new XMLHttpRequest();
      httpRequest.open('GET', link);
      httpRequest.send();
      httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
          callback(httpRequest.responseText);
        }
      };
    },
    filterFn (val, update,visible,full) {
      if (val === '') {
        update(() => {
          if (visible === 'exchanges')
            this.visibleExchanges = full;
          else
            this.visibleSymbols = full;
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase();
        let tempVisible = full.filter(v => v.toLowerCase().indexOf(needle) > -1);
        if (visible === 'exchanges')
          this.visibleExchanges = tempVisible;
        else
          this.visibleSymbols = tempVisible;
      })
    },
    filterExchanges(val,update){
      this.filterFn(val,update,'exchanges',this.exchanges);
    },
    filterSymbols(val,update){
      this.filterFn(val,update,'symbols',this.symbols);
    },
    onTypeChange(){
      // update list of exchanges on change of selected equity type
      let self = this;
      let updateCB = function(data){
        self.exchange='';
        self.exchanges=JSON.parse(data);
        self.visibleExchanges=self.exchanges;
      };
      this.apiQuery('/localapi/exchanges/'+this.symbolType,updateCB);
    },
    onExchangeChange(){
      // update list of symbols based on selected exchange
      let self = this;
      let updateCB = function(data){
        self.symbol='';
        self.symbols=JSON.parse(data);
        self.visibleSymbols=self.symbols;
      };
      this.apiQuery('/localapi/symbols/'+this.symbolType+'/'+this.exchange,updateCB);
    },
    toISO8601(rawTime){
      // convert from human-readable to iso 8601. Could be done with less lines, but this is easy to follow if
      // we ever have to change it
      let yearTime = rawTime.split(' ');
      let fullDate = yearTime[0];
      let fullTime = yearTime[1]+'Z';
      let isoTime = `${fullDate}T${fullTime}`;
      return isoTime;
    },
    loadData(){
      // eslint-disable-next-line no-unused-vars
      let self = this;
      let gridCB = function(data){
        let trades = JSON.parse(data);
        if (trades.length == 0){
          self.$q.notify({color: 'purple', message: 'No data points found for the selected timeframe'});
          return;
        }
        trades.forEach((x)=>{
          let s_split = x.symbol_id.split('_');
          let date = new Date(x.time_exchange);
          x.exchange = s_split[0];
          x.type = s_split[1];
          x.pair = x.symbol_id.split(x.type+'_')[1];
          x.date = date;
        });
        self.gridApi.setRowData(trades);
        self.$q.notify({color: 'green', message:`${trades.length} trades loaded`});
      };
      let symbolId = this.symbol;
      let timeStart = this.toISO8601(this.startDate);
      let timeEnd = this.toISO8601(this.endDate);
      let queryString = `/coinapi/v1/trades/${symbolId}/history?time_start=${timeStart}&time_end=${timeEnd}&limit=${this.maxTrades}`;
      this.apiQuery(queryString,gridCB);
    }
  },
  components: {
    'ag-grid-vue': AgGridVue
  }
}
</script>
