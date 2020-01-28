// Right now, this is just a pretty basic interface to provide chart data in a format the fronend can use, and
// it likely will continue to evolve once the charts start to support things that aren't bitcoin.
const https = require('https');
function BitcoinChart(solConn){
    let chart = {};
    chart.solConn = solConn;
    chart.symbols = [];
    chart.symbolUpdaters = {};
    chart.ticks = {};
    chart.bitcoinAverageIndex = []; // cool average metric to help showcase the live data stream
    chart.prevIndex = 0;
    chart.processTrade = function(trade){
      // right now only used for bitcoin average index, who know's whats to come!
        if (trade.pair == 'BTC_USD' || trade.pair == 'BTC_USDT'){
            chart.bitcoinAverageIndex.push([trade.price,trade.quantity]);
        }
    };

    chart.addSymbol = function(symbol,update){
        // add a symbol, plus it's update function, to the book
        chart.symbols.push(symbol);
        chart.ticks[symbol] = 0;
        chart.symbolUpdaters[symbol] = update;
    };

    chart.updateAllSymbols = function(){
        // do one tick of all the symbols
        chart.symbols.forEach(function(symbol){
           chart.symbolUpdaters[symbol](chart.ticks);
        });
        chart.solConn.publish(JSON.stringify(chart.ticks));
    };

    chart.listAllSymbols = function(){
        return JSON.stringify(chart.symbols);
    };

    chart.startRunning = function(interval){
        // update all symbols at interval <interval>
        interval = interval || 950; // standard update period of 750ms
        setInterval(chart.updateAllSymbols,interval);
        setTimeout(chart.solConn.run,50);
    };

    var bitfinexUpdater = function(ticks) {
        // good example updater, also means we have some data from the start
        var options = {
            "method": "GET",
            "hostname": "api-pub.bitfinex.com",
            "path": "/v2/tickers?symbols=tBTCUSD"
        };
        var request = https.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            var cbc = function(){
                try {
                    var loaded = JSON.parse(chunks);
                    var symbol = loaded[0][7]; // bitfinex uses arrays instead of real json idk why
                }
                catch(err){ // bitfinex api is not always consistent, don't let the whole program crash
                    return;
                }
                ticks['Bitfinex_BTC_USD'] = symbol;
            }; // add data to callback
            response.on('end',cbc);
        });
        request.end();
    };
    var bitcoinAggUpdater = function(ticks){
        // aggregate all trades from the second, simple weighted average
        var count = 0;
        var sum = 0;
        for (var i = 0; i < chart.bitcoinAverageIndex.length; i++){
            var price = chart.bitcoinAverageIndex[i][0];
            var weight = chart.bitcoinAverageIndex[i][1];
            sum += price * weight;
            count += weight;
        }
        chart.bitcoinAverageIndex = [];
        var currentI = sum / count;
        if (currentI == 0)
            currentI = this.prevIndex; // if nothing happened during that second, just resend tick
        else
            this.prevIndex = currentI
        ticks['Aggregated_BTC_USD'] = currentI;
    };
    chart.addSymbol('Bitfinex_BTC_USD',bitfinexUpdater);
    chart.addSymbol('Aggregated_BTC_USD',bitcoinAggUpdater);
    return chart;
}
exports.BitcoinChart = BitcoinChart;