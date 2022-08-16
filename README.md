# lwc-codemod

Codemods for [LWC](https://lwc.dev/). In other words: scripts to transform LWC component code.

Currently it can convert components from shadow DOM to [light DOM](https://lwc.dev/guide/light_dom#light-dom-(developer-preview)) and from synthetic shadow DOM to [native shadow DOM](https://rfcs.lwc.dev/rfcs/lwc/0115-mixed-shadow-mode).

## Installation

```sh
npm i -g lwc-codemod
```

Or, to avoid installing globally, use `npx lwc-codemod`.

## Basic usage

```sh
lwc-codemod <transform> <path>
```

When you pass in a `<path>`, the script will crawl all components inside of that path:

```sh
lwc-codemod <transform> /path/to/my/components/
```

## Transforms

Available transforms:

- [Shadow DOM to Light DOM](#shadow-dom-to-light-dom) (`shadow-to-light`)
- [Synthetic Shadow DOM to Native Shadow DOM](#synthetic-shadow-dom-to-native-shadow-dom) (`synthetic-to-native`)

### Shadow DOM to Light DOM

#### Usage

```sh
lwc-codemod shadow-to-light <directory>
```

#### Summary

Converts components from shadow DOM to light DOM.

#### JS

- Adds `static renderMode = 'light'`
- `this.template` -> `this` (and destructuring equivalents)

#### HTML

- Adds `lwc:render-mode="light"`
- Removes `lwc:dom="manual"`

#### CSS

- Moves `foo.css` to `foo.scoped.css`

#### `lwc:dom="manual"`

For this case, the styles still need to be scoped to the `lwc:dom="manual"` tree. So the codemod creates an additional global CSS file containing selectors to replace e.g. `div` with `.auto-generated div`, where `auto-generated` is a class applied to `lwc:dom="manual"` nodes.

#### Slots

For slots, a wrapper `<div>` is created around the `<slot>`so that this `<div>` can be targeted in the CSS and have events attached to it, e.g. `onscroll` events.

`onslotchange` is currently not implemented. As an alternative, you can use [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) or explicit signalling between components to notify of changes. 

### Synthetic Shadow DOM to Native Shadow DOM

#### Usage

```sh
lwc-codemod synthetic-to-native <path>
```

#### Summary

Converts components from synthetic shadow to native shadow.

The only transformation it currently applies is to add the `static shadowSupportMode` property. Any other discrepancies between native shadow and synthetic shadow will have to be handled manually.

## Contributing

Install dependencies:

```sh
yarn
```

Run tests:

```sh
yarn test
```

Run the linter:

```sh
yarn lint
```


