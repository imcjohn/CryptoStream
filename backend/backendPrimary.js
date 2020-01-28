var PRODUCTION = false;
console.log(process.argv);
if (process.argv.includes('--prod'));
    PRODUCTION = true;

const handler = require('serve-handler');
const WebSocket = require('ws');
const TopicPublisher = require('./TopicPublisher.js').TopicPublisher;
const SymbolBook = require('./SymbolBook.js').SymbolBook;
const DataChart = require('./DataChart.js').BitcoinChart;

var proxyPort = 8080;
if (PRODUCTION)
    proxyPort = 3000;

//define outgoing publishing connections
var solace = require('solclientjs');
// Initialize factory with the most recent API defaults
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);
// enable logging to JavaScript console at WARN level
// NOTICE: works only with ('solclientjs').debug
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

var createSolaceConnection = (topic) => {
    var tp = new TopicPublisher(solace, topic, 'wss://mr1u6o37qngl6d.messaging.solace.cloud:20740', 'solace-cloud-client', 'SOLACE_PASSWORD', 'SOLACE_VPN',PRODUCTION);
    return tp
};

var dataPublisher = createSolaceConnection('live-charts');
var chart = new DataChart(dataPublisher);
chart.startRunning();

//const apiKey = 'COINAPI_API_KEY';

function startWebForwarder() {
    //define incoming websocket
    var ws = new WebSocket('wss://ws.coinapi.io/v1/');
    ws.on('open', function open() {
        var hello = {
            "type": "hello",
            "apikey": apiKey,
            "heartbeat": false,
            "subscribe_data_type": ["trade"],
            "subscribe_filter_asset_id": ["BTC", "USD"]
        };
        ws.send(JSON.stringify(hello));
    });

    var publisher = createSolaceConnection('incoming-trades');

    // Tie output of coinapi to TopicPublisher
    var packet = {add: []};
    const PACKET_SIZE = 128;
    var yeetsWindow = 0;
    // var emaYeets = 0;
    // var emaN = 0;
    //
    // function yeetsPerSecond() {
    //     var yeetsPerSecond = yeetsWindow;
    //     yeetsWindow = 0;
    //     emaN++;
    //     var k = 2 / (emaN + 1);
    //     emaYeets = yeetsPerSecond * k + emaYeets * (1 - k);
    //     console.log(emaYeets + ' yeets per second');
    // }
    //setInterval(yeetsPerSecond, 1000);

    ws.on('message', function incoming(data) {
        var incomingTrade = JSON.parse(data);
        var exPair = incomingTrade.symbol_id.split('_'); // soon, split this appropriately (according to coinapi reference)
        var symbolPair = exPair[2] + '_' + exPair[3];
        var outgoingTrade = {
            'exchange': exPair[0],
            'exchange_type': exPair[1],
            'pair': symbolPair,
            'quantity': incomingTrade.size,
            'price': incomingTrade.price
        };
        chart.processTrade(outgoingTrade); // sometimes chart needs packets for metrics
        packet.add.push(outgoingTrade);
        if (packet.add.length >= PACKET_SIZE) {
            var lp = packet;
            packet = {add: []};
            yeetsWindow++;
            publisher.publish(JSON.stringify(lp));
        }
    });
    publisher.run();
}

// Web proxy interface
var http = require('http'),
    httpProxy = require('http-proxy');

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({changeOrigin:true});
var symbols = new SymbolBook;
symbols.loadSymbols(apiKey); // populate list once, it rarely changes

// To modify the proxy connection before data is sent, you can listen
// for the 'proxyReq' event. When the event is fired, you will receive
// the following arguments:
// (http.ClientRequest proxyReq, http.IncomingMessage req,
//  http.ServerResponse res, Object options). This mechanism is useful when
// you need to modify the proxy request before the proxy connection
// is made to the target.
//
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('X-CoinAPI-Key', apiKey);
});

var server = http.createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    if (req.url.includes('/coinapi')){
        req.url = req.url.split('/coinapi')[1];
        proxy.web(req, res, {
            target: 'https://rest.coinapi.io' // url of coinapi
        });
    }
    else if (req.url.includes('/localapi/symbols')){
        var urlSplit = req.url.split('/');
        var symbolType = urlSplit[3]; // format is /localapi/symbols/symbol_type/exchange_id
        var exchangeType = urlSplit[4];
        res.write(symbols.getSymbols(symbolType,exchangeType));
        res.end();
    }
    else if (req.url.includes('/localapi/exchanges')){
        var urlSplit = req.url.split('/');
        var symbolType = urlSplit[3]; // format is /localapi/exchanges/symbol_type/
        res.write(symbols.getExchanges(symbolType));
        res.end();
    }
    else if (req.url.includes('/localapi/livesymbols')){
        res.write(chart.listAllSymbols());
        res.end();
    }
    else {
        proxy.web(req, res, {
            target: 'http://127.0.0.1:'+proxyPort // url of actual cryptostream server
        });
    }
});

var runProd = function(){
    const server = http.createServer((request, response) => {
        // You pass two more arguments for config and middleware
        // More details here: https://github.com/zeit/serve-handler#options
        return handler(request, response, {"public" : "../dist"});
    });

    server.listen(3000, () => {
        console.log('Running prod static server at http://localhost:3000');
    });
};

startWebForwarder(); // forward data to cryptostream table

if (PRODUCTION) {
    setTimeout(runProd, 10);
}
console.log("Full CryptoStream server listening on port 5050");
server.listen(5050);
