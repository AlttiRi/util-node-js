# util-node-js

## Installation

### From GitHub Packages:
To install you need fisrt to create `.npmrc` file with `@alttiri:registry=https://npm.pkg.github.com` content:
```bash
echo @alttiri:registry=https://npm.pkg.github.com >> .npmrc
```

only then run

```bash
npm install @alttiri/util-node-js
```
Note, that GitHub Packages requires to have also `~/.npmrc` file with `//npm.pkg.github.com/:_authToken=TOKEN` content, where `TOKEN` is a token with the `read:packages` permission, take it here https://github.com/settings/tokens/new. 

### From GitHub:
Install the lastest version from GitHub directly:
```bash
npm install git+https://github.com/alttiri/util-node-js.git
```

To install a specific version (based on git tag):
```bash
npm install git+https://github.com/alttiri/util-node-js.git#semver:1.5.1
```

No need extra actions.
