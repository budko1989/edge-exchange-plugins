// @flow

import { gt, lt } from 'biggystring'
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

import { makeSwapPluginQuote } from '../swap-helpers.js'

const swapInfo = {
  pluginName: 'godex',
  displayName: 'godex',

  quoteUri: 'https://godex.io/exchange/status/#',
  supportEmail: 'support@godex.io'
}

const API_PREFIX = 'https://api.godex.io/api/v1'

type GodexQuoteJson = {
  swap_id: string,
  created_at: string,
  deposit_address: string,
  deposit_amount: number,
  deposit_currency: string,
  spot_price: number,
  price: number,
  price_locked_at: string,
  price_locked_until: string,
  withdrawal_amount: number,
  withdrawal_address: string,
  withdrawal_currency: string,
  refund_address?: string,
  user_id?: string,
  terms?: string
}

const dontUseLegacy = {
  DGB: true
}

export function makeGodexPlugin (opts: EdgeCorePluginOptions): EdgeSwapPlugin {
  const { io, initOptions } = opts

  io.console.info(initOptions);


  async function call (json: any) {
    const body = JSON.stringify(json)
    const sign = base16
        .stringify(hmacSha512(parseUtf8(body), secret))
        .toLowerCase()

    io.console.info('godex call:', json)
    const headers = {
      'Content-Type': 'application/json',
      // 'api-key': apiKey,
      sign
    }
    const reply = await fetchJson(uri, { method: 'POST', body, headers })
    if (!reply.ok) {
      throw new Error(`Changelly returned error code ${reply.status}`)
    }
    const out = reply.json
    io.console.info('changelly reply:', out)
    return out
  }

  const out: EdgeSwapPlugin = {
    swapInfo,

    async fetchSwapQuote (
      request: EdgeSwapRequest,
      userSettings: Object | void
    ): Promise<EdgeSwapPluginQuote> {
      io.console.info(request);
      io.console.info(userSettings);

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
        call({
          jsonrpc: '2.0',
          id: 'one',
          method: 'getMinAmount',
          params: {
            from: request.fromCurrencyCode,
            to: request.toCurrencyCode
          }
        }),
        call({
          jsonrpc: '2.0',
          id: 'two',
          method: 'getExchangeAmount',
          params: quoteParams
        })
      ])
      checkReply(quoteReplies[0])
      checkReply(quoteReplies[1])

      // Calculate the amounts:
      let fromAmount, fromNativeAmount, toNativeAmount
      if (request.quoteFor === 'from') {
        fromAmount = quoteAmount
        fromNativeAmount = request.nativeAmount
        toNativeAmount = await request.toWallet.denominationToNative(
            quoteReplies[1].result,
            request.toCurrencyCode
        )
      } else {
        fromAmount = mul(quoteReplies[1].result, '1.02')
        fromNativeAmount = await request.fromWallet.denominationToNative(
            fromAmount,
            request.fromCurrencyCodequoteAmount
        )
        toNativeAmount = request.nativeAmount
      }


      io.console.info(fromNativeAmount);

      // Convert that to the output format:
      return makeSwapPluginQuote(
        request,
        fromNativeAmount,
        toNativeAmount,
        tx,
        toAddress,
        'godex',
        new Date(quoteData.price_locked_until),
        quoteData.swap_id
      )
    }
  }

  io.console.info(out);
  return out
}