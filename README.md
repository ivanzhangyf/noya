# Noya

The open interface design tool.

![Noya app screenshot](/docs/assets/noya-screenshot.png)

> Note: This project is actively under development and not ready for use yet!

## Why?

The design tool ecosystem is mostly closed source, furthering the gap between
design and engineering. This project aims to bridge that gap.

## Packages

The project is broken up into packages that can be included indepently. Here's a
quick summary of the key packages:

- [App](/packages/app) - The reference app of a design tool built with these
  packages
- [State](/packages/noya-state) - Manages the internal state of the UI and
  `.sketch` file
- [Renderer](/packages/noya-renderer) - Render a `.sketch` file to an HTML5
  canvas (via Google's
  [Skia compiled to webassembly](https://www.npmjs.com/package/canvaskit-wasm))
- [Sketch File](/packages/noya-sketch-file) - Parse a `.sketch` file into JSON
- [Color Picker](/packages/noya-colorpicker) - A React component for picking
  colors (based on [react-colorful](https://github.com/omgovich/react-colorful))

## Development Setup

To install, navigate to the root directory and run:

```
yarn
```

Then, to launch the reference app:

```
yarn start
```

This project is built with https://github.com/jpmorganchase/modular, which is an
abstraction layer on top of yarn workspaces.

## Running Tests

To run tests for all packages, run:

```
yarn test
```

To run tests for a specific package, e.g. `noya-sketch-file`, run:

```
yarn test noya-sketch-file
```
