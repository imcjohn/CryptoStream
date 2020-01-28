# cryptostream
CryptoStream is designed (by Ian McJohn and Sebastian Mendez) to provide an efficent interface for Crypto traders to get access to realtime market data, in an easy to view format. It is being developed primarily for presentation at the MIT ProjXpo, and MIT XFair. The main source tree is on MIT Enterprise Github, so I created this branch so that anyone who is interested in seeing the code behind the site, or contributing outside of the MIT Ecosystem can take a look. Hopefully, we will be migrating off of MIT Github soon. If you're interested in seeing a beta version of it in action, check out [cryptostream.mit.edu](http://cryptostream.mit.edu). 


## Project setup
```
The frontend is available as a webstorm project in the frontend folder, and compiles into the dist directory in order to be used by the backend. In addition, the (simple) backend is available as a few node files in the backend directory. Simply fill in the appropriate variables for Solace and CoinAPI credentials in the frontend directory, compile and run, in order to fully build it.
```

### Compiles and hot-reloads for development (frontend)
```
npm run serve
```

### Compiles and minifies frontend for production (then copy dist directory into top level folder)
```
npm run build
```

### Run production build
```
bash ./run.sh
```

