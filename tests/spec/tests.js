// Usage:
// cd /path/to/repo/tests
// jasmine spec/tests.js
//
// see /path/to/repo/tests/readme.md for more info

// USER SPECIFIED OPTIONS
var browser = process.env.BROWSER; //"firefox"; // or "chrome"
if (!browser) {
    console.log("Browser can be set via environment variable, eg");
    console.log("BROWSER=firefox jasmine spec/tests.js");
    console.log("Options for BROWSER are firefox chrome");
    console.log("Using default browser: chrome");
    browser = "chrome";
}
else {
    console.log("Using browser: " + browser);
}

// Globals

var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;
var until = webdriver.until;
var newDriver = null;
var driver = null;
var generateDelay = 1500; // milliseconds

// url uses file:// scheme
var path = require('path')
var parentDir = path.resolve(process.cwd(), '..', 'src', 'index.html');
var url = "file://" + parentDir;
if (browser == "firefox") {
    // TODO loading local html in firefox is broken
    console.log("Loading local html in firefox is broken, see https://stackoverflow.com/q/46367054");
    console.log("You must run a server in this case, ie do this:");
    console.log("$ cd /path/to/eip2333-tool/src");
    console.log("$ python -m http.server");
    url = "http://localhost:8000";
}

// Variables dependent on specific browser selection

if (browser == "firefox") {
    var firefox = require('selenium-webdriver/firefox');
    var options = new firefox.Options().setBinary(firefox.Channel.NIGHTLY);
    options.addArguments("-headless");
    newDriver = function() {
        return new webdriver.Builder()
              .forBrowser('firefox')
              .setFirefoxOptions(options)
              .build();
    }
}
else if (browser == "chrome") {
    var chrome = require('selenium-webdriver/chrome');
    newDriver = function() {
        return new webdriver.Builder()
          .forBrowser('chrome')
          .setChromeOptions(new chrome.Options().addArguments("headless"))
          .build();
    }
}

// Tests

describe('EIP2333 Tool Tests', function() {

    beforeEach(function(done) {
        driver = newDriver();
        driver.get(url).then(done);
    });

    // Close the website after each test is run (so that it is opened fresh each time)
    afterEach(function(done) {
        driver.quit().then(done);
    });

// BEGIN TESTS

// Page initially loads with blank phrase
it('Should load the page', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .getAttribute('value').then(function(value) {
            expect(value).toBe('');
            done();
        });
});

// Page has text
it('Should have text on the page', function(done) {
    driver.findElement(By.css('body'))
        .getText()
        .then(function(text) {
            var textToFind = "EIP2333 Keys can be generated from a BIP39 mnemonic, or a seed, or a master secret key.";
            expect(text).toContain(textToFind);
            done();
        });
});

// Entering mnemonic generates keys
it('Should have a list of keys', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('.public'))
            .then(function(els) {
                expect(els.length).toBe(20);
                done();
            })
    });
});

// Generate button generates random mnemonic
it('Should be able to generate a random mnemonic', function(done) {
    // initial phrase is blank
    driver.findElement(By.css('#mnemonic'))
        .getAttribute("value")
        .then(function(phrase) {
            expect(phrase.length).toBe(0);
            // press generate
            driver.findElement(By.css('#generate')).click();
            driver.sleep(generateDelay).then(function() {
                // new phrase is not blank
                driver.findElement(By.css('#mnemonic'))
                    .getAttribute("value")
                    .then(function(phrase) {
                        expect(phrase.length).toBeGreaterThan(0);
                        done();
                    });
            });
        });
});

// Mnemonic length can be customized
it('Should allow custom length mnemonics', function(done) {
    // set strength to 12 words, 128 bits
    driver.executeScript(function() {
        document.querySelectorAll("#strength option[selected]")[0].removeAttribute("selected");
        document.querySelectorAll("#strength option[value='128']")[0].setAttribute("selected", true);
    });
    driver.findElement(By.css('#generate')).click();
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#mnemonic'))
            .getAttribute("value")
            .then(function(phrase) {
                var words = phrase.split(/\s+/g);
                expect(words.length).toBe(12);
                done();
            });
    });
});

// EIP2333 Test Case 0
// https://eips.ethereum.org/EIPS/eip-2333#test-cases
it('Passes EIP2333 Test Case 0', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.findElement(By.css('#passphrase'))
        .sendKeys('TREZOR');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('#seed')).then(function(seedEl) {
            seedEl[0].getAttribute("value").then(function(seed) {
                expect(seed).toBe("c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04");
                driver.findElements(By.css('#master-secret-key')).then(function(mskEl) {
                    mskEl[0].getAttribute("value").then(function(msk) {
                        expect(msk).toBe("0d7359d57963ab8fbbde1852dcf553fedbc31f464d80ee7d40ae683122b45070");
                        driver.findElements(By.css('.path')).then(function(paths) {
                            paths[0].getText().then(function(path) {
                                expect(path).toBe("m/0");
                                driver.findElements(By.css('.secret')).then(function(sks) {
                                    sks[0].getText().then(function(sk) {
                                        expect(sk).toBe("2d18bd6c14e6d15bf8b5085c9b74f3daae3b03cc2014770a599d8c1539e50f8e");
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// EIP2333 Test Case 1
// https://eips.ethereum.org/EIPS/eip-2333#test-cases
it('Passes EIP2333 Test Case 1', function(done) {
    driver.findElement(By.css('#seed'))
        .sendKeys('3141592653589793238462643383279502884197169399375105820974944592');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#start-index'))
            .sendKeys('3141592653');
        driver.findElement(By.css('#num-rows'))
            .clear();
        driver.findElement(By.css('#num-rows'))
            .sendKeys('1');
        driver.findElement(By.css('#more-rows'))
            .click();
        driver.findElements(By.css('#master-secret-key')).then(function(mskEl) {
            mskEl[0].getAttribute("value").then(function(msk) {
                expect(msk).toBe("41c9e07822b092a93fd6797396338c3ada4170cc81829fdfce6b5d34bd5e7ec7");
                driver.findElements(By.css('.path')).then(function(paths) {
                    paths[paths.length-1].getText().then(function(path) {
                        expect(path).toBe("m/3141592653");
                        driver.findElements(By.css('.secret')).then(function(sks) {
                            sks[sks.length-1].getText().then(function(sk) {
                                expect(sk).toBe("384843fad5f3d777ea39de3e47a8f999ae91f89e42bffa993d91d9782d152a0f");
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});

// EIP2333 Test Case 2
// https://eips.ethereum.org/EIPS/eip-2333#test-cases
it('Passes EIP2333 Test Case 2', function(done) {
    driver.findElement(By.css('#seed'))
        .sendKeys('0099FF991111002299DD7744EE3355BBDD8844115566CC55663355668888CC00');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#start-index'))
            .sendKeys('4294967295');
        driver.findElement(By.css('#num-rows'))
            .clear();
        driver.findElement(By.css('#num-rows'))
            .sendKeys('1');
        driver.findElement(By.css('#more-rows'))
            .click();
        driver.findElements(By.css('#master-secret-key')).then(function(mskEl) {
            mskEl[0].getAttribute("value").then(function(msk) {
                expect(msk).toBe("3cfa341ab3910a7d00d933d8f7c4fe87c91798a0397421d6b19fd5b815132e80");
                driver.findElements(By.css('.path')).then(function(paths) {
                    paths[paths.length-1].getText().then(function(path) {
                        expect(path).toBe("m/4294967295");
                        driver.findElements(By.css('.secret')).then(function(sks) {
                            sks[sks.length-1].getText().then(function(sk) {
                                expect(sk).toBe("40e86285582f35b28821340f6a53b448588efa575bc4d88c32ef8567b8d9479b");
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});

// EIP2333 Test Case 3
// https://eips.ethereum.org/EIPS/eip-2333#test-cases
it('Passes EIP2333 Test Case 3', function(done) {
    driver.findElement(By.css('#seed'))
        .sendKeys('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3');
    driver.sleep(generateDelay).then(function() {
        driver.findElement(By.css('#start-index'))
            .sendKeys('42');
        driver.findElement(By.css('#num-rows'))
            .clear();
        driver.findElement(By.css('#num-rows'))
            .sendKeys('1');
        driver.findElement(By.css('#more-rows'))
            .click();
        driver.findElements(By.css('#master-secret-key')).then(function(mskEl) {
            mskEl[0].getAttribute("value").then(function(msk) {
                expect(msk).toBe("2a0e28ffa5fbbe2f8e7aad4ed94f745d6bf755c51182e119bb1694fe61d3afca");
                driver.findElements(By.css('.path')).then(function(paths) {
                    paths[paths.length-1].getText().then(function(path) {
                        expect(path).toBe("m/42");
                        driver.findElements(By.css('.secret')).then(function(sks) {
                            sks[sks.length-1].getText().then(function(sk) {
                                expect(sk).toBe("455c0dc9fccb3395825d92a60d2672d69416be1c2578a87a7a3d3ced11ebb88d");
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});

// Secret key is left padded correctly
it('Secret key is left padded correctly', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('ride start reform mouse struggle catch poet setup slight wife decrease pass foster essence tennis');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('.secret')).then(function(sks) {
            sks[13].getText().then(function(sk) {
                expect(sk).not.toBe("e018421ddc2f1530403a00a5fe5f3c0ed2cf49ad8e200f97c6ac51afbaef86");
                expect(sk).toBe("00e018421ddc2f1530403a00a5fe5f3c0ed2cf49ad8e200f97c6ac51afbaef86");
                done();
            });
        });
    });
});

// Selecting a language without an existing mnemonic will generate a random one
// in that language
it('generates a random mnemonic if blank and a language is selected', function(done) {
    driver.findElement(By.css("a[href='#korean']"))
        .click();
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('#mnemonic')).then(function(mnemonicEl) {
            mnemonicEl[0].getAttribute("value").then(function(mnemonic) {
                // A mnemonic is generated
                expect(mnemonic.length).toBeGreaterThan(0);
                // Korean mnemonics do not contain characters a-z
                expect(mnemonic.match(/[a-z]+/)).toBeNull();
                done();
            });
        });
    });
});

// Changing language keeps the same index for each word
it('changing language keeps the same index for each word', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.findElement(By.css("a[href='#italian']"))
        .click();
    driver.findElements(By.css('#mnemonic')).then(function(mnemonicEl) {
        mnemonicEl[0].getAttribute("value").then(function(mnemonic) {
            expect(mnemonic).toBe("abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco abaco abete");
            done();
        });
    });
});

// Changing language changes the seed
it('changing language changes the seed', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    driver.findElements(By.css('#seed')).then(function(seedEl) {
        seedEl[0].getAttribute("value").then(function(originalSeed) {
            driver.findElement(By.css("a[href='#italian']"))
                .click();
            driver.findElements(By.css('#seed')).then(function(newSeedEl) {
                newSeedEl[0].getAttribute("value").then(function(newSeed) {
                expect(newSeed).not.toBe(originalSeed);
                done();
                });
            });
        });
    });
});


// Github issue 2
// https://github.com/iancoleman/eip2333-tool/issues/2
// Mnemonic gives invalid master secret key, 63 chars
it('shows the correct secret key that does not work in v0.1.2 in github releases', function(done) {
    driver.findElement(By.css('#mnemonic'))
        .sendKeys('enough fever tattoo rich walnut engage spin course example witness loan exhaust retire always brush');
    driver.sleep(generateDelay).then(function() {
        driver.findElements(By.css('#master-secret-key')).then(function(mskEl) {
            mskEl[0].getAttribute("value").then(function(msk) {
                expect(msk).toBe("0073427a557244603962453d4c3971646d560333a0d1518619399419e006c34b");
                done();
            });
        });
    });
});

});
