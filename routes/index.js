let express = require('express');
let router = express.Router();

const Web3 = require("web3");
const network = "https://sepolia.infura.io/v3/c87917d2e5b44ee0838a44d9dbd76835"; //https://app.infura.io/dashboard/ethereum/c87917d2e5b44ee0838a44d9dbd76835/settings/endpoints
const web3 = new Web3(new Web3.providers.HttpProvider(network));

const publicAddress = "0x719310a459efC58aE8f2597AC6E3cd27Ba37d88c";
const privateKey = "e6f85392a762a72d8c528d16f0c9efef65ff8f7c035e818d76df902de87b2ac6"; //not the mnemonic phrase

router.get('/', async function(req, res) {
    res.render('index', {
        balance: await getBalance(publicAddress),
        error: req.flash('error'),
        success: req.flash('success'),
        address: publicAddress
    });
});

router.post('/', async function (req, res) {
    let ethAmount = req.body.amount;
    let address = req.body.address;

    if (ethAmount === undefined || ethAmount === "") {
        req.flash('error', "The amount to sent must be given.");
        res.redirect("/");
        return;
    }

    if (isNaN(ethAmount)) {
        req.flash('error', "The amount must be numeric.");
        res.redirect("/");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "The recipient address must be given.");
        res.redirect("/");
        return;
    }

    if (!web3.utils.isAddress(address)) {
        req.flash('error', 'The recipient address is invalid. Make sure it is on the ETH network.');
        res.redirect("/");
        return;
    }

    try {
        let txId = await sendEthereum(address, ethAmount);
        req.flash('success', ethAmount + " ETH sent successfully to " + address
            + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'>Transaction #"
            + txId + "</a>.");
        res.redirect("/");
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/');
    }
});

async function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, (err, result) => {
            if (err) {
                return reject(err);
            }
            const eth = web3.utils.fromWei(result, "ether");
            resolve(parseFloat(eth).toFixed(5));
        });
    });
}

async function sendEthereum(toAddress, ethAmount) {
    const txInfo = {
        from: publicAddress,
        to: toAddress,
        value: web3.utils.toWei(ethAmount.toString(), 'ether'),
        gas: '21000'
    };
    const tx = await web3.eth.accounts.signTransaction(txInfo, privateKey);
    const result = await web3.eth.sendSignedTransaction(tx.rawTransaction);
    return result.transactionHash;
}

module.exports = router;
