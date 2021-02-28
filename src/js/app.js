(function() {

    let DOM = {};
    let currentTableIndex = -1;

    function init() {
        loadDom();
        setEvents();
    }

    function loadDom() {
        DOM.generate = byId("generate");
        DOM.masterPublicKey = byId("master-public-key");
        DOM.masterSecretKey = byId("master-secret-key");
        DOM.mnemonic = byId("mnemonic");
        DOM.passphrase = byId("passphrase");
        DOM.strength = byId("strength");
        DOM.seed = byId("seed");
        DOM.derivedKeys = byId("derived-keys");
        DOM.keyRow = byId("key-row");
        DOM.path = byId("path");
        DOM.suggestedPaths = document.querySelectorAll(".suggested-path");
        DOM.moreRows = byId("more-rows");
        DOM.numRows = byId("num-rows");
        DOM.startIndex = byId("start-index");
        DOM.languages = document.querySelectorAll(".languages a");
    }

    function setEvents() {
        debounce(DOM.mnemonic, "input", mnemonicChanged);
        DOM.generate.addEventListener("click", generate);
        debounce(DOM.passphrase, "input", processMnemonic);
        debounce(DOM.seed, "input", seedChanged);
        debounce(DOM.masterSecretKey, "input", masterSecretKeyChanged);
        debounce(DOM.path, "input", pathChanged);
        DOM.moreRows.addEventListener("click", showRows);
        DOM.suggestedPaths.forEach(function(e, i) {
            e.addEventListener("click", setSuggestedPath);
        });
        DOM.languages.forEach(function(e, i) {
            e.addEventListener("click", languageChanged);
        });
    }

    // Event handlers
    function generate(e) {
        if (e) {
            e.preventDefault();
        }
        let language = getLanguage();
        libs.bip39.setDefaultWordlist(language);
        let strength = parseInt(DOM.strength.value);
        let mnemonic = libs.bip39.generateMnemonic(strength);
        DOM.mnemonic.value = mnemonic;
        processMnemonic();
    }

    function mnemonicChanged(e) {
        e.preventDefault();
        processMnemonic();
    }

    function languageChanged(e) {
        let hasMnemonic = DOM.mnemonic.value.length > 0;
        if (hasMnemonic) {
            from = libs.bip39.getDefaultWordlist();
            let to = e.target.getAttribute("href").substring(1);
            libs.bip39.setDefaultWordlist(to);
            let oldMnemonic = DOM.mnemonic.value;
            newMnemonic = convertMnemonicLanguage(oldMnemonic, from, to);
            DOM.mnemonic.value = newMnemonic;
            processMnemonic();
        }
        else {
            generate();
        }
    }

    function processMnemonic() {
        let mnemonic = DOM.mnemonic.value;
        // TODO verify?
        let passphrase = DOM.passphrase.value;
        seed = libs.bip39.mnemonicToSeedSync(mnemonic, passphrase);
        let seedHex = bytesToHex(seed);
        DOM.seed.value = seedHex;
        seedChanged();
    }

    function seedChanged(e) {
        // warn user before erasing an existing mnemonic
        if (e && DOM.mnemonic.value.length > 0) {
            if (!confirm("This will erase any existing mnemonic and passphrase. Continue?")) {
                processMnemonic(); // revert seed from previous mnemonic+passphrase
                return;
            }
            DOM.mnemonic.value = "";
            DOM.passphrase.value = "";
        }
        let seedHex = DOM.seed.value;
        let seed = hexToBytes(seedHex);
        let masterSecretKey = libs.blskeygen.deriveMaster(seed);
        DOM.masterSecretKey.value = bytesToHex(masterSecretKey).padStart(32, "0");
        masterSecretKeyChanged();
    }

    function masterSecretKeyChanged(e) {
        // warn user before erasing any existing data
        if (e && DOM.seed.value.length > 0) {
            if (!confirm("This will erase any existing mnemonic, passphrase and seed. Continue?")) {
                seedChanged(); // revert master secret key from previous seed
                return;
            }
            DOM.mnemonic.value = "";
            DOM.passphrase.value = "";
            DOM.seed.value = "";
        }
        let masterSecretKey = new hexToBytes(DOM.masterSecretKey.value);
        let masterPublicKey = libs.noblebls.getPublicKey(masterSecretKey);
        DOM.masterPublicKey.value = bytesToHex(masterPublicKey);
        clearTable();
        showRows();
    }

    function pathChanged(e) {
        if (e) {
            e.preventDefault();
        }
        clearTable();
        showRows();
    }

    function setSuggestedPath(e) {
        e.preventDefault();
        let path = e.target.textContent;
        DOM.path.value = path;
        pathChanged();
    }

    function showRows() {
        let rowsToAdd = parseInt(DOM.numRows.value);
        let startIndex = parseInt(DOM.startIndex.value) || currentTableIndex + 1;
        let masterSecretKey = hexToBytes(DOM.masterSecretKey.value);
        // TODO validate masterSecretKey
        let template = DOM.keyRow.innerHTML;
        let path = DOM.path.value;
        for (let i=startIndex; i<startIndex+rowsToAdd; i++) {
            let childPath = path.replace(/i/g, i);
            let childIndices = getIndices(childPath);
            let childSk = masterSecretKey;
            for (let i=0; i<childIndices.length; i++) {
                let childIndice = childIndices[i];
                try {
                    childSk = libs.blskeygen.deriveChild(childSk, childIndice);
                }
                catch (e) {
                    // TODO show error?
                    return;
                }
            }
            let childPk = libs.noblebls.getPublicKey(childSk);
            // show in table
            let childSkHex = bytesToHex(childSk);
            let childPkHex = bytesToHex(childPk);
            let temp = document.createElement("tbody");
            temp.innerHTML = template;
            let row = temp.children[0];
            row.querySelectorAll(".path")[0].textContent = childPath;
            row.querySelectorAll(".public")[0].textContent = childPkHex;
            row.querySelectorAll(".secret")[0].textContent = childSkHex;
            DOM.derivedKeys.appendChild(row);
            currentTableIndex = i;
        }
    }

    // Util functions

    function getLanguage() {
        let h = location.hash;
        for (language in libs.bip39.wordlists) {
            if (h.indexOf(language) > -1) {
                return language;
            }
        }
        return "english";
    }

    function byId(id) {
        return document.getElementById(id);
    }

    // https://stackoverflow.com/a/34356351
    function hexToBytes(hex) {
        let bytes = new Uint8Array(hex.length/2);
        for (let c = 0; c < hex.length; c += 2)
            bytes[c/2] = parseInt(hex.substr(c, 2), 16);
        return bytes;
    }
    function bytesToHex(bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
            var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
            hex.push((current >>> 4).toString(16));
            hex.push((current & 0xF).toString(16));
        }
        return hex.join("");
    }

    function clearTable() {
        DOM.derivedKeys.innerHTML = "";
        currentTableIndex = -1;
        DOM.startIndex.value = ""
    }

    function getIndices(path) {
        let indices = [];
        let bits = path.split("/");
        for (let i=0; i<bits.length; i++) {
            let indice = parseInt(bits[i]);
            if (!(isNaN(indice))) {
                indices.push(indice);
            }
        }
        return indices;
    }

    function convertMnemonicLanguage(oldMnemonic, oldLang, newLang) {
        // get words
        let oldWords = oldMnemonic.split(/\s+/g);
        // get indices
        let indices = [];
        let oldWordlist = libs.bip39.wordlists[oldLang];
        for (let i=0; i<oldWords.length; i++) {
            let oldWord = oldWords[i];
            let indice = oldWordlist.indexOf(oldWord);
            if (indice == -1) {
                console.log("Could not find word in bip39 list: " + oldWord);
            }
            else {
                indices.push(indice);
            }
        }
        // convert indices to new words
        let newWordlist = libs.bip39.wordlists[newLang];
        let newWords = [];
        for (let i=0; i<indices.length; i++) {
            let indice = indices[i];
            let newWord = newWordlist[indice];
            newWords.push(newWord);
        }
        // convert new words to new mnemonic
        let newMnemonic = newWords.join(" ");
        if (newLang == "japanese") {
            newMnemonic = newWords.join('\u3000');
        }
        return newMnemonic;
    }

    init();

})();
