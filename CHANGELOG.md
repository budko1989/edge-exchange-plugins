# edge-exchange-plugins

# 0.8.1 (2019-08-22)

- Change GoDex transactions to fixed rate

# 0.8.0 (2019-08-14)

- Add Coinswitch as swap partner

# 0.7.3 (2019-08-06)

- Fix ShapeShift auth error logic.
- Fix ShapeShift quote expiration dates.

# 0.7.2 (2019-08-06)

- Change display name for Fox Exchange

# 0.7.1 (2019-08-03)

- Fix apiKey variable name for GoDex

# 0.7.0 (2019-07-29)

- Integrate Fox and GoDex as swap partners

# 0.6.12 (2019-07-25)

- Allow Totle transactions between wallets

# 0.6.11 (2019-07-24)

- Set nativeAmount for outgoing Totle tx after broadcast

# 0.6.10 (2019-07-22)

- Upgrade faa.st plugin.
- Fix crashes on old Android WebView versions.

# 0.6.9 (2019.07-13)

- Implement currency-not-supported error for Totle transactions between different ETH wallets

# 0.6.8 (2019-07-12)

- Add more info to readme
- Fix Totle unavailable swap pair case

# 0.6.6 (2019-07-09)

- Enable HERC and AGLD exchange rate fix

# 0.6.5 (2019-06-04)

- fix error when currency is temporarily disabled

# 0.6.4 (2019-06-04)

- fix amount string instead of number error

# 0.6.3 (2019-06-04)

- fixed upper case issue with currency code

# 0.6.2 (2019-06-04)

- Changelly fixed rate quotes in both directions.
- ChangeNOW fixed quote amount displayed to user.
- ChangeNOW added catch for below minimum.

# 0.6.1 (2019-05-21)

- Add `isEstimate` flags to swap quotes.

# 0.6.0 (2019-04-29)

- Add Shapeshift and Faa.st swap plugins.

# 0.5.7 (2019-04-25)

- Fix missing Nomics exchange rates issue

# 0.5.6 (2019-04-19)

- Add Nomics exchange rates
- Add new HERC endpoint

# 0.5.5 (2019-04-09)

- Add exchange rates from Coincap *legacy* API

# 0.5.4 (2019-04-03)

- Upgrade to the coincap.io v2 API.

# 0.5.3 (2019-02-26)

- Move ChangeNow into this repo for CORS reasons
- Migrate Coincap to new API

# 0.5.2 (2019-02-21)

- Fix currencyconverterapi to use the production server, not the free server

# 0.5.1 (2019-02-21)

- Fix CORS issues with currencyconverterapi
- Add an API key to currencyconverterapi
- Move changelly into this repo for CORS reasons

# 0.5.0 (2019-02-19)

- Upgrade to the edge-core-js v0.15.0 and adapt to breaking changes.

# 0.4.1 (2019-02-15)

- Upgrade to the edge-core-js v0.14.0 types
- Modernize the build system

# 0.4.0

- Add HERC exchange rate support

## 0.3.0

- Add currencyconverterapi.com plugin for IMP and IRR support only

## 0.2.1

- Switch to v2 of Coinbase API

## 0.2.0

- Add CoinCap support

## 0.1.0

- Initial release
- Coinbase & Shapeshift
