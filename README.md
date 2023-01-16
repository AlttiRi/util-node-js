# util-node-js




## Installation

### From NPM

```bash
npm install @alttiri/util-node-js
```

### From GitHub repository

```bash
npm install git+https://github.com/alttiri/util-node-js.git
```

<details>

<summary>More ways</summary>

### From GitHub repository (a specific version):

- **Based on SemVer:**
    ```bash
    npm install git+https://github.com/alttiri/util-node-js.git#semver:1.6.0
    ```
    Or add 
    ```
    "@alttiri/util-node-js": "github:alttiri/util-node-js#semver:1.6.0"
    ```
    as `dependencies` in `package.json` file.
    
    See available [tags](https://github.com/AlttiRi/util-node-js/tags).

- **Based on a commit hash:**
    ```bash
    npm install git+https://git@github.com/alttiri/util-node-js.git#c98d3919e9002fa5738680a2c76004fd12746ce3
    ```
    Or add
    ```
    "@alttiri/util-node-js": "github:alttiri/util-node-js#c98d3919e9002fa5738680a2c76004fd12746ce3"
    ```
    as `dependencies` in `package.json` file.
    
    See available [commits hashes](https://github.com/AlttiRi/util-node-js/commits/master).


### From GitHub Packages:
To install you need first to create `.npmrc` file with `@alttiri:registry=https://npm.pkg.github.com` content:
```bash
echo @alttiri:registry=https://npm.pkg.github.com >> .npmrc
```

only then run

```bash
npm install @alttiri/util-node-js
```
Note, that GitHub Packages requires to have also `~/.npmrc` file (`.npmrc` in your home dir) with `//npm.pkg.github.com/:_authToken=TOKEN` content, where `TOKEN` is a token with the `read:packages` permission, take it here https://github.com/settings/tokens/new. 

</details>
