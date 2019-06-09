/* eslint-disable no-undef */
const { assert } = require('chai')
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const Table = require('cli-table')

/** 
 * Consists of lighthouse test configuration. 
 * You can find more about the available configuration here :
 * https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md
*/
const config = require('./config.json')

const table = new Table()

// Define your test url.
const testUrl = 'http://localhost:9000'


function launchChromeAndRunLighthouse(url, opts, conf = null) {
  return chromeLauncher.launch({ chromeFlags: opts.chromeFlags }).then(chrome => {
    opts.port = chrome.port
    return lighthouse(url, opts, conf).then(res =>
      /** use results.lhr for the JS-consumeable output
      * use results.report for the HTML/JSON/CSV output as a string
      * use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      * https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
      */
      chrome.kill().then(() => res.lhr)
    )
  })
}

const opts = {
  // Flash green overlays on paint updates
  chromeFlags: ['--show-paint-rects'],
}

describe('Lighthouse PWA Testing', function () {
  // Timeout doesn't need to be same. It can be more or less depending on your project.
  this.timeout(50000)
  let results
  before('run base test', done => {
    launchChromeAndRunLighthouse(testUrl, opts, config).then(res => {
      results = Object.keys(res.categories).reduce((merged, category) => {
        merged[category] = res.categories[category].score
        return merged
      }, {})
      done()
    })
  })

  it('should have performance score greater than 90', done => {
    assert.equal(results.performance > 0.9, true)
    done()
  })
  it('should have accessibility score greater than 90', done => {
    assert.equal(results.accessibility > 0.9, true)
    done()
  })
  it('should have best practices score greater than 90', done => {
    assert.equal(results['best-practices'] > 0.9, true)
    done()
  })
  it('should have seo score greater than 90', done => {
    assert.equal(results.seo > 0.9, true)
    done()
  })
  it('should have pwa score greater than 90', done => {
    assert.equal(results.pwa > 0.9, true)
    done()
  })

  after(() => {
    Object.keys(results).forEach(category => {
      table.push([category, Math.round(results[category] * 100)])
    })
    // Output lighthouse scores in a table format within the cli.
    console.log(table.toString())
  })
})
