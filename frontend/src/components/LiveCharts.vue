<template>
  <q-page>
    <div class="q-gutter-xs row" style="max-width: 790px">
      <div class="col">
        <q-select
                filled
                v-model="symbols"
                multiple
                :options="options"
                label="Select Data Sources"
                @input = "addRemSeries"
                style="width: 250px"
        ></q-select>
      </div>
      <div class="col">
        <q-badge color="secondary">
          Number of visible data points (50 to 100)
        </q-badge>
        <q-slider width="250px" @input = "onFrameChange" v-model="visiblePoints" :min="50" :max="100"></q-slider>
      </div>
      <div class="col">
        <q-badge color="secondary">
          Start and stop graph updates
        </q-badge><br>
        <q-btn color="primary" :label="pausePlay" @click="pauseGraph"></q-btn>
      </div>
    </div>

    <apexchart width="100%" height="750px" type="line" :options="chartOptions" :series="series"></apexchart>
  </q-page>
</template>

<style>
</style>

<script>
  import solaceWrapper from '../solaceHelpers';
  let TopicSubscriber = solaceWrapper.TopicSubscriber;

  export default {
  name: 'LiveCharts',
  data() {
    // eslint-disable-next-line no-unused-vars
    let self = this;
    return {
      globalIndex : 0,
      chartPush : null, // need so can clear interval at end
      visiblePoints : 50,
      chartData : {}, // stored in format {name : series values}
      chartIndicies : [],
      series : [],
      options : [],
      symbols: [],
      ticks: {},
      index : 0,
      chartOptions: {},
      pause : false,
      pausePlay : 'Pause Graph'
    }
  },
  created() {
    this.createChart();
    this.updateOptions();
  },
  beforeDestroy(){
    clearInterval(this.chartPush);
  },
  methods :{
    pauseGraph(){
      if (this.pause){
        this.pausePlay = 'Pause Graph';
      }
      else
        this.pausePlay = 'Start Graph';
      this.pause = !this.pause;
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
    updateOptions(){
      let self = this;
      this.apiQuery('/localapi/livesymbols', function(data){
        self.options = JSON.parse(data);
        self.options.push('Sample Data');
      });
    },
    onFrameChange(){
      // eslint-disable-next-line no-console
      console.log(this.minRange + ' ' + this.maxRange);
      // I hate that this is how I have to do this, but that is the spec for the graph
      let optCopy = {
        chart : {
          id: 'realtime',
          type : 'line',
          animations: {
            enabled: true,
            easing: 'linear',
            dynamicAnimation: {
              speed: 1000
            }
          },
        },
        dataLabels : {enabled : false},
        stroke : {curve : 'smooth'},
        title : {text: 'Live Data Stream', align : 'center'},
        grid: {
          yaxis : {lines : {show : false}}
        },
        yaxis : {forceNiceScale : true, decimalsInFloat: 2},
        markers : {
          size : 0,
        },
        xaxis : {
          range : this.visiblePoints,
          labels : {show : false}
        },
        legend : {
          show : true,
          showForSingleSeries : true
        },
        theme: {mode: this.$q.dark.isActive ? 'dark' : 'light'},
      };
      this.chartOptions = optCopy;
    },
    handleUpdate(data){
      this.ticks = JSON.parse(data); // load updated tick data when desired
    },
    createChart(){
      let subscriber = new TopicSubscriber('live-charts','wss://mr1u6o37qngl6d.messaging.solace.cloud:20740','solace-cloud-client', 'SOLACE_PASSWORD','SOLACE_VPN',this.handleUpdate);
      subscriber.connect();
      this.chartPush = setInterval(this.randomPush,1000);
      this.onFrameChange();
    },
    updateSeries(){
      // take our data and convert it into oddly designed graph format
      let newSeries = [];
      for (var key in this.chartData){
        if (this.chartData[key]) { // to avoid deleted bois
          newSeries.push({
            data: this.chartData[key],
            name: key
          });
        }
      }
      if (!this.pause)
        this.series = newSeries;
    },
    resetData(){
      for (var key in this.chartData){
        if (this.chartData[key]) {
          let old = this.chartData[key];
          if (old.length - this.visiblePoints > 0) // don't bother slicing if not long enough
            this.chartData[key] = old.slice(old.length - this.visiblePoints, old.length);
        }
      }
    },
    randomPush(){
      // push sample data
      let sampleData1 = Math.random() * 1000 + 8000;
      if (this.chartData['Sample Data'])
        this.chartData['Sample Data'].push([this.globalIndex,sampleData1]);

      // push actual data
      for (var key in this.chartData){
        if (key == 'Sample Data' || !this.chartData[key]) continue;
        this.chartData[key].push([this.globalIndex,this.ticks[key]]);
      }

      // handle indicies and cleanup
      this.index++;
      this.globalIndex++;
      if (this.index >= this.visiblePoints * 3) {
        this.resetData();
        this.index = 0;
      }
      this.updateSeries();

    },
    addRemSeries(){
      // eslint-disable-next-line no-console
      let cl = (x) => {console.log(JSON.stringify(x))};
      cl(this.symbols);
      cl(this.chartIndicies);
      cl(this.ticks);

      let self = this;
      // add all new symbols
      this.symbols.forEach(function(elem){
        if (!self.chartIndicies.includes(elem)){
          self.chartIndicies.push(elem);
          self.chartData[elem] = [];
        }
      });

      // remove all old symbols that are no longer selected
      this.chartIndicies.forEach(function(chartToDel){
        if (!self.symbols.includes(chartToDel)){
          self.chartIndicies = self.chartIndicies.filter((ele) => {return ele !== chartToDel});
          self.chartData[chartToDel] = undefined;
        }
      });
    }
  },
  components: {
  }
}
</script>
