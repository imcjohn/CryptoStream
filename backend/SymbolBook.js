const https = require('https');
function SymbolBook(){
    // creates and fully populates a symbol book based on the data from coinapi
    var book = {};
    book.SPOT = {};
    book.FUTURES = {};
    book.OPTION = {};
    book.PERPETUAL = {};
    book.INDEX = {};
    book.loadApi = function (callback,apiKey){
        var options = {
            "method": "GET",
            "hostname": "rest.coinapi.io",
            "path": "/v1/symbols",
            "headers": {'X-CoinAPI-Key': apiKey}
        };

        var request = https.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            var cbc = ()=>{callback(chunks);}; // add data to callback
            response.on('end',cbc);
        });

        request.end();
    };
    book.populateBook = function (chunks){
        var combined = chunks.join('');
        var symbols = JSON.parse(combined);
        symbols.forEach(function(item){
            var bookPosition = book[item.symbol_type];
            if (bookPosition[item.exchange_id] === undefined){
                // first instance of this exchange
                bookPosition[item.exchange_id] = new Set();
            }
            bookPosition[item.exchange_id].add(item.symbol_id);
        });
    };
    book.loadSymbols = function(apiKey){
        book.loadApi(book.populateBook,apiKey);
    };
    book.getSymbols = function(symb,exchange){
        return JSON.stringify(Array.from(book[symb][exchange])); // want to send json as array
    };
    book.getExchanges = function(symb){
        return JSON.stringify(Object.keys(book[symb]));
    };
    return book;
}
exports.SymbolBook = SymbolBook;

