// @flow

import {gt, lt} from 'biggystring'
import {
    type EdgeCorePluginOptions,
    type EdgeCurrencyWallet,
    type EdgeSpendInfo,
    type EdgeSpendTarget,
    type EdgeSwapPlugin,
    type EdgeSwapPluginQuote,
    type EdgeSwapRequest,
    SwapAboveLimitError,
    SwapBelowLimitError,
    SwapCurrencyError,
    SwapPermissionError
} from 'edge-core-js/types'
import {base16} from 'rfc4648'
import hashjs from 'hash.js'
import utf8Codec from 'utf8'


import {makeSwapPluginQuote} from '../swap-helpers.js'
import {getFetchJson} from "../react-native-io";


function hmacSha512(data: Uint8Array, key: Uint8Array): Uint8Array {
    const hmac = hashjs.hmac(hashjs.sha512, key)
    return hmac.update(data).digest()
}

const swapInfo = {
    pluginName: 'godex',
    displayName: 'godex',

    quoteUri: 'https://godex.io/exchange/status/#',
    supportEmail: 'support@godex.io'
}

const uri = 'https://api.godex.io/api/v1/'
// const uri = 'http://api.gdxapp.com:8082/api/v1/'


const expirationMs = 1000 * 60 * 20


function parseUtf8(text: string): Uint8Array {
    const byteString: string = utf8Codec.encode(text)
    const out = new Uint8Array(byteString.length)

    for (let i = 0; i < byteString.length; ++i) {
        out[i] = byteString.charCodeAt(i)
    }

    return out
}

// const API_PREFIX = 'https://api.godex.io/api/v1'

type QuoteInfo = {
    // swap_id: string,
    transaction_id: string,
    status: string,
    coin_from: string,
    coin_to: string,
    deposit_amount: string,
    withdrawal_amount: string,
    deposit: string,
    deposit_extra_id: string,
    withdrawal: string,
    withdrawal_extra_id: string,
    rate: string,
    fee: string,
    return: string,
    return_extra_id: string,
    final_amount: string,
    hash_in: string,
    hash_out: string,
    // created_at: string,
    // deposit_address: string,
    // deposit_amount: number,
    // deposit_currency: string,
    // deposit: string,
    // spot_price: number,
    // price: number,
    // price_locked_at: string,
    // price_locked_until: string,
    // withdrawal_amount: number,
    // withdrawal_address: string,
    // withdrawal_currency: string,
    // refund_address?: string,
    // user_id?: string,
    // terms?: string
}

const dontUseLegacy = {
    DGB: true
}

async function getAddress(wallet: EdgeCurrencyWallet, currencyCode: string) {
    const addressInfo = await wallet.getReceiveAddress({currencyCode})
    return addressInfo.legacyAddress && !dontUseLegacy[currencyCode]
        ? addressInfo.legacyAddress
        : addressInfo.publicAddress
}


export function makeGodexPlugin(opts: EdgeCorePluginOptions): EdgeSwapPlugin {
    const {io, initOptions} = opts
    const fetchJson = getFetchJson(opts)

    io.console.info(initOptions);


    async function call(url, data) {
        io.console.info('url:', url);
        io.console.info('call data:', data)
        io.console.info('call data:', data.params)
        // const body = data.params;
        const body = JSON.stringify(data.params)
        //   io.console.info(body);
        // const sign = base16
        //     .stringify(hmacSha512(parseUtf8(body), secret))
        //     .toLowerCase()
        // const sign = base16
        //     .stringify(hmacSha512(parseUtf8(body)))
        //     .toLowerCase()

        // io.console.info('sign')
        // io.console.info(sign)
        io.console.info('godex call:', url)
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 'api-key': apiKey,
            // sign
        }
        const reply = await fetchJson(url, {method: 'POST', body, headers})
        io.console.info('godex reply:', reply);
        if (!reply.ok) {
            throw new Error(`godex returned error code ${reply.status}`)
        }
        const out = reply.json
        io.console.info('godex reply status ok:', out)
        return out
    }

    const out: EdgeSwapPlugin = {
        swapInfo,

        async fetchSwapQuote(
            request: EdgeSwapRequest,
            userSettings: Object | void
        ): Promise<EdgeSwapPluginQuote> {
            io.console.info(request);
            io.console.info(userSettings);

            // Grab addresses:
            const [fromAddress, toAddress] = await Promise.all([
                getAddress(request.fromWallet, request.fromCurrencyCode),
                getAddress(request.toWallet, request.toCurrencyCode)
            ]);
            io.console.info('from address:' + fromAddress);
            io.console.info('to address:' + toAddress);


            // const fromNativeAmount = await fromWallet.denominationToNative(
            //     quoteData.deposit_amount.toString(),
            //     fromCurrencyCode
            // )
            // const toNativeAmount = await toWallet.denominationToNative(
            //     quoteData.withdrawal_amount.toString(),
            //     toCurrencyCode
            // )


            // Convert the native amount to a denomination:
            const quoteAmount =
                request.quoteFor === 'from'
                    ? await request.fromWallet.nativeToDenomination(
                    request.nativeAmount,
                    request.fromCurrencyCode
                    )
                    : await request.toWallet.nativeToDenomination(
                    request.nativeAmount,
                    request.toCurrencyCode
                    )
            io.console.info('godex quoteAmount:', quoteAmount);

            // Swap the currencies if we need a reverse quote:
            const quoteParams =
                request.quoteFor === 'from'
                    ? {
                        from: request.fromCurrencyCode,
                        to: request.toCurrencyCode,
                        amount: quoteAmount
                    }
                    : {
                        from: request.toCurrencyCode,
                        to: request.fromCurrencyCode,
                        amount: quoteAmount
                    }

            // Get the estimate from the server:
            const quoteReplies = await Promise.all([
                call(uri + 'info', {
                    params: quoteParams
                    // params: {
                    //   amount: quoteAmount,
                    //   from: quoteParams.from,
                    //   to:  quoteParams.to
                    // }
                }),
                // ,
                call(uri + 'info-revert',{
                  params: quoteParams
                })
            ])
            io.console.info('godex info api');
            // checkReply(quoteReplies)
            // checkReply(quoteReplies.min_amount)
            // checkReply(quoteReplies.amount)
            io.console.info(quoteReplies);
            io.console.info('min_amount:' + quoteReplies[0].min_amount);
            io.console.info('amount:' + quoteReplies[0].amount);
            io.console.info('min_amount quoteReplies[1]:' + quoteReplies[1].min_amount);
            io.console.info('amount quoteReplies[1]:' + quoteReplies[1].amount);
            // checkReply(quoteReplies[0])
            // checkReply(quoteReplies[1])

            // Calculate the amounts:
            let fromAmount, fromNativeAmount, toNativeAmount
            if (request.quoteFor === 'from') {
                io.console.info('Calculate the amounts from');
                fromAmount = quoteAmount
                fromNativeAmount = request.nativeAmount
                toNativeAmount = await request.toWallet.denominationToNative(
                    // quoteReplies[1].result,
                    quoteReplies[0].amount.toString(),
                    request.toCurrencyCode
                )
            } else {
                io.console.info('Calculate the amounts to');
                // fromAmount = mul(quoteReplies[1].result, '1.02')
                fromAmount = quoteReplies[0].amount
                fromNativeAmount = await request.fromWallet.denominationToNative(
                    fromAmount,
                    request.fromCurrencyCode
                    // request.fromCurrencyCodequoteAmount
                )
                toNativeAmount = request.nativeAmount
            }
            io.console.info('fromNativeAmount' + fromNativeAmount);
            io.console.info('toNativeAmount' + toNativeAmount);


            // Check the minimum:
            const nativeMin = await request.fromWallet.denominationToNative(
                quoteReplies[0].min_amount,
                request.fromCurrencyCode
            )
            if (lt(fromNativeAmount, nativeMin)) {
                throw new SwapBelowLimitError(swapInfo, nativeMin)
            }
            io.console.info('nativeMin' + nativeMin);


            const sendReply = await call(uri + 'transaction',
                {
                    // route: uri+'transaction',
                    params: {
                        deposit_amount: fromAmount,
                        coin_from: request.fromCurrencyCode,
                        coin_to: request.toCurrencyCode,
                        // address: toAddress,
                        withdrawal: toAddress,
                        return: fromAddress,
                        // return_extra_id: 'empty',
                        // withdrawal_extra_id: 'empty',
                        return_extra_id: null,
                        withdrawal_extra_id: null,
                        type: 'demo'
                        // return: fromAddress
                    }
                })
            io.console.info('sendReply' + sendReply);
            io.console.info('sendReply result' + sendReply.deposit);
            const quoteInfo: QuoteInfo = sendReply;
            // io.console.info('QuoteInfo'+quoteInfo);

            // Make the transaction:
            const spendInfo = {
                currencyCode: request.fromCurrencyCode,
                spendTargets: [
                    {
                        nativeAmount: fromNativeAmount,
                        // publicAddress: quoteInfo.payinAddress,
                        publicAddress: quoteInfo.deposit,
                        otherParams: {
                            uniqueIdentifier: quoteInfo.deposit_extra_id
                        }
                    }
                ]
            }
            io.console.info('godex spendInfo', spendInfo)

            const tx = await request.fromWallet.makeSpend(spendInfo)
            tx.otherParams.payinAddress = spendInfo.spendTargets[0].publicAddress
            tx.otherParams.uniqueIdentifier =
                spendInfo.spendTargets[0].otherParams.uniqueIdentifier


            // Convert that to the output format:
            return makeSwapPluginQuote(
                request,
                fromNativeAmount,
                toNativeAmount,
                tx,
                toAddress,
                'godex',
                new Date(Date.now() + expirationMs),
                // quoteInfo.swap_id
                quoteInfo.transaction_id
            )
        }
    }

    io.console.info(out);
    return out
}
