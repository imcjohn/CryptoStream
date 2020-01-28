<template>
    <ag-grid-vue style="width: 100%; height: 100%;" :class="gridClass"
                 :rowData="rowData"
                 :columnDefs="columnDefs"
                 :gridOptions="gridOptions"
                 :modules="modules"
                 @grid-ready="onGridReady"
    >
    </ag-grid-vue>
</template>

<script>
    /* eslint no-console: "off" */
    import {AgGridVue} from "@ag-grid-community/vue";
    import solaceWrapper from '../solaceHelpers';
    // for community features
    //import {AllCommunityModules} from "@ag-grid-community/all-modules";
    // for enterprise features
    import {AllModules} from "@ag-grid-enterprise/all-modules";
    import {LicenseManager} from "@ag-grid-enterprise/core";
    //LicenseManager.setLicenseKey('AG_GRID_LICENSE');
    export default {
        name: "TradingStream",
        data() {
            return {
                gridOptions: {animateRows: true,
                    suppressHorizontalScroll: true,
                    defaultColDef : { filterParams: { newRowsAction: 'keep'}},
                    floatingFilter : true,
                },
                rowData: this.rowData,
                columnDefs: this.columnDefs,
                modules: AllModules,
                batchUpdateWaitMillis : 50,
                gridClass: this.$q.dark.isActive? 'ag-theme-balham-dark':'ag-theme-balham'
            }
        },
        components: {
            'ag-grid-vue': AgGridVue
        },
        methods: {
            addRowData(datas){
                let rows = datas.add;
                let oldRows = [];
                this.packetCache.push(rows);
                if (this.packetCache.length >= this.MAX_PACKETS){
                    oldRows = this.packetCache.shift();
                }
                // Add a list of rows to the grid
                let transaction = {add: rows, remove: oldRows, addIndex:0}; // add to top
                this.gridApi.batchUpdateRowData(transaction);
                //this.gridApi.updateRowData(transaction);
            },
            solaceInit(){
                // Set up solace
                let self = this;
                let TopicSubscriber = solaceWrapper.TopicSubscriber;
                let handler = (msg) => {
                    let loaded = JSON.parse(msg);
                    self.addRowData(loaded);
                };
                let subscriber = new TopicSubscriber('incoming-trades','wss://mr1u6o37qngl6d.messaging.solace.cloud:20740','solace-cloud-client','SOLACE_PASSWORD','SOLACE_VPN',handler);
                subscriber.connect();
            },
            onGridReady(params) {
                this.MAX_PACKETS = 100; // increase for prod
                this.packetCache = [];
                this.gridApi = params.api;
                this.columnApi = params.columnApi;
                this.gridApi.sizeColumnsToFit();
                this.solaceInit();
            }
        },
        created() {
            // data created here so outside of vue (ie no reactive, not observed)
            // also frozen (prob unnecessarily)
            this.rowData = [];
            this.columnDefs = Object.freeze([
                {headerName: 'Exchange', field: 'exchange', filter : 'agTextColumnFilter'},
                {headerName: 'Trade Pair', field: 'pair', filter : 'agTextColumnFilter'},
                {headerName: 'Quantity', field: 'quantity', filter : 'agNumberColumnFilter'},
                {headerName: 'Price', field: 'price', filter : 'agNumberColumnFilter'}
            ])
        }
    }
</script>

<style>
</style>
