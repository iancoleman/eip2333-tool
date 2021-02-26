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
    }

    // Event handlers
    function generate(e) {
        e.preventDefault();
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

    function processMnemonic() {
        let mnemonic = DOM.mnemonic.value;
        // TODO verify?
        let passphrase = DOM.passphrase.value;
        seed = libs.bip39.mnemonicToSeedSync(mnemonic, passphrase);
        let seedHex = seed.toString("hex");
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
        let seedBuffer = libs.buffer.Buffer(seed);
        let masterSecretKey = libs.blshdkey.deriveMasterSK(seedBuffer);
        DOM.masterSecretKey.value = masterSecretKey.toString("hex").padStart(32, "0");
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
        let masterSecretKey = new libs.buffer.Buffer(hexToBytes(DOM.masterSecretKey.value));
        let masterPublicKey = libs.noblebls.getPublicKey(masterSecretKey);
        DOM.masterPublicKey.value = libs.buffer.Buffer(masterPublicKey).toString("hex");
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
        let masterSecretKey = new libs.buffer.Buffer(hexToBytes(DOM.masterSecretKey.value));
        let template = DOM.keyRow.innerHTML;
        let path = DOM.path.value;
        for (let i=startIndex; i<startIndex+rowsToAdd; i++) {
            let childPath = path.replace("i", i);
            // libs.blshdkey.pathToIndices is too strict
            let childIndices = childPath.replace("m/", "").split("/").map(function(e) { return parseInt(e) });
            let childSk = masterSecretKey;
            for (let i=0; i<childIndices.length; i++) {
                let childIndice = childIndices[i];
                childSk = libs.blshdkey.deriveChildSK(childSk, childIndice);
            }
            let childPk = libs.noblebls.getPublicKey(childSk);
            // show in table
            let childSkHex = new libs.buffer.Buffer(childSk).toString("hex");
            let childPkHex = new libs.buffer.Buffer(childPk).toString("hex");
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
        // TODO
        return "english";
    }

    function byId(id) {
        return document.getElementById(id);
    }

    // https://stackoverflow.com/a/34356351
    function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    function clearTable() {
        DOM.derivedKeys.innerHTML = "";
        currentTableIndex = -1;
        DOM.startIndex.value = ""
    }

    init();

})();
