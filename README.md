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
    npm install git+https://github.com/alttiri/util-node-js.git#semver:1.5.2
    ```
    Or add 
    ```
    "@alttiri/util-node-js": "github:alttiri/util-node-js#semver:1.5.2"
    ```
    as `dependencies` in `package.json` file.
    
    See availables [tags](https://github.com/AlttiRi/util-node-js/tags).

- **Based on a commit hash:**
    ```bash
    npm install git+ssh://git@github.com/alttiri/util-node-js.git#c62f105d7aa0778219d0083576c57fcb9ded633a
    ```
    Or add 
    ```
    "@alttiri/util-node-js": "github:alttiri/util-node-js#c62f105d7aa0778219d0083576c57fcb9ded633a"
    ```
    as `dependencies` in `package.json` file.
    
    See availables [commits hashes](https://github.com/AlttiRi/util-node-js/commits/master).



### From GitHub Packages:
To install you need fisrt to create `.npmrc` file with `@alttiri:registry=https://npm.pkg.github.com` content:
```bash
echo @alttiri:registry=https://npm.pkg.github.com >> .npmrc
```

only then run

```bash
npm install @alttiri/util-node-js
```
Note, that GitHub Packages requires to have also `~/.npmrc` file (`.npmrc` in your home dir) with `//npm.pkg.github.com/:_authToken=TOKEN` content, where `TOKEN` is a token with the `read:packages` permission, take it here https://github.com/settings/tokens/new. 



</details>


