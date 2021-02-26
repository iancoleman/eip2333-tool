Tests are manual at this stage, but will be automated in the near future.

All the [EIP2333 test cases 0-3](https://eips.ethereum.org/EIPS/eip-2333#test-cases)
have been manually tested.

Test case 0

To convert decimal test values to hex in javascript, eg master_SK:
6083874454709270928345386274498605044986640685124978867557563392430687146096n.toString(16)

Seed: c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04
Master Secret Key : 0d7359d57963ab8fbbde1852dcf553fedbc31f464d80ee7d40ae683122b45070
Path: m/0
Child Secret Key: 2d18bd6c14e6d15bf8b5085c9b74f3daae3b03cc2014770a599d8c1539e50f8e

Test case 0a

Mnemonic: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
Passphrase: TREZOR
Seed, Master Secret Key, Path, ChildSecretKey: see above

Test case 1

Seed: 3141592653589793238462643383279502884197169399375105820974944592
Master Secret Key: 41c9e07822b092a93fd6797396338c3ada4170cc81829fdfce6b5d34bd5e7ec7
Path: m/3141592653
Child Secret Key: 384843fad5f3d777ea39de3e47a8f999ae91f89e42bffa993d91d9782d152a0f

Test case 2

Seed: 0099FF991111002299DD7744EE3355BBDD8844115566CC55663355668888CC00
Master Secret Key: 3cfa341ab3910a7d00d933d8f7c4fe87c91798a0397421d6b19fd5b815132e80
Path: m/4294967295
Child Secret Key: 40e86285582f35b28821340f6a53b448588efa575bc4d88c32ef8567b8d9479b

Test case 3

Seed: d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3
Master Secret Key: 2a0e28ffa5fbbe2f8e7aad4ed94f745d6bf755c51182e119bb1694fe61d3afca
Path: m/42
Child Secret Key: 455c0dc9fccb3395825d92a60d2672d69416be1c2578a87a7a3d3ced11ebb88d
